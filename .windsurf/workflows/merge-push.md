---
description: Safe code commit, push, and merge workflow. Enforces validation gates from code_quality, database_design, security, and testing rules before any code reaches the main branch.
---

## Step 1 — Security Gate

Before staging any files, verify all security checks pass:

- [ ] **No secrets in code** — Scan for hardcoded API keys, tokens, passwords, PATs, or connection strings. No credentials may be committed.
- [ ] **`.gitignore` coverage** — Confirm credential files (`~/.sag-databricks-credentials`, `.env`, `*.pem`, etc.) are excluded from version control.
- [ ] **No Databricks connection details in client code** — Backend is the only component connecting to Databricks.
- [ ] **Dependency audit** — Run `npm audit` and/or `pip audit` to check for known vulnerabilities.
- [ ] **Sensitive data in logs** — Verify no PII, tokens, or passwords are logged or printed.
- [ ] **Input validation** — All user input is validated server-side with parameterized queries (no SQL concatenation).
- [ ] **API security headers** — Responses include `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `Content-Security-Policy`.

```bash
npm audit
pip audit
```

## Step 2 — Code Quality Gate

- [ ] **No dead code** — Remove commented-out code, unused imports, and TODO comments.
- [ ] **Function length** — No function exceeds 30 lines. Break up long functions.
- [ ] **Naming conventions** — Files, variables, functions, classes, and constants follow project naming rules (`camelCase`/`snake_case`/`PascalCase`/`UPPER_SNAKE_CASE`).
- [ ] **TypeScript strict typing** — No use of `any`. Use proper types or `unknown` with type guards.
- [ ] **Error handling** — No silently swallowed errors. All errors are logged or propagated with context.
- [ ] **Imports organized** — External packages first, then internal modules, then relative imports, separated by blank lines.
- [ ] **No hardcoded config** — Configuration values come from environment variables or config files.
- [ ] **Self-documenting code** — Comments explain "why", not "what". Public APIs have JSDoc/TSDoc or docstrings.

## Step 3 — Database Design Gate

Only required if schema or query changes are included:

- [ ] **Schema changes reviewed** — Version-controlled and reviewed before merge. No direct production schema changes.
- [ ] **Delta Lake format** — All new tables use Delta Lake format.
- [ ] **Naming conventions** — Catalogs, schemas, tables, and columns use `snake_case`. Boolean columns prefixed with `is_`, `has_`, `can_`. Timestamps suffixed with `_at`.
- [ ] **Audit columns present** — All new tables include `created_at`, `created_by`, `updated_at`, `updated_by`.
- [ ] **No `SELECT *`** — All queries specify explicit column names.
- [ ] **Parameterized queries** — No raw string concatenation in SQL.
- [ ] **Data quality checks** — New or modified ingestion code includes validation, idempotency, and logging.
- [ ] **Staging pattern** — Raw ingested data goes to staging tables before promotion to production tables.

## Step 4 — Testing Gate

- [ ] **Tests exist** — All new or modified code has corresponding tests. No exceptions.
- [ ] **Unit tests pass** — Run the full unit test suite. All tests must pass.
- [ ] **Integration tests pass** — Run integration tests for modified API endpoints, DB queries, or service interactions.
- [ ] **Test coverage maintained** — Coverage has not decreased. Business logic maintains 80%+ coverage.
- [ ] **Tests are deterministic** — No flaky tests. Same input produces same result every time.
- [ ] **Test data is clean** — Tests use factories/builders, not hardcoded data. No real user data or production credentials.
- [ ] **Edge cases covered** — Tests include empty inputs, null/undefined, boundary values, and error conditions.
- [ ] **Security scanning** — Dependency audit and static analysis pass as part of CI.

## Step 5 — Commit

Once all gates pass:

```bash
# 1. Ensure SSO session is active
aws sso login --profile jemba9-dev

# 2. Set the AWS profile for the session
export AWS_PROFILE=jemba9-dev

# 3. Pull latest from main to avoid conflicts
git pull origin main

# 4. Review staged changes
git status
git diff --cached

# 5. Stage changes (review what you are adding)
git add <specific-files>
# NEVER use `git add .` without first reviewing `git status`

# 6. Commit with a descriptive message
git commit -m "<type>: <short description>

<optional body explaining why, not what>"
```

### Commit Message Prefixes

| Prefix      | Use For                                    |
|-------------|--------------------------------------------|
| `feat:`     | New feature or capability                  |
| `fix:`      | Bug fix                                    |
| `refactor:` | Code restructuring with no behavior change |
| `test:`     | Adding or updating tests                   |
| `docs:`     | Documentation changes                      |
| `chore:`    | Build, config, dependency updates          |
| `security:` | Security-related changes                   |
| `schema:`   | Database schema changes                    |

## Step 6 — Push

```bash
# Push to a feature branch (never push directly to main)
git push origin <feature-branch>
```

- **Never force push** (`--force`) to shared branches.
- If authentication fails, re-run `aws sso login --profile jemba9-dev`.
- If the push fails due to conflicts, pull and resolve locally before pushing again.

## Step 7 — Pre-Merge Validation

Before merging a feature branch into `main`, confirm:

1. **All four gates pass** — Security, Code Quality, Database Design, and Testing checklists are satisfied.
2. **No merge conflicts** — The feature branch is up to date with `main`.
3. **Peer review complete** — At least one other person has reviewed the changes (when team size permits).
4. **CI pipeline green** — All automated checks (tests, linting, security scans) pass.

## Step 8 — Merge

```bash
# 1. Switch to main
git checkout main

# 2. Pull latest
git pull origin main

# 3. Merge the feature branch (use --no-ff to preserve branch history)
git merge --no-ff <feature-branch> -m "merge: <feature-branch> into main

Validated: security, code-quality, database-design, testing gates passed"

# 4. Push main
git push origin main

# 5. Delete the feature branch (optional, after confirmed merge)
git branch -d <feature-branch>
git push origin --delete <feature-branch>
```

## Step 9 — Post-Merge Verification

- [ ] Confirm `main` builds and deploys successfully.
- [ ] Run smoke tests against the deployed environment.
- [ ] Update relevant plan files with completion status and date.
- [ ] Verify no secrets were accidentally committed: `git log --diff-filter=A --name-only -1` and review new files.

---

## Emergency Hotfix Procedure

For critical production fixes only:

1. Create a branch from `main`: `git checkout -b hotfix/<description> main`
2. Make the minimal fix. Do not bundle unrelated changes.
3. Run the **Security Gate** (Step 1) and **Testing Gate** (Step 4) at minimum.
4. Follow Steps 5–9 above.
5. Document the hotfix in the relevant plan file with a timestamp.
