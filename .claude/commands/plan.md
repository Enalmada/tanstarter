# Plan

Create a planning document for a complex feature before implementation.

## Usage
Simply say: **"Plan this feature"** and paste the README.md path


## Conventions

### Input
- file path to pre-plan document

### Output
- **Primary**: Lean README.md at `.plan/plans/<directory-name>/README.md`
- **Supporting**: Detailed research files in same directory (e.g., `research.md`, `analysis.md`)
- Strip `feature/`, `hotfix/` prefixes from directory name

### README.md Structure (Keep Lean)

**Problem Summary**
- Brief 2-3 sentence summary of what needs to be solved
- Links to detailed research files if needed

**Resources**
- Key codebase files (list paths only)
- Relevant documentation links
- Link to detailed research: `[See research.md](./research.md)`

**Plan** (Ultrathink-based)
- **CRITICAL**: Use "ultrathink" to trigger maximum thinking depth
- High-level approach and key decisions
- Major phases or milestones
- Keep concise - detailed analysis goes in separate files

**Tasks**
- Checkbox format for tracking
- Break down into phases: Foundation → Core → Testing (Vitest, storybook, playwright)
- Specific, actionable tasks
- Update as tasks are completed

### Supporting Files (Detailed Research)

Create separate files in `.plan/plans/<directory-name>/` for detailed content.
The plan should be the lean status tracking document pointing to more detailed research files.

### What NOT to Include
- Implementation instructions for anything obvious Claude Code can do
- Detailed bash scripts
- Step-by-step tutorials

This is a **planning document only** - it doesn't implement the feature. Use `/pr` after implementation.
