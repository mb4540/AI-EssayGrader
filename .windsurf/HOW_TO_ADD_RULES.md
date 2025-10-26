# How to Add Rules to Windsurf

## Current Structure

```
.windsurf/
├── project-rules.md           # Master rules file (overview)
└── rules/
    └── neon-database.md       # Neon database connection rules
```

## Adding New Rule Files

### Step 1: Create the Rule File

Create a new markdown file in `.windsurf/rules/`:

```bash
# Example: Adding API design rules
touch .windsurf/rules/api-design.md
```

### Step 2: Write the Rules

Structure your rules file with:
- Clear headings
- Specific guidelines
- Code examples
- Best practices
- Common pitfalls

**Example structure:**
```markdown
# API Design Rules

## Overview
Brief description of what this covers

## Guidelines
1. Rule 1
2. Rule 2

## Examples
```code examples```

## Best Practices
- Practice 1
- Practice 2

## Common Mistakes
- Mistake 1
- Mistake 2
```

### Step 3: Reference in Master File

Update `.windsurf/project-rules.md` to include the new rule file:

```markdown
### API Design Rules
- **File**: `rules/api-design.md`
- **Purpose**: Guidelines for designing consistent APIs
- **Covers**: Endpoint naming, error handling, response formats
```

### Step 4: Commit to Git

```bash
git add .windsurf/
git commit -m "Add API design rules"
git push
```

## Rule Categories to Consider

### Already Created
- ✅ Database (Neon connection and management)

### Suggested Future Rules
- [ ] **API Design** - Netlify Functions structure, error handling
- [ ] **Frontend Components** - React component patterns, prop types
- [ ] **Testing** - Unit tests, integration tests, E2E tests
- [ ] **Deployment** - Build process, environment variables
- [ ] **Security** - Authentication, authorization, data validation
- [ ] **Performance** - Optimization guidelines, caching strategies
- [ ] **Code Style** - TypeScript conventions, naming patterns
- [ ] **Git Workflow** - Branch naming, commit messages, PR process

## How Windsurf Uses Rules

Windsurf AI automatically:
1. Reads all `.md` files in `.windsurf/` directory
2. Uses them as context when generating code
3. Follows guidelines when making suggestions
4. References rules when explaining decisions

## Best Practices for Writing Rules

### DO:
- ✅ Be specific and actionable
- ✅ Include code examples
- ✅ Explain the "why" behind rules
- ✅ Keep rules up-to-date
- ✅ Use clear headings and structure

### DON'T:
- ❌ Write vague or ambiguous rules
- ❌ Include sensitive information (API keys, passwords)
- ❌ Make rules too long (split into multiple files)
- ❌ Contradict other rule files
- ❌ Forget to update when project changes

## Example: Creating a Testing Rules File

```bash
# 1. Create the file
touch .windsurf/rules/testing-guidelines.md

# 2. Add content
cat > .windsurf/rules/testing-guidelines.md << 'EOF'
# Testing Guidelines

## Overview
All code should be tested before merging to main.

## Unit Testing
- Use Jest for unit tests
- Test files: `*.test.ts` or `*.spec.ts`
- Minimum 80% code coverage

## Integration Testing
- Test Netlify Functions with mock data
- Verify database operations on test branches

## Example
\`\`\`typescript
describe('gradeSubmission', () => {
  it('should return a grade between 0 and 100', () => {
    const result = gradeSubmission(mockData);
    expect(result.grade).toBeGreaterThanOrEqual(0);
    expect(result.grade).toBeLessThanOrEqual(100);
  });
});
\`\`\`
EOF

# 3. Update master rules
# Edit .windsurf/project-rules.md to add reference

# 4. Commit
git add .windsurf/
git commit -m "Add testing guidelines"
```

## Verifying Rules Are Loaded

To check if Windsurf is using your rules:
1. Ask Windsurf a question related to the rules
2. It should reference the specific rule file
3. Its suggestions should follow the guidelines

Example:
```
You: "How should I connect to the database?"
Windsurf: "According to the Neon database rules, you should use 
the static localhost connection string: postgres://neon:npg@localhost:5432/..."
```

## Maintenance

### Regular Updates
- Review rules quarterly
- Update when project architecture changes
- Remove outdated guidelines
- Add new patterns as they emerge

### Version Control
- All rules are tracked in Git
- Changes are visible in commit history
- Team can review rule changes in PRs

## Questions?

If you're unsure about:
- What rules to add
- How to structure a rule file
- Whether a rule is needed

Ask in team discussions or create a draft for review.
