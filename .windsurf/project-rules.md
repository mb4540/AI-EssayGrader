# FastAI Grader - Windsurf Project Rules

This directory contains AI assistant rules and guidelines for the FastAI Grader project.

## Rules Files

### Code Style Conventions
- **File**: `rules/code-style.md`
- **Purpose**: TypeScript and general coding standards
- **Covers**:
  - Naming conventions (camelCase, PascalCase, UPPER_SNAKE_CASE, kebab-case)
  - TypeScript best practices (explicit types, no `any`)
  - Import organization (external, internal, relative, CSS)
  - Function style and length guidelines
  - Error handling patterns
  - Code formatting and comments
  - User-centric design principles (speed, simplicity, minimize clicks)

### Database Design Rules
- **File**: `rules/database-design.md`
- **Purpose**: Standards for database schema design and naming conventions
- **Covers**:
  - Database reference file (`/db_ref.md`) workflow
  - Table and column naming conventions
  - Primary key naming (use `tablename_id` not `id`)
  - Foreign key relationships and ON DELETE rules
  - Index naming and strategy
  - Data types and constraints
  - Migration patterns and schema organization

### Neon Database Rules
- **File**: `rules/neon-database.md`
- **Purpose**: Guidelines for connecting to and working with Neon Postgres database
- **Covers**: 
  - Neon Local Connect extension usage
  - Branch management strategies
  - Schema structure and migrations
  - Connection configuration
  - Best practices and troubleshooting

### API Design Rules
- **File**: `rules/api-design.md`
- **Purpose**: Standards for Netlify Functions structure and API patterns
- **Covers**:
  - Function structure and organization
  - Request/response patterns
  - Error handling standards
  - Database query patterns
  - Input validation with Zod
  - CORS and headers configuration

### Security Best Practices
- **File**: `rules/security.md`
- **Purpose**: Security guidelines to protect sensitive data
- **Covers**:
  - Environment variable handling
  - API key protection
  - SQL injection prevention (parameterized queries)
  - Input sanitization and validation
  - Error message security
  - CORS configuration
  - FERPA compliance considerations

### Frontend Components Rules
- **File**: `rules/frontend-components.md`
- **Purpose**: React component patterns and best practices
- **Covers**:
  - Component structure and organization
  - TypeScript interfaces for props
  - State management patterns
  - Tailwind CSS conventions
  - shadcn/ui integration
  - Accessibility standards

### Testing Guidelines
- **File**: `rules/testing.md`
- **Purpose**: Testing standards and practices
- **Covers**:
  - Unit testing patterns (Vitest)
  - Integration testing
  - Test file organization
  - Mock data and fixtures
  - Coverage requirements (75% target)
  - CI/CD integration

### Git Workflow Rules
- **File**: `rules/git-workflow.md`
- **Purpose**: Version control practices and Git workflow
- **Covers**:
  - Branch naming conventions
  - Commit message format
  - Pull request process
  - Code review guidelines
  - Merge strategies
  - Release procedures

### Multi-Project Workspace Rules
- **File**: `rules/multi-project-workspace.md`
- **Purpose**: Rules for working with multiple projects in workspace
- **Covers**:
  - AI-EssayGrader (ACTIVE PROJECT - all changes allowed)
  - gift-of-time-assistant (REFERENCE ONLY - read only)
  - Critical access rules and permissions
  - Path verification before write operations

### Cleanup Workflow
- **File**: `rules/cleanup.md`
- **Purpose**: Code cleanup and organization workflow
- **Covers**:
  - Backup and safety procedures
  - Dead code removal process
  - Console.log cleanup
  - Import optimization
  - File organization
  - Verification steps

### Refactoring Workflow
- **File**: `rules/refactor.md`
- **Purpose**: Code refactoring and quality improvement workflow
- **Covers**:
  - Code quality standards
  - Testing strategy (75%+ coverage target)
  - Refactoring patterns
  - Component organization
  - Type safety improvements
  - Performance optimization

### Safe Code Release
- **File**: `rules/safe-code-release.md`
- **Purpose**: Safe deployment and release procedures
- **Covers**:
  - Pre-release checklist
  - Testing requirements
  - Backup procedures
  - Deployment steps
  - Rollback procedures
  - Post-deployment verification

## How to Use

Windsurf AI will automatically reference these rules when:
- Working with database code
- Creating or modifying Netlify functions
- Debugging connection issues
- Suggesting database queries or schema changes

## Adding New Rules

To add new rule files:

1. Create a new `.md` file in `.windsurf/rules/`
2. Use descriptive naming (e.g., `api-design.md`, `testing-guidelines.md`)
3. Structure with clear headings and examples
4. Reference from this file

## Project Context

- **Framework**: React + Vite + TypeScript
- **Backend**: Netlify Functions (serverless)
- **Database**: Neon Postgres (serverless)
- **AI**: OpenAI API
- **Styling**: Tailwind CSS + shadcn/ui
- **Deployment**: Netlify

## Key Principles

1. **Database**: Always use Neon Local Connect for development
2. **Environment**: Never commit `.env` files
3. **Branching**: Use ephemeral branches for testing
4. **Security**: Use environment variables for all credentials
5. **Code Style**: Follow TypeScript best practices
6. **Testing**: Test on feature branches before merging

## Quick Links

- Main Documentation: `/README.md`
- Database Reference: `/db_ref.md`
- Database Schema Query: `/get_complete_schema.sql`
- All Rules: `.windsurf/rules/`
- Master Todo: `/MasterToDo/MasterToDo.md`
- Completed Tasks: `/MasterToDo/CompletedToDo.md`
