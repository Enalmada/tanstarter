# Respond to PR Comments

Analyze all PR review comments and create a comprehensive plan to address them using maximum thinking power.

## Usage
Simply say: **"Respond to PR comments"** or **"Address PR feedback"**

You can also use:
- `/respond` (auto-detect from current branch)
- `/respond 618` (with PR number)
- `/respond https://github.com/Enalmada/tanstarter/pull/29` (with full URL)

## Instructions

When this command is invoked:

### Step 1: Identify the PR

1. **Get current branch name**: `git branch --show-current`
2. **Find associated PR**:
   - If user provided full GitHub URL, use that directly with `gh pr view`
   - If user provided PR number, use that
   - Otherwise try `gh pr view --json number,url` to get PR from current branch
   - If none work, ask user for PR number or URL
3. **Read plan context**: If `.plan/plans/<branch_name>/README.md` exists, read it for context about the PR's purpose and technical decisions

### Step 2: Fetch All PR Comments

Use GitHub CLI to get all review comments:

```bash
gh pr view <PR_NUMBER> --json comments,reviews --jq '
  {
    "comments": [.comments[] | {author: .author.login, body: .body, createdAt: .createdAt}],
    "reviews": [.reviews[] | {author: .author.login, state: .state, body: .body, comments: [.comments[]? | {path: .path, line: .line, body: .body}]}]
  }
'
```

Also check for inline code review comments

### Step 3: Deep Analysis with Maximum Thinking

```
You are analyzing PR review feedback for a software project.

PR #<NUMBER>: <TITLE>

Plan Context (from .plan/plans/<branch_name>/README.md):
<PLAN_CONTEXT_IF_EXISTS>

Review Comments:
<ALL_COMMENTS_FORMATTED>

Your task:
1. Categorize all feedback (critical bugs, suggestions, questions, style preferences)
2. Identify dependencies between changes (what must be done first)
3. Assess impact of each change (breaking changes, performance, maintainability)
4. Create a prioritized action plan with estimated effort
5. Identify any conflicting feedback that needs clarification
6. Suggest improvements beyond what was explicitly requested

For each comment, determine:
- Is it a blocker for merge?
- What files/components are affected?
- Are there related changes needed in tests, docs, or other areas?
- What's the best implementation approach?

Think step-by-step through the implications of each change.
```

### Step 4: Create TODO List

Use `TodoWrite` to create a comprehensive task list based on the analysis:

- Mark critical/blocking issues as high priority
- Group related changes together
- Include testing and documentation tasks
- Add estimated complexity/effort if clear

### Step 5: Generate Summary Report

Create a markdown summary:

```markdown
## PR Review Response Plan

**PR**: #<NUMBER> - <TITLE>
**Reviewer(s)**: <REVIEWER_NAMES>
**Total Comments**: <COUNT>

### Critical Issues (Must Fix)
- [ ] Issue 1 - <description> (affects: <files>)
- [ ] Issue 2 - <description> (affects: <files>)

### Important Suggestions
- [ ] Suggestion 1 - <description>
- [ ] Suggestion 2 - <description>

### Questions to Clarify
- Question 1: <reviewer question> - Proposed answer: <your analysis>
- Question 2: <reviewer question> - Proposed answer: <your analysis>

### Nice-to-Have Improvements
- Improvement 1
- Improvement 2

### Implementation Order
1. <First task> (blocks: <dependent tasks>)
2. <Second task>
3. <Third task>

### Estimated Effort
- Critical fixes: <time estimate>
- Important changes: <time estimate>
- Total: <time estimate>

### Next Steps
1. <immediate action>
2. <follow-up action>
```

### Step 6: Ask for Confirmation

Present the plan to the user and ask:
- "Should I proceed with implementing these changes?"
- "Are there any comments you want to skip or handle differently?"
- "Do you want me to start with the critical issues first?"

## Example Invocations

**User**: "/respond 618"

**Claude**:
1. Fetches PR #618 details
2. Reads `.plan/plans/<branch_name>/README.md` for context
3. Retrieves all review comments and inline code comments
4. Uses deep thinking to analyze feedback comprehensively
5. Creates TODO list with prioritized tasks
6. Presents summary and asks for direction

**User**: "/respond https://github.com/Enalmada/tanstarter/pull/29"

**Claude**:
1. Fetches PR from the provided URL
2. Gets branch name and reads plan context if available
3. Retrieves all review comments and inline code comments
4. Uses deep thinking to analyze feedback comprehensively
5. Creates TODO list with prioritized tasks
6. Presents summary and asks for direction

## Notes

- This command focuses on PLANNING, not immediate implementation
- Use maximum thinking to catch implications the reviewer might not have explicitly mentioned
- Look for patterns in feedback that suggest deeper architectural concerns
- Consider test coverage, documentation, and edge cases for each change
- If multiple reviewers have conflicting feedback, highlight this for user clarification
