---
description: How to deploy the SAG application to AWS (CDK stacks, backend Docker image, frontend SPAs)
---

# SAG Deployment Workflow

## Prerequisites

- **Docker Desktop** must be running (check with `docker ps`)
- **AWS SSO** must be authenticated:
  ```bash
  aws sso login --profile jemba9-dev
  ```
- Set `AWS_PROFILE=jemba9-dev` for all AWS/CDK commands
- **AWS Account**: `824999955649`, **Region**: `us-west-2`

## 1. Deploy CDK Stacks

Stack dependency order: Secrets → Network → Auth → Api → Frontend (×4) → Monitoring

// turbo
```bash
cd infra && AWS_PROFILE=jemba9-dev npx cdk deploy --all --require-approval never
```

### Known Issues

- **Non-ASCII characters**: AWS EC2 rejects em dashes (`—`) and other non-ASCII in Security Group descriptions. Use only plain ASCII hyphens (`-`).
- **ECS initial deploy with empty ECR**: If the ECR repo has no image yet, set `desiredCount: 0` in `api-stack.ts` first, deploy, push the image, then set back to `1` and redeploy. Otherwise the ECS circuit breaker triggers a CloudFormation rollback that takes 10+ minutes.
- **ROLLBACK_COMPLETE state**: If a stack ends up in `ROLLBACK_COMPLETE`, you must delete it before redeploying:
  ```bash
  AWS_PROFILE=jemba9-dev aws cloudformation delete-stack --stack-name <StackName> --region us-west-2
  AWS_PROFILE=jemba9-dev aws cloudformation wait stack-delete-complete --stack-name <StackName> --region us-west-2
  ```
- **Secrets Manager**: The secret (`sag/dev/databricks`) must have real values for `databaseUrl`, `host`, `client_id`, `client_secret`, and `aiGatewayUrl` BEFORE ECS tasks start. Empty placeholder values cause the backend to crash on `Missing required environment variable: DATABASE_URL`.
- **Lakebase Postgres**: The `databaseUrl` key must contain the full Postgres connection string. Lakebase scales to zero after 5 min idle and wakes in ~30s on first connection.

## 2. Build and Push Docker Image

**CRITICAL**: Use `--platform linux/amd64` on Apple Silicon Macs. Fargate runs x86_64 — an ARM image will fail with "image Manifest does not contain descriptor matching platform linux/amd64".

**CRITICAL**: The Dockerfile uses `npm install` (not `npm ci`) because the monorepo has a root `package-lock.json` but no per-package lock file in `backend/`.

```bash
# From repo root
AWS_PROFILE=jemba9-dev aws ecr get-login-password --region us-west-2 | \
  docker login --username AWS --password-stdin 824999955649.dkr.ecr.us-west-2.amazonaws.com

docker build --platform linux/amd64 -t sag-backend-dev:latest ./backend

docker tag sag-backend-dev:latest 824999955649.dkr.ecr.us-west-2.amazonaws.com/sag-backend-dev:latest
docker push 824999955649.dkr.ecr.us-west-2.amazonaws.com/sag-backend-dev:latest
```

Or use the script (already includes `--platform linux/amd64`):
```bash
./_project-docs/scripts/deploy-backend.sh
```

## 3. Deploy Frontend SPAs

Both SPAs use **same-origin API routing** via CloudFront. The `/api/*` and `/health` paths are routed to the ALB origin. No `VITE_API_BASE_URL` is needed — the SPA uses `window.location.origin`.

**CRITICAL**: Do NOT set `VITE_API_BASE_URL` in `.env.local` or `.env.production`. The `.env.local` file is loaded for ALL Vite modes (including production builds). Setting `VITE_API_BASE_URL=http://localhost:3000` in `.env.local` will bake `localhost:3000` into the production build, causing Mixed Content errors when served from HTTPS CloudFront.

### Employee Console
// turbo
```bash
cd apps/employee-console && npm run build
```
```bash
AWS_PROFILE=jemba9-dev aws s3 sync dist/ s3://sag-frontend-dev --delete
AWS_PROFILE=jemba9-dev aws cloudfront create-invalidation --distribution-id E3UEIGES455AQB --paths "/*"
```

### Customer Portal
// turbo
```bash
cd apps/customer-portal && npm run build
```
```bash
AWS_PROFILE=jemba9-dev aws s3 sync dist/ s3://sag-portal-dev --delete
AWS_PROFILE=jemba9-dev aws cloudfront create-invalidation --distribution-id E3KE5OB23L3NVJ --paths "/*"
```

### Control Center
// turbo
```bash
cd apps/control-center && npm run build
```
```bash
AWS_PROFILE=jemba9-dev aws s3 sync dist/ s3://sag-control-center-dev --delete
AWS_PROFILE=jemba9-dev aws cloudfront create-invalidation --distribution-id E3TQ0DK3TDBS5D --paths "/*"
```

### Stakeholder Portal
// turbo
```bash
cd apps/stakeholder-portal && npm run build
```
```bash
AWS_PROFILE=jemba9-dev aws s3 sync dist/ s3://sag-stakeholder-dev --delete
AWS_PROFILE=jemba9-dev aws cloudfront create-invalidation --distribution-id E19VGBBGCCZBI4 --paths "/*"
```

CloudFront invalidation takes 1-2 minutes. Hard refresh (Cmd+Shift+R) after invalidation completes.

## 4. Force ECS Redeployment (if image updated without CDK change)

```bash
AWS_PROFILE=jemba9-dev aws ecs update-service \
  --cluster sag-cluster-dev \
  --service sag-backend-dev \
  --force-new-deployment \
  --region us-west-2 \
  --no-cli-pager

AWS_PROFILE=jemba9-dev aws ecs wait services-stable \
  --cluster sag-cluster-dev \
  --services sag-backend-dev \
  --region us-west-2
```

## 5. Verify Deployment

// turbo
```bash
# Backend health
curl -s https://d1gxvxrdrv7g44.cloudfront.net/health

# Database connectivity (Lakebase Postgres)
curl -s https://d1gxvxrdrv7g44.cloudfront.net/api/db-status

# Both CloudFront distributions serving
curl -s -o /dev/null -w "%{http_code}" https://d1gxvxrdrv7g44.cloudfront.net/
curl -s -o /dev/null -w "%{http_code}" https://d3hzxtenpd9cq2.cloudfront.net/
```

## Architecture Notes

- **CloudFront origin routing**: Each CloudFront distribution has two origins — S3 (default) and ALB (`/api/*`, `/health`). This eliminates CORS and Mixed Content issues.
- **Shared Cognito session**: Both apps use the same Cognito User Pool. The Customer Portal signs out any existing session before sign-in to avoid the "There is already a signed in user" Amplify error.
- **Stack ordering in `bin/j9ccgit.ts`**: ApiStack must be created BEFORE FrontendStacks (frontends need the ALB reference for CloudFront origin routing).

## Live Endpoints (Dev)

| Resource | URL |
|---|---|
| Employee Console | https://d1gxvxrdrv7g44.cloudfront.net |
| Customer Portal | https://d3hzxtenpd9cq2.cloudfront.net |
| Control Center | https://dkkr6lmn8bwz9.cloudfront.net |
| Stakeholder Portal | https://dxzx31lf1jjiv.cloudfront.net |
| Backend ALB (direct) | http://sag-alb-dev-1203440618.us-west-2.elb.amazonaws.com |
| ECR Repo | 824999955649.dkr.ecr.us-west-2.amazonaws.com/sag-backend-dev |
| CloudWatch Dashboard | https://us-west-2.console.aws.amazon.com/cloudwatch/home?region=us-west-2#dashboards:name=SAG-Dev |

## CDK Stack Outputs

| Key | Value |
|---|---|
| Cognito User Pool | us-west-2_G3cWUrDk6 |
| Cognito Client ID | 46k0lr6vneoqfkd8opij4bdcsk |
| VPC | vpc-0f7fe652f51ae2210 |
| ECS Cluster | sag-cluster-dev |
| ECS Service | sag-backend-dev |
| Employee CF Distribution | E3UEIGES455AQB |
| Portal CF Distribution | E3KE5OB23L3NVJ |
| Control Center CF Distribution | E3TQ0DK3TDBS5D |
| Stakeholder CF Distribution | E19VGBBGCCZBI4 |
| Employee S3 Bucket | sag-frontend-dev |
| Portal S3 Bucket | sag-portal-dev |
| Control Center S3 Bucket | sag-control-center-dev |
| Stakeholder S3 Bucket | sag-stakeholder-dev |
| SNS Alerts Topic | sag-alerts-dev → cfisher@jemba9.com |
