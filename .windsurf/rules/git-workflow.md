# Git Workflow Rules

## Overview
Version control practices and Git workflow standards for the FastAI Grader project.

## Core Principles

1. **Commit Often** - Small, focused commits
2. **Clear Messages** - Descriptive commit messages
3. **Branch Strategy** - Feature branches for all changes
4. **Code Review** - All changes reviewed before merging
5. **Clean History** - Maintain readable Git history

## Branch Strategy

### Branch Types

```
main (production)
  ├── development (integration)
  │   ├── feature/new-grading-algorithm
  │   ├── feature/student-dashboard
  │   ├── bugfix/submission-validation
  │   └── hotfix/critical-security-fix
  └── release/v1.2.0
```

### Branch Naming

**Pattern:** `type/description-in-kebab-case`

**Types:**
- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Critical production fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation only
- `test/` - Test additions/changes
- `chore/` - Maintenance tasks

**Examples:**
```bash
# ✅ Good
feature/ai-grading-improvements
bugfix/submission-form-validation
hotfix/database-connection-timeout
refactor/api-error-handling
docs/setup-guide-updates
test/add-integration-tests
chore/update-dependencies

# ❌ Bad
new-feature
fix
my-branch
test123
```

### Creating Branches

```bash
# Always branch from development
git checkout development
git pull origin development

# Create feature branch
git checkout -b feature/new-dashboard

# Work on feature
git add .
git commit -m "feat: add new dashboard layout"

# Push to remote
git push -u origin feature/new-dashboard
```

## Commit Messages

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting, missing semicolons, etc.
- `refactor` - Code restructuring
- `test` - Adding tests
- `chore` - Maintenance

### Examples

```bash
# ✅ Good - Clear and descriptive
feat(api): add health check endpoint
fix(submission): validate student name length
docs(readme): update setup instructions
refactor(database): use proper column naming
test(api): add integration tests for grade endpoint
chore(deps): update React to v18.3

# ❌ Bad - Vague or unclear
update stuff
fix bug
changes
wip
asdf
```

### Detailed Commit Message

```bash
feat(grading): implement weighted rubric scoring

Add support for weighted rubric criteria where each
category can have a different weight. Grammar: 25%,
Content: 50%, Structure: 25%.

Closes #123
```

### Commit Best Practices

**DO:**
- ✅ Write in present tense ("add feature" not "added feature")
- ✅ Keep subject line under 50 characters
- ✅ Capitalize subject line
- ✅ No period at end of subject
- ✅ Use body to explain WHAT and WHY
- ✅ Reference issues/tickets

**DON'T:**
- ❌ Commit commented-out code
- ❌ Commit console.logs
- ❌ Commit .env files
- ❌ Make huge commits with unrelated changes
- ❌ Use vague messages like "fix" or "update"

## Pull Request Process

### Creating a PR

1. **Ensure branch is up to date**
```bash
git checkout development
git pull origin development
git checkout feature/my-feature
git rebase development
```

2. **Push changes**
```bash
git push origin feature/my-feature
```

3. **Create PR on GitHub/GitLab**
- Title: Clear, descriptive summary
- Description: What, why, how
- Link related issues
- Add screenshots if UI changes
- Request reviewers

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- Added X feature
- Fixed Y bug
- Refactored Z component

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manually tested locally
- [ ] Tested on staging

## Screenshots (if applicable)
[Add screenshots here]

## Related Issues
Closes #123
Related to #456

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No console.logs left in code
- [ ] Tests pass locally
```

### Code Review Guidelines

**As Author:**
- Respond to all comments
- Make requested changes
- Mark conversations as resolved
- Keep PR scope focused

**As Reviewer:**
- Be constructive and respectful
- Explain reasoning for suggestions
- Approve when satisfied
- Test changes if possible

## Merging Strategy

### Merge Methods

**Squash and Merge** (Preferred)
- Combines all commits into one
- Keeps main branch history clean
- Use for feature branches

```bash
# Squash merge via GitHub/GitLab UI
# Or manually:
git checkout development
git merge --squash feature/my-feature
git commit -m "feat: add new dashboard"
```

**Rebase and Merge**
- Maintains individual commits
- Linear history
- Use for small, well-organized branches

**Merge Commit**
- Creates merge commit
- Preserves branch history
- Use for release branches

### After Merging

```bash
# Delete feature branch
git branch -d feature/my-feature
git push origin --delete feature/my-feature

# Update local development
git checkout development
git pull origin development
```

## Handling Conflicts

### Resolving Conflicts

```bash
# Update your branch
git checkout feature/my-feature
git fetch origin
git rebase origin/development

# If conflicts occur
# 1. Fix conflicts in files
# 2. Stage resolved files
git add .

# 3. Continue rebase
git rebase --continue

# 4. Force push (rebase rewrites history)
git push --force-with-lease origin feature/my-feature
```

### Avoiding Conflicts

- Pull frequently from development
- Keep branches short-lived
- Communicate with team about overlapping work
- Merge development into feature branch regularly

## Git Ignore

### What to Ignore

```gitignore
# Dependencies
node_modules/

# Environment
.env
.env.local
.env.*.local

# Build output
dist/
.netlify/
build/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Testing
coverage/

# Temporary
*.tmp
.cache/
```

## Tags and Releases

### Semantic Versioning

**Format:** `v<major>.<minor>.<patch>`

- **Major**: Breaking changes
- **Minor**: New features (backwards compatible)
- **Patch**: Bug fixes

**Examples:**
- `v1.0.0` - Initial release
- `v1.1.0` - New feature added
- `v1.1.1` - Bug fix
- `v2.0.0` - Breaking changes

### Creating Tags

```bash
# Create annotated tag
git tag -a v1.2.0 -m "Release version 1.2.0"

# Push tag
git push origin v1.2.0

# List tags
git tag -l
```

## Emergency Procedures

### Reverting a Commit

```bash
# Revert last commit (creates new commit)
git revert HEAD

# Revert specific commit
git revert <commit-hash>
```

### Hotfix Process

```bash
# Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug

# Fix the bug
git add .
git commit -m "hotfix: fix critical security vulnerability"

# Merge to main
git checkout main
git merge hotfix/critical-bug
git push origin main

# Also merge to development
git checkout development
git merge hotfix/critical-bug
git push origin development

# Delete hotfix branch
git branch -d hotfix/critical-bug
```

## Best Practices

### DO:
- ✅ Commit early and often
- ✅ Write clear commit messages
- ✅ Keep branches up to date
- ✅ Review your own code before requesting review
- ✅ Test before pushing
- ✅ Delete merged branches
- ✅ Use meaningful branch names

### DON'T:
- ❌ Commit directly to main
- ❌ Force push to shared branches
- ❌ Commit secrets or credentials
- ❌ Leave branches open for weeks
- ❌ Make commits with unrelated changes
- ❌ Ignore merge conflicts
- ❌ Skip code review

## Useful Commands

### Status and History

```bash
# Check status
git status

# View commit history
git log --oneline --graph --all

# View changes
git diff

# View staged changes
git diff --staged
```

### Undoing Changes

```bash
# Discard unstaged changes
git checkout -- <file>

# Unstage file
git reset HEAD <file>

# Amend last commit
git commit --amend

# Reset to previous commit (dangerous!)
git reset --hard HEAD~1
```

### Stashing

```bash
# Stash changes
git stash

# List stashes
git stash list

# Apply stash
git stash apply

# Apply and remove stash
git stash pop
```

## Checklist

Before pushing:

- [ ] Code compiles/builds successfully
- [ ] All tests pass
- [ ] No console.logs or debug code
- [ ] No commented-out code
- [ ] .env files not included
- [ ] Commit message is clear
- [ ] Branch name follows convention
- [ ] Changes are focused and related

Before creating PR:

- [ ] Branch is up to date with development
- [ ] All commits are meaningful
- [ ] PR description is complete
- [ ] Tests added for new features
- [ ] Documentation updated
- [ ] Self-review completed
- [ ] Reviewers assigned

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Best Practices](https://git-scm.com/book/en/v2)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Semantic Versioning](https://semver.org/)
- Related: `.windsurf/rules/code-style.md`
