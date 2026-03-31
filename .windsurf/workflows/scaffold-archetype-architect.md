---
description: Generate a complete new archetype with all required files (Archetype Architect)
---

User input: $ARGUMENTS

## Execution Steps

### 1. Check for Similar Existing Workflows

// turbo
List all files in `.windsurf/workflows/` to check for existing workflows that may overlap with the requested archetype.

**If a similar workflow exists:**
```
Existing workflow found: {workflow_name}
Description: {description}

Options:
[1] Extend existing workflow
[2] Proceed with new workflow (explain why it is distinct)

Which option? [1/2]
```

### 2. Parse Requirements

Extract from $ARGUMENTS:
- **Workflow name** (kebab-case slug, e.g., "kubernetes-operator-builder")
- **Purpose** (what problem it solves)
- **Technologies** (tools, languages, frameworks)
- **Common use cases** (3-5 examples)
- **Anti-patterns** (what to prevent)
- **Best practices** (what to enforce)

If incomplete, request clarification:
```
Please provide:
1. Workflow Name: (e.g., "kubernetes-operator-builder")
2. Purpose: (One sentence describing what it does)
3. Technologies: (e.g., Python, Kubernetes, Helm)
4. Use Cases: (3-5 common scenarios)
5. Anti-patterns: (What mistakes to prevent)
6. Best Practices: (What patterns to enforce)
```

### 3. Analyze Requirements and Recommend

**Purpose:** Collaborate with the user to design a better workflow upfront.

#### A. Identify Anti-Patterns

Review the user's anti-patterns for completeness and suggest additions:

```
ANTI-PATTERN ANALYSIS

Provided Anti-Patterns:
✓ {anti_pattern_1}
✓ {anti_pattern_2}

Additional Anti-Patterns Identified:
⚠️ {additional_anti_pattern}
Why: {explanation}
Impact: {impact}

Add these? [Y/n/modify]
```

#### B. Recommend Hard-Stop Rules

Based on anti-patterns and security requirements:

```
HARD-STOP RULES

✘ {hard_stop_1}
Rationale: {explanation}
Severity: CRITICAL

✘ {hard_stop_2}
Rationale: {explanation}
Severity: HIGH

Approve? [Y/n/modify]
```

#### C. Suggest Mandatory Patterns

```
MANDATORY PATTERNS

✔ {pattern_1}
Why: {explanation}

✔ {pattern_2}
Why: {explanation}

Approve? [Y/n/modify]
```

#### D. Flag Ambiguities

```
CLARIFICATION NEEDED

⚠️ {question_1}
Options: {options}
Recommendation: {recommendation}

Please clarify or accept recommendations.
```
### 4. Generate Workflow File

Create `.windsurf/workflows/{workflow-name}.md` with the following structure:

```markdown
---
description: {Purpose - short description for slash command discovery}
---

User input: $ARGUMENTS

## Execution Steps

### 1. Parse Input
Extract from $ARGUMENTS: {specific requirements}

### 2. Validate Constraints
Check against hard-stop rules:
{Generate hard-stop rules from anti-patterns}
- ✘ {hard_stop_1}
- ✘ {hard_stop_2}

### 3. {Main Generation/Action Step}
{Specific logic based on the workflow purpose}

Apply mandatory patterns:
{Generate mandatory patterns from best practices}
- ✔ {pattern_1}
- ✔ {pattern_2}

### 4. Validate Output
Verify generated output follows all rules and patterns.

## Error Handling

**Hard-Stop Violations**: Explain violation, suggest compliant alternative
**Incomplete Input**: List missing information, provide example

## Examples

{Generate 2-3 concrete examples based on use cases}
```

### 5. Generate Summary Report

```
Workflow Created: {workflow-name}

File: .windsurf/workflows/{workflow-name}.md

Hard-Stop Rules: {count}
Mandatory Patterns: {count}
Examples: {count}

Quick Test:
/{workflow-name} "Your test request"
```

## Error Handling

**Incomplete Requirements:**
```
Please provide:
{list_missing_fields}

Example:
/scaffold-archetype-architect "
Name: kubernetes-operator-builder
Purpose: Generate production-ready Kubernetes operators
Technologies: Python, Kubernetes, kopf, Helm
Use Cases: CRD management, controller logic, reconciliation loops
Anti-patterns: Hard-coded namespaces, missing RBAC, no health checks
Best Practices: Idempotent reconciliation, proper logging
"
```

**Name Conflict:**
```
Workflow "{name}" already exists in .windsurf/workflows/.

Options:
[1] Overwrite existing workflow
[2] Choose a different name

Which option? [1/2]
```

## Examples

### Example 1: Infrastructure Workflow
```
/scaffold-archetype-architect "
Name: kubernetes-operator-builder
Purpose: Generate production-ready Kubernetes operators with reconciliation loops
Technologies: Python, Kubernetes, kopf, Helm
Use Cases:
- CRD management
- Custom controller logic
- Reconciliation loops
Anti-patterns:
- Hard-coded namespaces
- Missing RBAC definitions
- No health checks
Best Practices:
- Idempotent reconciliation
- Structured logging
- Operator SDK patterns
"
```

### Example 2: Data Pipeline Workflow
```
/scaffold-archetype-architect "
Name: databricks-pipeline-builder
Purpose: Generate Databricks data pipelines with Delta Lake
Technologies: Python, PySpark, Delta Lake, Databricks
Use Cases:
- ETL pipelines
- Data quality checks
- Incremental ingestion
Anti-patterns:
- No schema validation
- Missing audit columns
- Unbounded result sets
Best Practices:
- Delta Lake merge patterns
- Unity Catalog integration
- Structured streaming
"
```

### Example 3: API Documentation Workflow
```
/scaffold-archetype-architect "
Name: api-docs-generator
Purpose: Generate comprehensive API documentation from code
Technologies: Python, OpenAPI, Swagger, Markdown
Use Cases:
- REST API documentation
- SDK documentation
- Interactive API explorers
Anti-patterns:
- Outdated examples
- Missing authentication docs
Best Practices:
- Auto-generated from code
- Version-specific docs
- Authentication flows
"
```
