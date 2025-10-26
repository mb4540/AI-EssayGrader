---
trigger: always_on
---

# Multi-Project Workspace Rules

## Overview
This workspace contains two projects with different purposes and access levels.

## Projects

### AI-EssayGrader (ACTIVE PROJECT)
- **Location**: `/Users/michaelberry/Documents/CascadeProjects/AI-EssayGrader/AI-EssayGrader`
- **Status**: Active development project
- **Permissions**: ALL changes, edits, file creation, and modifications
- **Actions Allowed**: Read, write, edit, create, delete, run commands, deploy

### gift-of-time-assistant (REFERENCE ONLY)
- **Location**: `/Users/michaelberry/Documents/CascadeProjects/gift-of-time-assistant`
- **Status**: Reference project only
- **Permissions**: READ ONLY - No modifications allowed
- **Actions Allowed**: Read files, search code, reference patterns/implementations
- **Actions PROHIBITED**: Edit, create files, delete, modify, run commands in this directory

## Critical Rules

1. **NEVER make changes to gift-of-time-assistant** - No edits, creates, deletes, or commands
2. **ALL development work goes to AI-EssayGrader** - All code changes, features, and fixes
3. **Reference gift-of-time-assistant for patterns only** - Read and adapt, never modify
4. **Always verify project path** before write operations - Must start with AI-EssayGrader path

## When Referencing gift-of-time-assistant

1. Acknowledge it's being used as reference
2. Read the relevant files/patterns
3. Adapt the pattern to AI-EssayGrader
4. Implement ONLY in AI-EssayGrader directory
5. Confirm with user if unclear about implementation location
