# SafeCodeRelease - FastAIGrader Repository

## Purpose

Safely promote feature branches to `main` for the **FastAIGrader** project with automatic backup and Netlify deployment.

This script creates a timestamped checkpoint branch from the current `main` (named `WorkingSoftwareCKPoint-<timestamp>`), pushes it to GitHub as a safe backup, then promotes the **currently checked-out branch** to `main` and triggers Netlify auto-deployment.

## Preconditions (agent must verify)

* Git working tree is clean (no unstaged or uncommitted changes).
* Repository has a remote named `origin` (GitHub: mb4540/FastAIGrader).
* Branch `main` exists locally and/or on `origin`.
* Current branch (the one to promote) is **not** `main`.
* **FastAIGrader specific**: Build passes (`npm run build` succeeds).
* **FastAIGrader specific**: TypeScript compiles without errors.

## Configurable variables

* `BACKUP_BASE`: backup branch prefix. Default `WorkingSoftwareCKPoint`.
* `REMOTE`: git remote. Default `origin`.
* `MAIN_BRANCH`: mainline branch. Default `main`.
* `PROMOTE_BRANCH`: branch to promote. Default = **current HEAD branch**.
* `MERGE_STRATEGY`: one of `ff`, `no-ff`, or `squash`. Default `no-ff`.
* `NEW_FEATURE_BRANCH`: name for the next feature branch. Default `feature/next-enhancements`.

## One-shot script (safe, idempotent)

> The agent should run this exactly as-is in the repo root. It will:
>
> 1. create & push a timestamped backup from `origin/main`,
> 2. fast-sync `main`,
> 3. merge/rebase the current branch into `main`,
> 4. push `main`,
> 5. create a new feature branch for the next development cycle.

```bash
#!/usr/bin/env bash
set -euo pipefail

# -------- Config (override as needed) --------
BACKUP_BASE="${BACKUP_BASE:-WorkingSoftwareCKPoint}"
REMOTE="${REMOTE:-origin}"
MAIN_BRANCH="${MAIN_BRANCH:-main}"
MERGE_STRATEGY="${MERGE_STRATEGY:-no-ff}"   # ff | no-ff | squash

# -------- Safety checks --------
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Not inside a git repository." >&2; exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree not clean. Commit/stash changes first." >&2; exit 1
fi

if ! git rev-parse --verify "$MAIN_BRANCH" >/dev/null 2>&1; then
  echo "Main branch '$MAIN_BRANCH' not found locally." >&2
  echo "Attempting to fetch it..." >&2
fi

# Ensure remotes & branches present
git fetch --prune "$REMOTE"

if ! git ls-remote --exit-code "$REMOTE" "refs/heads/$MAIN_BRANCH" >/dev/null 2>&1; then
  echo "Remote branch '$REMOTE/$MAIN_BRANCH' not found." >&2; exit 1
fi

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$CURRENT_BRANCH" == "$MAIN_BRANCH" ]]; then
  echo "Current branch is '$MAIN_BRANCH'. Switch to the branch you want to promote first." >&2
  exit 1
fi

PROMOTE_BRANCH="${PROMOTE_BRANCH:-$CURRENT_BRANCH}"

# -------- 1) Create & push backup checkpoint from origin/main --------
# Use remote main as source of truth to avoid local drift.
TIMESTAMP="$(date -u +%Y%m%d-%H%M%SUTC)"
BACKUP_BRANCH="${BACKUP_BASE}-${TIMESTAMP}"

# Create a local branch at origin/main without switching
git fetch "$REMOTE" "$MAIN_BRANCH"
git branch -f "$BACKUP_BRANCH" "refs/remotes/$REMOTE/$MAIN_BRANCH" >/dev/null

# Push the backup branch (fail if it already exists remotely to keep immutability)
if git ls-remote --exit-code "$REMOTE" "refs/heads/$BACKUP_BRANCH" >/dev/null 2>&1; then
  echo "Remote backup branch '$BACKUP_BRANCH' already exists. Aborting for safety." >&2
  exit 1
fi
git push "$REMOTE" "refs/heads/$BACKUP_BRANCH:refs/heads/$BACKUP_BRANCH"

echo "Created backup checkpoint: $REMOTE/$BACKUP_BRANCH (from $REMOTE/$MAIN_BRANCH)"

# -------- 2) Sync local main with remote --------
git checkout "$MAIN_BRANCH"
git fetch "$REMOTE" "$MAIN_BRANCH"
# Rebase to ensure linear history; change to 'merge' if your policy requires
git reset --hard "refs/remotes/$REMOTE/$MAIN_BRANCH"

# -------- 3) Integrate promote branch into main --------
git fetch "$REMOTE" "$PROMOTE_BRANCH" || true

# Optional: ensure promote branch is up-to-date with remote (if it exists there)
if git ls-remote --exit-code "$REMOTE" "refs/heads/$PROMOTE_BRANCH" >/dev/null 2>&1; then
  # Create a temp ref for the remote state to compare
  PROMOTE_REMOTE_REF="refs/remotes/$REMOTE/$PROMOTE_BRANCH"
else
  PROMOTE_REMOTE_REF=""
fi

# Rebase the promote branch onto up-to-date main before merging (safer history)
git checkout "$PROMOTE_BRANCH"
git rebase "$MAIN_BRANCH"

git checkout "$MAIN_BRANCH"

case "$MERGE_STRATEGY" in
  ff)
    # Allow fast-forward if possible
    git merge --ff-only "$PROMOTE_BRANCH"
    ;;
  no-ff)
    # Standard merge commit (recommended for auditability)
    git merge --no-ff --no-edit "$PROMOTE_BRANCH"
    ;;
  squash)
    # Squash merge into a single commit; requires manual commit
    git merge --squash "$PROMOTE_BRANCH"
    git commit -m "Squash-merge '$PROMOTE_BRANCH' into '$MAIN_BRANCH'"
    ;;
  *)
    echo "Unknown MERGE_STRATEGY: $MERGE_STRATEGY" >&2; exit 1
    ;;
esac

# -------- 4) Push updated main --------
git push "$REMOTE" "$MAIN_BRANCH"

echo "✅ Promotion complete: '$PROMOTE_BRANCH' -> '$MAIN_BRANCH'"
echo "🔒 Backup preserved at: '$REMOTE/$BACKUP_BRANCH'"

# -------- 5) Create new feature branch for next development cycle --------
NEW_FEATURE_BRANCH="${NEW_FEATURE_BRANCH:-feature/next-enhancements}"
echo ""
echo "Creating new feature branch: $NEW_FEATURE_BRANCH"
git checkout -b "$NEW_FEATURE_BRANCH"
git push -u "$REMOTE" "$NEW_FEATURE_BRANCH"

echo "🎉 New feature branch '$NEW_FEATURE_BRANCH' created and ready for development!"
echo "📝 You are now on: $NEW_FEATURE_BRANCH"
```

### How the agent should execute for FastAIGrader

**The script already exists at `scripts/backup_and_promote.sh`** ✅

1. **Verify preconditions**:
   ```bash
   npm run build  # Ensure build passes
   git status     # Ensure working tree is clean
   ```

2. **Run the promotion script**:
   ```bash
   ./scripts/backup_and_promote.sh
   ```

3. **Monitor Netlify deployment**:
   - Netlify will automatically deploy when `main` is pushed
   - Verify environment variables are set (especially `ALLOW_BLOB_STORAGE=true`)

4. **Post-deployment verification**:
   - Test the live site
   - Verify database migrations have been run
   - Check that all features work as expected

Optional overrides (customize feature branch name):

   ```bash
   NEW_FEATURE_BRANCH=feature/my-new-feature ./scripts/backup_and_promote.sh
   ```

   Or with all options:

   ```bash
   BACKUP_BASE=WorkingSoftwareCKPoint REMOTE=origin MAIN_BRANCH=main MERGE_STRATEGY=no-ff NEW_FEATURE_BRANCH=feature/my-feature ./scripts/backup_and_promote.sh
   ```

## Rollback plan for FastAIGrader

If anything goes wrong after pushing to `main`, you can quickly restore `main` to the checkpoint:
```bash
# Replace the timestamp with the actual backup created by the script
# Example: WorkingSoftwareCKPoint-20251006-094735UTC
BACKUP="WorkingSoftwareCKPoint-YYYYMMDD-HHMMSSUTC"
git fetch origin
git checkout main
git reset --hard "origin/$BACKUP"
git push origin main --force-with-lease
```

> Use `--force-with-lease` to avoid clobbering others' work; confirm no new commits landed on `main` since your push.

- Netlify will automatically redeploy the rolled-back version
- Database migrations cannot be rolled back automatically - handle with care
- If you rolled back due to a database issue, you may need to manually revert migrations
- Check Netlify deployment logs to confirm rollback deployed successfully

## Notes & Best Practices for FastAIGrader

* **Protection rules**: Currently `main` is not protected. Direct pushes are allowed.
* **CI/CD**: Netlify automatically builds and deploys on push to `main`. Build command: `npm run build`.
* **Auditability**: `--no-ff` merges preserve the context of the promotion branch in history.
* **Immutability**: The script refuses to overwrite an existing backup branch name to keep checkpoints immutable.
* **Database migrations**: Always run SQL migrations on Neon database BEFORE promoting to main if schema changes exist.
* **Environment variables**: Verify all required env vars are set in Netlify before deployment:
  - `DATABASE_URL` (Neon PostgreSQL)
  - `OPENAI_API_KEY`
  - `ALLOW_BLOB_STORAGE=true` (for image persistence)
* **Testing**: Always test locally with `npm run dev` before promoting to main.
* **Build verification**: Run `npm run build` to ensure TypeScript compiles and Vite builds successfully.

## FastAIGrader-Specific Deployment Checklist

Before running `./scripts/backup_and_promote.sh`:

- [ ] All code committed and pushed to feature branch
- [ ] `npm run build` passes locally
- [ ] TypeScript has no errors
- [ ] Database migrations tested (if any)
- [ ] Environment variables verified in Netlify
- [ ] Local testing completed (`npm run dev`)
- [ ] Help documentation updated (if UI changes)
- [ ] No `.env` secrets committed to git