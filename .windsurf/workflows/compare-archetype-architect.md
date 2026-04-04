---
description: Compare two archetype design approaches (Archetype Architect)
---

User input: $ARGUMENTS

## Execution Steps

### 1. Parse Comparison Request

Extract from $ARGUMENTS:
- Design options to compare (2-3)
- Comparison criteria
- Use case context

### 2. Define Comparison Dimensions

Compare across:
- **Scope**: What problems each approach solves
- **Complexity**: Implementation difficulty
- **Maintenance**: Long-term update burden
- **Reusability**: How well patterns transfer to other projects
- **Team Fit**: Alignment with team skills and existing stack

### 3. Analyze Each Option

For each option:
- List technologies covered
- List use cases addressed
- Identify unique patterns and strengths
- Identify overlaps with other options
- Estimate implementation time

### 4. Generate Comparison Matrix

```
| Dimension    | Option A | Option B | Option C |
|--------------|----------|----------|----------|
| Scope        | ...      | ...      | ...      |
| Complexity   | ...      | ...      | ...      |
| Maintenance  | ...      | ...      | ...      |
| Reusability  | ...      | ...      | ...      |
| Team Fit     | ...      | ...      | ...      |
```

### 5. Recommend Approach

Based on:
- Use case frequency
- Overlap with existing code/patterns in the project
- Implementation effort
- Long-term value

### 6. Provide Decision Guidance

```
RECOMMENDATION: {Option}

Rationale:
- {reason_1}
- {reason_2}
- {reason_3}

Trade-offs:
- Pros: {list}
- Cons: {list}

Alternative: If {condition}, consider {alternative}
```

## Comparison Patterns

### Pattern 1: Broad vs Narrow Scope

**Broad Approach:**
- Covers multiple related technologies in one module
- More complex logic with conditionals
- Harder to name and discover
- Example: Single "Cloud Infrastructure" module covering AWS, Azure, GCP

**Narrow Approach:**
- Focused on a specific tool or pattern
- Simpler, more predictable logic
- Easier to name and find
- Example: Separate "CDK Stack Builder", "Terraform Module", "CloudFormation Template"

**When to choose:**
- Broad: When patterns are highly similar (>70% overlap)
- Narrow: When tools have distinct patterns (<50% overlap)

### Pattern 2: Single vs Multiple Modules

**Single Module:**
- One module handles all variations
- Uses conditional logic for differences
- Less code to maintain overall
- Example: "Container Orchestrator" (K8s, Docker Compose, ECS)

**Multiple Modules:**
- Separate module per tool/pattern
- Cleaner logic per module
- More files to maintain
- Example: "K8s Deployment", "Docker Compose Builder", "ECS Task Definition"

**When to choose:**
- Single: When >70% of patterns overlap
- Multiple: When <50% of patterns overlap

### Pattern 3: New vs Extend Existing

**New Module:**
- Clean slate design
- No legacy constraints
- More code to write and maintain

**Extend Existing:**
- Build on proven patterns
- Leverage existing code
- Risk of bloating the original

**When to choose:**
- New: When solving a fundamentally different problem
- Extend: When it is a natural evolution of existing code

### Pattern 4: Overlap Analysis

**Purpose:** Evaluate whether two approaches have significant overlap and should be merged, kept separate, or refactored.

**Steps:**

1. **Feature Overlap Calculation:**
```
Approach A features: [f1, f2, f3, f4, f5]
Approach B features: [f2, f4, f6, f7, f8]
Common: [f2, f4] = 2
Total unique: 8
Overlap: 2/8 = 25%
```

2. **Purpose Comparison:**
- Identify shared problem domains
- Flag potential confusion for users or developers

**Decision Matrix:**

| Overlap % | Recommendation |
|-----------|----------------|
| <30%      | Keep separate (distinct purposes) |
| 30-50%    | Review boundaries, consider shared utilities |
| 50-70%    | Strong candidate for merge |
| >70%      | Merge recommended |

## Examples

### Example 1: Kubernetes Approaches
```
/compare-archetype-architect "
Compare approaches for Kubernetes development:

Option A: Single 'Kubernetes Developer' module
- Covers operators, controllers, CRDs, Helm charts
- Broad scope, complex workflows

Option B: Multiple specialized modules
- 'K8s Operator Builder'
- 'Helm Chart Builder'
- 'K8s CRD Designer'

Context: Team builds all types of K8s resources
"

Output:
Option A (Single Broad):
- Pros: One module to maintain, unified patterns
- Cons: Complex conditionals, harder to navigate
- Complexity: High

Option B (Multiple Narrow):
- Pros: Clear purpose per module, easier maintenance
- Cons: 3x files, some duplication
- Complexity: Medium per module

RECOMMENDATION: Option B (Multiple Narrow)

Rationale:
- K8s operators vs Helm charts have distinct patterns
- Easier for developers to find the right tool
- Patterns don't overlap enough to justify single module
```

### Example 2: API Documentation
```
/compare-archetype-architect "
Compare:
Option A: Extend existing docs module with API docs
Option B: New 'API Documentation Generator' module

Context: Need OpenAPI/Swagger generation
"

Output:
Option A (Extend Existing):
- Current: General documentation (Markdown, README)
- Add: API-specific patterns (OpenAPI, Swagger)
- Overlap: 40%
- Risk: Bloat

Option B (New Module):
- Focused: API documentation only
- Technologies: OpenAPI, Swagger, Postman
- Clean separation

RECOMMENDATION: Option B (New Module)

Rationale:
- API docs have unique patterns (schemas, endpoints, auth flows)
- Different tooling (OpenAPI vs Markdown)
- Low overlap with general documentation
```

## Error Handling

**Insufficient Information:**
```
Please provide for each option:
1. Scope (what it covers)
2. Technologies involved
3. Use cases (3-5)

Example:
/compare-archetype-architect "
Option A: {name}
Scope: {description}
Technologies: {list}
Use Cases: {list}

Option B: {name}
...
"
```

**No Clear Winner:**
```
Both approaches have merit:
- Option A: {pros}
- Option B: {pros}

Recommendation: Start with {simpler option}
- Easier to implement
- Can evolve to other option later
- Lower risk
```
