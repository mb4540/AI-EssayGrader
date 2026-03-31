---
description: How to deploy SAG agents to Databricks Model Serving endpoints (Phase 7D — MLflow PythonModel + REST API)
---

# SAG Agent Deployment Workflow

Deploys the 8 SAG agents as MLflow models to Databricks Model Serving endpoints
on the **sag-backend** workspace (`dbc-10400a1c-b271.cloud.databricks.com`).
Agents read/write data from **sag-dev** workspace
(`dbc-30285e24-f917.cloud.databricks.com`) via SQL warehouse.

---

## Architecture Overview

```
Backend API (ECS)
  └── POST /api/runs/:runId/dispatch
        └── AgentDispatcher.invokeOrchestrator()
              └── POST https://sag-backend/serving-endpoints/sag-orchestrator/invocations
                    └── OrchestratorAgent (MLflow PythonModel)
                          Input schema: {"run_id": string}
                          └── HTTP dispatch to sub-agent endpoints (context_json pattern):
                                sag-standards-librarian   ← CRITICAL (pipeline aborts if fails)
                                sag-derating-analyst      ← CRITICAL
                                sag-evidence-builder
                                sag-exception-reviewer
                                sag-report-builder
```

### Two Workspaces

| Workspace | Hostname | Purpose |
|---|---|---|
| sag-dev | `dbc-30285e24-f917.cloud.databricks.com` | SQL warehouse, Unity Catalog data (`sag_catalog.sag`) |
| sag-backend | `dbc-10400a1c-b271.cloud.databricks.com` | Model Serving, MLflow tracking, agent deployment |

### Input Schema Pattern (context_json)

**This is the most important architectural fact about the current deployment.**

MLflow 2.21+ enforces strict schema validation at serving endpoints. Complex
types (list, dict) in the input schema cause HTTP 400 rejections. The fix is
the **context_json pattern**:

- **Orchestrator** input schema: `Schema([ColSpec("string", "run_id")])`
  — receives just the run_id; fetches all other data itself via UC functions.
- **Sub-agents** input schema: `Schema([ColSpec("string", "context_json")])`
  — receive the full orchestrator context serialized as one JSON string.

Orchestrator dispatch:
```python
dispatch_payload = {"context_json": json.dumps(payload, default=str)}
requests.post(url, json={"inputs": dispatch_payload}, ...)
```

Sub-agent deserialize:
```python
_outer = model_input.get("inputs", model_input)
inputs = json.loads(_outer["context_json"]) if "context_json" in _outer else _outer
```

---

## Prerequisites

### 1. Credentials

`~/.sag-databricks-credentials` must contain:
```bash
export DATABRICKS_SERVER_HOSTNAME=dbc-30285e24-f917.cloud.databricks.com
export DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/f60564025c6d6476
export DATABRICKS_WORKSPACE_HOST=dbc-10400a1c-b271.cloud.databricks.com
export DATABRICKS_CLIENT_ID=<service-principal-client-id>
export DATABRICKS_CLIENT_SECRET=<service-principal-client-secret>
export DATABRICKS_CATALOG=sag_catalog
```

Service principal permissions required:
- **sag-dev**: `USE CATALOG` on `sag_catalog`, `USE SCHEMA / SELECT / INSERT /
  UPDATE / DELETE` on `sag_catalog.sag.*`, `CAN USE` on SQL warehouse,
  `MANAGE` on all UC functions in `sag_catalog.sag` (required to fix broken functions)
- **sag-backend**: `CAN MANAGE` on Model Serving, `CAN MANAGE PRODUCTION VERSIONS`
  on UC model registry, MLflow experiment access

### 2. Python Environment

```bash
pip install -r databricks/requirements.txt
```

### 3. Verify Connectivity

```bash
source ~/.sag-databricks-credentials && python databricks/verify_connection.py
```

Expected output: SQL connection shows `sag_catalog` with 20 tables; workspace
API authenticated and lists serving endpoints.

---

## Step 1: UC Functions — Status and Known Issue

### Current Status (as of 2026-02-28)

The agents use UC functions in `sag_catalog.sag` as database tools. These are
split into two groups:

**READ functions (working):** `get_run`, `get_parts_for_project`,
`get_mission_profile`, `get_findings_for_run`, `get_findings_summary`,
`get_pending_tasks_for_run`, `get_run` — these are LANGUAGE SQL and work
correctly in UC serverless.

**READ functions (broken):** `get_rules_for_standard`, `get_rule_for_component`,
`get_active_standards` — these are LANGUAGE PYTHON functions that import
`databricks-sql-connector`, which is **unavailable in UC serverless**. The
`standards_librarian_agent.py` bypasses these with a direct SQL method
(`_get_rules_via_sql`).

**WRITE functions (ALL broken):** `write_trace`, `write_finding`,
`update_run_status`, `update_run_summary`, `create_customer_task`,
`create_waiver`, `write_deliverable`, `write_evidence`,
`write_customer_run_summary` — same root cause: LANGUAGE PYTHON +
`databricks-sql-connector` unavailable in UC serverless. These fail silently
(return `None`) because `_call_uc()` swallows the error:
```python
result = self._uc_client.execute_function(...)
return json.loads(result.value) if result.value else None  # None on failure
```

**Impact:** Nothing gets written to the database (no traces, no findings, no
run status updates) until write UC functions are fixed.

### Fix Required (needs cfisher@jemba9.com)

`mb4540@gmail.com` lacks `MANAGE` on these functions (owned by cfisher). Have
cfisher run this SQL on the sag-dev workspace SQL editor:

```sql
-- Grant MANAGE on all broken functions
GRANT MANAGE ON FUNCTION sag_catalog.sag.write_trace TO `mb4540@gmail.com`;
GRANT MANAGE ON FUNCTION sag_catalog.sag.write_finding TO `mb4540@gmail.com`;
GRANT MANAGE ON FUNCTION sag_catalog.sag.update_run_status TO `mb4540@gmail.com`;
GRANT MANAGE ON FUNCTION sag_catalog.sag.update_run_summary TO `mb4540@gmail.com`;
GRANT MANAGE ON FUNCTION sag_catalog.sag.create_customer_task TO `mb4540@gmail.com`;
GRANT MANAGE ON FUNCTION sag_catalog.sag.create_waiver TO `mb4540@gmail.com`;
GRANT MANAGE ON FUNCTION sag_catalog.sag.write_deliverable TO `mb4540@gmail.com`;
GRANT MANAGE ON FUNCTION sag_catalog.sag.write_evidence TO `mb4540@gmail.com`;
GRANT MANAGE ON FUNCTION sag_catalog.sag.write_customer_run_summary TO `mb4540@gmail.com`;
GRANT MANAGE ON FUNCTION sag_catalog.sag.get_rules_for_standard TO `mb4540@gmail.com`;
GRANT MANAGE ON FUNCTION sag_catalog.sag.get_rule_for_component TO `mb4540@gmail.com`;
GRANT MANAGE ON FUNCTION sag_catalog.sag.get_active_standards TO `mb4540@gmail.com`;
```

After grants: DROP then CREATE each as LANGUAGE SQL. The pattern that works
(from `standards_librarian_agent._get_rules_via_sql`) is direct SQL warehouse
connection — not UC serverless.

**Alternative (no cfisher needed):** Add direct SQL write methods to each
agent (same pattern as `_get_rules_via_sql`), bypassing UC functions entirely.

---

## Step 2: Deploy Agent Models

### Quick Reference

```bash
# Deploy all 8 agents
cd /Users/michaelberry/Documents/Jemba9/CasecadeProjects/j9ccgit && \
source ~/.sag-databricks-credentials && \
python3 databricks/agents/bricks/deploy_agents.py

# Deploy a single agent (most common — for fixes/updates)
source ~/.sag-databricks-credentials && \
python3 databricks/agents/bricks/deploy_agents.py --agent sag-orchestrator

# Dry run (print inventory only)
source ~/.sag-databricks-credentials && \
python3 databricks/agents/bricks/deploy_agents.py --dry-run
```

⚠️ **Never use `--skip-log`** unless the endpoint already exists and you just
need to change the served version. If the endpoint was recently deleted/recreated,
`--skip-log` resolves to version "1" (UC API fallback) instead of the latest
version, silently pointing the endpoint at old code.

### Input Schemas (defined in deploy_agents.py)

```python
# Orchestrator — receives only run_id
if agent_def["name"] == "sag-orchestrator":
    signature = ModelSignature(
        inputs=Schema([ColSpec("string", "run_id")]),
        outputs=Schema([ColSpec("string", "result")]),
    )
# document-ingestion — different fields
elif agent_def["name"] == "sag-document-ingestion":
    signature = ModelSignature(
        inputs=Schema([ColSpec("string", "document_id"),
                       ColSpec("string", "standard"),
                       ColSpec("string", "tenant_id")]),
        outputs=Schema([ColSpec("string", "result")]),
    )
# All other sub-agents — context_json pattern
else:
    signature = ModelSignature(
        inputs=Schema([ColSpec("string", "context_json")]),
        outputs=Schema([ColSpec("string", "result")]),
    )
```

### Conda Environment (Critical)

`deploy_agents.py` specifies this conda env for every model:
```python
conda_env = {
    "channels": ["defaults"],
    "dependencies": [
        "python=3.11",   # MUST be 3.11 — see Known Issues #1
        "pip",
        {"pip": [
            "databricks-sql-connector==3.1.2",
            "databricks-sdk>=0.32.0",
            "mlflow>=2.21.0",
            "unitycatalog-ai[databricks]>=0.1.0",  # [databricks] extra required
            "openai>=1.0.0",
            "requests>=2.31.0",
            "pyyaml>=6.0",
        ]},
    ],
    "name": "sag-agent-env",
}
```

### Agent Inventory

| Endpoint | File | Schema | Critical? |
|---|---|---|---|
| sag-orchestrator | orchestrator_agent.py | `run_id: string` | Entry point |
| sag-standards-librarian | standards_librarian_agent.py | `context_json: string` | ✅ Yes |
| sag-derating-analyst | derating_analyst_agent.py | `context_json: string` | ✅ Yes |
| sag-evidence-builder | evidence_builder_agent.py | `context_json: string` | No |
| sag-exception-reviewer | exception_reviewer_agent.py | `context_json: string` | No |
| sag-report-builder | report_builder_agent.py | `context_json: string` | No |
| sag-customer-interview | customer_interview_agent.py | `context_json: string` | No |
| sag-document-ingestion | document_ingestion_agent.py | `document_id/standard/tenant_id` | No |

---

## Step 3: Verify Endpoint Status

```bash
source ~/.sag-databricks-credentials && python3 -c "
import requests, os
host = 'https://dbc-10400a1c-b271.cloud.databricks.com'
tok = requests.post(f'{host}/oidc/v1/token',
    data={'grant_type':'client_credentials','scope':'all-apis'},
    auth=(os.environ['DATABRICKS_CLIENT_ID'],os.environ['DATABRICKS_CLIENT_SECRET']),
    timeout=10).json()['access_token']
headers = {'Authorization': f'Bearer {tok}'}
endpoints = ['sag-standards-librarian','sag-derating-analyst','sag-evidence-builder',
             'sag-exception-reviewer','sag-report-builder','sag-customer-interview',
             'sag-document-ingestion','sag-orchestrator']
ready_count = 0
for name in endpoints:
    r = requests.get(f'{host}/api/2.0/serving-endpoints/{name}', headers=headers, timeout=30)
    if r.status_code == 404:
        print(f'  {name}: NOT DEPLOYED')
        continue
    state = r.json().get('state', {})
    s = state.get('ready', '')
    c = state.get('config_update', '')
    version = ''
    entities = r.json().get('config', {}).get('served_entities', [])
    if entities:
        version = f\" v{entities[0].get('entity_version', '?')}\"
    if s == 'READY' and not c:
        ready_count += 1
        print(f'  ✅ {name}: READY{version}')
    elif c == 'IN_PROGRESS':
        print(f'  🔄 {name}: UPDATING{version}')
    elif 'FAIL' in (c or ''):
        print(f'  ❌ {name}: FAILED{version}')
    else:
        print(f'  ⏳ {name}: {s} / {c}{version}')
print(f'{ready_count}/8 ready')
"
```

### Deployment Timing (Observed)

| Phase | Time | Notes |
|---|---|---|
| MLflow model log + artifact upload | ~30-60s | Done locally, uploads to sag-backend |
| Conda build (python=3.11) | ~46s | Succeeds on attempt 1 |
| Conda build (python=3.9.6) | ~25 min | Fails on ncurses — DO NOT let this happen |
| Container image creation | ~7 min | Cached on subsequent deploys of same deps |
| Provisioning resources | 1-3 min | Allocating serverless compute |
| Deploying (loading model) | 1-5 min | Can hang — see troubleshooting |
| **Total (first deploy)** | **~12-15 min** | — |
| **Total (re-deploy, warm cache)** | **~3-5 min** | Container image reused |

### If an Endpoint Is Stuck in "Deploying"

The "Deploying" phase (after container build succeeds) can hang for 30+ minutes
due to Databricks platform routing delays. Build logs will show
`Conda environment created successfully on attempt 1` — the container is
actually running. Check service logs (not build logs) for Python errors.

If service logs show gunicorn started and workers booted with no errors,
it is a platform delay — wait or cancel and redeploy. If service logs show
a Python traceback, fix the code before redeploying.

**To cancel a stuck update:** Databricks UI → endpoint → "Cancel update" button.
This reverts to the previous active version. There is no REST API to cancel a
pending config update (DELETE /config does not exist; DELETE /serving-endpoints/{name}
deletes the entire endpoint).

---

## Step 4: Smoke Test Sub-Agents

Test all 6 non-orchestrator sub-agents directly, bypassing the orchestrator.
Verifies that endpoints respond and return expected JSON structure.

```bash
cd /Users/michaelberry/Documents/Jemba9/CasecadeProjects/j9ccgit && \
source ~/.sag-databricks-credentials && \
python3 databricks/agents/bricks/test_subagents.py
```

**Agent order in the test matters.** `evidence-builder` runs first to trigger
a write_trace UC call which warms the SQL warehouse. `derating-analyst` runs
second to benefit from the warm warehouse. If derating-analyst runs cold-first
against a cold warehouse, it hits the Databricks 504 gateway timeout (~300s).

**Expected results:**

| Agent | Expected | Notes |
|---|---|---|
| sag-evidence-builder | ✅ OK (~8-15s) | Returns `evidence_count: 0` (no findings for smoke run) |
| sag-derating-analyst | ✅ OK (~10-30s warm) | Computes margin for R1 resistor test case |
| sag-exception-reviewer | ✅ OK (~8-15s) | Returns `exceptions_handled: 0` |
| sag-report-builder | ✅ OK (~30-60s) | Calls LLM for summary, returns `summary_generated: True` |
| sag-customer-interview | ✅ OK (~10-20s) | Returns LLM `response` to cubesat question |
| sag-document-ingestion | ✅ OK (~10-20s) | Returns `rules_extracted` count |

First run on a cold day: derating-analyst may fail with 504 if the warehouse
was suspended overnight. Second run will succeed (warehouse warm).

---

## Step 5: End-to-End Test

### Option A — Databricks Notebook (Cell 16) ← Preferred

Run in the sag-dev or sag-backend Databricks workspace. Uses `spark.sql()` for
database queries (no SQL connector setup needed). Automatically creates a test
`derating_run`, invokes the orchestrator, verifies all 8 checks, and cleans up.

Cell 16 sends to the orchestrator:
```python
json={"inputs": {"run_id": run_id}}   # orchestrator takes run_id only
```

Checks (8 total):
1. `orchestrator_status` — returned `awaiting_review` or `completed`
2. `findings_created` — rows in `derating_finding` for this run_id
3. `findings_valid_statuses` — all statuses in {pass, fail, waiver, pending}
4. `orchestrator_traced` — `agent_trace` has rows with `agent_name=orchestrator`
5. `min_3_agents_traced` — at least 3 distinct agents traced
6. `evidence_created` — rows in `evidence` table
7. `report_deliverable_created` — row with `deliverable_type=report`
8. `summary_created` — row in `customer_run_summary` with valid JSON

**Cell 16 code does NOT need modification** — it correctly matches the
orchestrator's input format and response structure.

### Option B — Terminal pytest

```bash
source ~/.sag-databricks-credentials && \
python -m pytest databricks/tests/test_agent_pipeline_e2e.py -v --timeout=600
```

Note: `test_agent_pipeline_e2e.py` individual agent tests (lines 262-301) use
the **old format without context_json** — those will fail until updated. The
`TestEndToEndPipeline` class (orchestrator-driven) is correct.

---

## Step 6: Configure Backend

### Backend Environment Variables

```env
AGENT_DISPATCHER_ENABLED=true
AGENT_ORCHESTRATOR_ENDPOINT=/serving-endpoints/sag-orchestrator/invocations
DATABRICKS_WORKSPACE_HOST=dbc-10400a1c-b271.cloud.databricks.com
DATABRICKS_SERVER_HOSTNAME=dbc-30285e24-f917.cloud.databricks.com
DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/f60564025c6d6476
DATABRICKS_CLIENT_ID=<from credentials file>
DATABRICKS_CLIENT_SECRET=<from credentials file>
DATABRICKS_CATALOG=sag_catalog
```

Production: update `sag/dev/databricks` secret in AWS Secrets Manager.

---

## Troubleshooting

### HTTP 400 on sub-agent invocation
Schema validation failure. Sub-agents expect `{"inputs": {"context_json": "..."}}`.
Do not send raw complex types. The orchestrator's `_dispatch_sub_agent` handles
this correctly. Direct callers must use the context_json pattern.

### HTTP 504 Gateway Timeout on derating-analyst (smoke test only)
The derating-analyst was the first agent to call a UC write function against a
cold SQL warehouse. Warehouse startup takes 2-5 min, which exceeds Databricks'
serving gateway timeout. Fix: run the smoke test in order (evidence-builder
first), or pre-warm the warehouse with a SQL query before running the test.
In the full pipeline, standards-librarian warms the warehouse first via
`_get_rules_via_sql`, so derating-analyst hits a warm warehouse.

### E2E test: 0/8 checks passed, orchestrator status=failed, traces=empty set
Both write UC functions AND standards_librarian are failing:
1. **Write UC functions broken** — all silent. See Step 1 for fix.
2. **standards_librarian failing** — check its service logs for the error around
   the time the E2E test ran. Most likely: exception in `_get_rules_via_sql`
   (bad `sag-serving` secrets or empty `derating_rule` table).

### Endpoint builds conda on attempt 1 but hangs in "Deploying" for 30+ min
This is a Databricks platform routing delay, not a code issue. Service logs
will show gunicorn started + workers booted. Cancel update from UI and redeploy.
Usually resolves on the retry.

### conda build fails: LibMambaUnsatisfiableError: python=3.9.6 requires ncurses
MLflow baked in the local Mac Python version (3.9.6) into the conda env. The
`ncurses >=6.2,<6.3.0a0` package no longer exists in the Databricks conda channel.
Build retries 5 times (~5 min each = ~25 min), then fails. Fix: always specify
`python=3.11` in `conda_env` in `deploy_agents.py`. Never remove the explicit
python version. This is the root cause of all build hangs.

### --skip-log resolves to version 1 instead of latest
If the endpoint was recently deleted and recreated, the UC API query for versions
sometimes fails silently → fallback to version "1". Always use a full deploy
(without `--skip-log`) after deleting an endpoint. `--skip-log` is only safe
when the endpoint has been running continuously.

### orchestrator_traced: empty, run_status_updated: queued after E2E
Write UC functions are failing silently. The `_call_uc()` method returns `None`
on function error instead of raising. Until UC write functions are fixed (see
Step 1), nothing is written to the database. The orchestrator continues executing
but all DB writes are no-ops.

### Endpoint returns 503 (Service Unavailable)
Endpoint scaled to zero — first request triggers cold start (60-90s). Wait and
retry. Consider setting minimum concurrency to 1 for the orchestrator to avoid
cold starts during testing.

### MLflow warning: "Python 3.9.6 differs from Python 3.11.14"
Harmless. MLflow records the local Python version in model metadata, but the
serving container uses Python 3.11.14 (from conda env). `PythonModel` subclasses
are stored as source files, not pickled — no cloudpickle compatibility issues.

### "Critical agent failure" with no other info
standards_librarian or derating_analyst (both in CRITICAL_AGENTS) returned an
HTTP error. Check the failing agent's service logs for the Python traceback.
The orchestrator raises `RuntimeError` on any non-2xx response and aborts
the pipeline immediately.

### Endpoint creation: 409 Conflict
The endpoint config is still being updated from a previous deploy. The deploy
script handles this gracefully and skips. Wait for the current update to
complete before trying again.

### DELETE /api/2.0/serving-endpoints/{name}/config → ENDPOINT_NOT_FOUND
This API path does not exist. To cancel a pending config update, use the
Databricks UI "Cancel update" button. To delete an entire endpoint, use
`DELETE /api/2.0/serving-endpoints/{name}` (no /config suffix).

---

## Known Issues and Lessons Learned

1. **`python=3.11` in conda_env is mandatory.** MLflow inherits the local
   Python version at log time (Mac = 3.9.6). Databricks conda channel no longer
   has `ncurses >=6.2,<6.3.0a0` which 3.9.6 requires → build fails after 5
   retries (~25 min). Always keep `python=3.11` in `deploy_agents.py` conda_env.

2. **MLflow 2.21+ strict schema enforcement breaks complex input types.**
   Sending lists or dicts in the input schema causes HTTP 400 before `predict()`
   even runs. Use the context_json pattern: sub-agents accept a single string
   field `context_json` containing the entire payload as JSON.

3. **UC functions must be LANGUAGE SQL, not LANGUAGE PYTHON.**
   `databricks-sql-connector` is unavailable in UC serverless (where UC
   functions execute). Any UC function implemented as LANGUAGE PYTHON that
   imports databricks.sql will fail silently. All write functions are currently
   broken for this reason.

4. **`_call_uc()` silently returns None on UC function failure.**
   This masks all UC errors. Log the `result.error` field from
   `FunctionExecutionResult` to surface failures.

5. **`--skip-log` is dangerous after endpoint deletion.**
   Version resolution falls back to "1" if the UC API query fails silently,
   pointing the endpoint at old/wrong code. Always do a full deploy after
   deleting an endpoint.

6. **"Deploying" phase can hang 30+ minutes.** After a successful container
   build, the endpoint can get stuck in the Deploying state for extended periods
   due to Databricks platform routing delays. Container is actually running
   (check service logs). Cancel and retry — the build is cached and retries
   are fast.

7. **Cold SQL warehouse causes 504 on first UC write call.**
   When the SQL warehouse is suspended (auto-suspend after idle), the first
   agent to call any UC write function (write_trace, write_finding, etc.) waits
   2-5 min for warehouse startup. Databricks serving gateway times out at ~300s
   → HTTP 504. In the full pipeline, standards_librarian's `_get_rules_via_sql`
   runs first and warms the warehouse before derating_analyst needs it.

8. **No REST API to cancel a pending config update.**
   `DELETE /config` does not exist. Use the UI "Cancel update" button or
   delete the entire endpoint (`DELETE /serving-endpoints/{name}`) and redeploy.

9. **standards_librarian bypasses UC functions for rule retrieval.**
   `_get_rules_via_sql()` connects directly to the SQL warehouse via
   `databricks-sql-connector`, bypassing the broken LANGUAGE PYTHON UC functions.
   Requires `DATABRICKS_SERVER_HOSTNAME`, `DATABRICKS_HTTP_PATH`,
   `DATABRICKS_CLIENT_ID`, `DATABRICKS_CLIENT_SECRET` in the endpoint env vars
   (set via `sag-serving` secret scope).

10. **`unitycatalog-ai[databricks]` extra is required.**
    Without `[databricks]`, `from unitycatalog.ai.core.databricks import
    DatabricksFunctionClient` fails. The bracket extra installs the Databricks
    backend.

11. **PythonModel, not ResponsesAgent.**
    MLflow 3.x `ResponsesAgent` has an incompatible `predict` signature. All
    8 agents inherit from `mlflow.pyfunc.PythonModel`.

12. **DataFrame normalization in predict().**
    MLflow serving passes input as pandas DataFrame. Every `predict()` must
    start with:
    ```python
    if hasattr(model_input, "iloc"):
        model_input = model_input.iloc[0].to_dict()
    ```

13. **Orchestrator token host.**
    `_get_oauth_token()` in orchestrator uses `DATABRICKS_SERVER_HOSTNAME`
    (sag-dev SQL host) to get the token used for calling sub-agent endpoints
    on sag-backend. Cross-workspace M2M tokens work if the SP is in both
    workspaces. However, consider changing to `DATABRICKS_HOST` (sag-backend)
    for cleaner same-workspace auth.

14. **MLflow predictions envelope.**
    Sub-agent endpoints wrap responses as `{"predictions": result}`. The
    orchestrator's `_dispatch_sub_agent()` unwraps this. Direct API callers
    (notebooks, scripts) must also unwrap: `result = data.get("predictions", data)`.

15. **CRITICAL_AGENTS abort the pipeline on failure.**
    standards_librarian and derating_analyst are in `CRITICAL_AGENTS`. Any
    HTTP error from these (4xx, 5xx, timeout) causes the orchestrator to
    immediately mark the run as "failed" and return. Check sub-agent service
    logs before assuming orchestrator code is at fault.

16. **Compute size: Small is correct for IO-bound agents.**
    All agents are IO-bound (LLM API calls, SQL queries). CPU/memory size has
    no effect on throughput. Keep `workload_size: "Small"`. Recommended: set
    orchestrator minimum concurrency to 1 (`scale_to_zero_enabled: True` but
    min=1) to eliminate cold start on test runs. Sub-agents can stay at min=0.

17. **`register_agents.py` is NOT the deploy script.**
    Uses `external_model` payload — creates LLM proxy endpoints, not agent
    endpoints. Use `bricks/deploy_agents.py` exclusively.

---

## File Reference

| File | Purpose |
|---|---|
| `~/.sag-databricks-credentials` | OAuth SP credentials (never committed) |
| `databricks/verify_connection.py` | Two-workspace connectivity check |
| `databricks/requirements.txt` | Python dependencies |
| `databricks/agents/bricks/deploy_agents.py` | MLflow model logging + endpoint creation |
| `databricks/agents/bricks/*_agent.py` | 8 agent implementations (PythonModel) |
| `databricks/agents/bricks/test_subagents.py` | Sub-agent smoke test (bypasses orchestrator) |
| `databricks/agents/prompts/*.md` | System prompt files |
| `databricks/tests/test_agent_pipeline_e2e.py` | E2E pytest (orchestrator-driven) |
| `_project-docs/plans/completedPlans/currentStatus.md` | Current pipeline status, blockers, next actions |
| `_project-docs/plans/completedPlans/01-J9-SAGtoAWS-Part7D-AgentBricks.md` | Phase 7D implementation plan |

## Current Deployed Versions (2026-02-28)

| Agent | Version | Key change in this version |
|---|---|---|
| sag-orchestrator | v10 | context_json dispatch, predictions unwrap |
| sag-standards-librarian | v15 | context_json input, direct SQL bypass (_get_rules_via_sql) |
| sag-derating-analyst | v9 | context_json input, None guard on write_finding result |
| sag-evidence-builder | v9 | context_json input |
| sag-exception-reviewer | v9 | context_json input |
| sag-report-builder | v9 | context_json input |
| sag-customer-interview | v9 | context_json input |
| sag-document-ingestion | v9 | context_json input |
