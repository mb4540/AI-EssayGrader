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
