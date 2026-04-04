---
description: Compare multi-archetype solution architectures and approaches
---

User input: $ARGUMENTS

## Execution Steps

### 1. Parse Input

Extract from $ARGUMENTS:
- Solution requirements and constraints
- Comparison criteria (if specified)
- Referenced projects, directories, or files

### 2. Infer Context from User's Assets

**If user references a PROJECT or DIRECTORY:**
```
Analyze directory structure to infer composition:
- Look for package.json, requirements.txt, pom.xml → Application type
- Look for .tf, terraform/ → Infrastructure as Code
- Look for .py + mlflow/, model/ → ML/Data Science
- Look for Dockerfile, helm/, k8s/ → Container/Kubernetes
- Look for .sql, dbt_project.yml → Data Engineering
- Look for airflow/, dags/ → Orchestration
- Look for cdk.json, lib/*-stack.ts → AWS CDK

Generate context description:
"Project composition: {inferred_type} with {key_technologies}"
```

**If user references a FILE:**
```
Analyze file to infer purpose and framework from imports/content.

Generate context description:
"File type: {extension}, Purpose: {inferred_purpose}, Framework: {detected_framework}"
```

### 3. Identify Solution Patterns

Map requirements to common architecture patterns:
- Full-stack web application (React/Vue + API + DB)
- ML/AI pipeline (training, serving, monitoring)
- Data platform (ingestion, transformation, serving)
- Event-driven microservices
- Serverless / FaaS
- Infrastructure as Code
- Monolith vs microservices

### 4. Generate Alternative Solutions

For each viable pattern, define:
- **Components**: What pieces are needed
- **Technology choices**: Specific frameworks, services, tools
- **Integration points**: How components connect
- **Deployment model**: How it runs in production

### 5. Create Comparison Matrix

Compare solutions across dimensions:

| Dimension | Description |
|-----------|-------------|
| **Performance** | Throughput, latency, resource efficiency |
| **Cost** | Infrastructure, licensing, operational overhead |
| **Complexity** | Implementation difficulty, learning curve, maintenance burden |
| **Reliability** | Failure modes, recovery, SLA feasibility |
| **Scalability** | Horizontal/vertical scaling, growth ceiling |
| **Time to Deliver** | How quickly can v1 ship |
| **Team Fit** | Alignment with team skills and existing stack |

```
| Dimension      | Solution A     | Solution B     | Solution C     |
|----------------|----------------|----------------|----------------|
| Performance    | ...            | ...            | ...            |
| Cost           | ...            | ...            | ...            |
| Complexity     | ...            | ...            | ...            |
| Reliability    | ...            | ...            | ...            |
| Scalability    | ...            | ...            | ...            |
| Time to Deliver| ...            | ...            | ...            |
| Team Fit       | ...            | ...            | ...            |
```

### 6. Provide Recommendations

```
RECOMMENDATION: {Solution}

Rationale:
- {reason_1}
- {reason_2}
- {reason_3}

Trade-offs:
- Pros: {list}
- Cons: {list}

Alternative: If {condition}, consider {alternative}

Next Steps:
1. {action_1}
2. {action_2}
3. {action_3}
```

## Examples

**Example: Data Platform Comparison**
```
Solution A (Batch): Databricks notebooks + Delta Lake + SQL warehouse
Solution B (Streaming): Kafka + Spark Structured Streaming + Delta Lake

Comparison: Performance (B wins), Cost (A wins), Complexity (A wins)
Recommendation: Solution A for initial implementation, migrate to B as scale increases
```

**Example: Frontend Architecture**
```
Solution A (SPA): React + Vite + client-side routing
Solution B (SSR): Next.js + server components + API routes

Comparison: SEO (B wins), Simplicity (A wins), Performance (tie)
Recommendation: Solution A for internal tools, Solution B for public-facing apps
```

## Error Handling

**Insufficient Information:**
```
Please provide more details:
1. What problem are you solving?
2. What constraints exist (budget, timeline, team size)?
3. What scale do you need to support?
4. Any existing infrastructure to integrate with?
```
