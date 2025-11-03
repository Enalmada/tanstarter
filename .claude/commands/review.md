# Review

Review code changes against quality standards.

## Usage
Simply say: **"Review my code"** or **"Check this PR for issues"**

You can also use: `/review`

## Conventions

### What to Review
Review `git diff develop...HEAD` using "ultrathink" for thorough analysis:

**Core Issues**
- Behavioral changes: Unintended side effects? Multi-tenancy implications?
- API contracts: Breaking changes to function signatures, GraphQL schema?
- Edge cases: Null checks, Maybe/Either patterns, error handling?
- Bugs: Race conditions, memory leaks, N+1 queries, off-by-one errors?
- Data flow: Service→Repository→Database (API), Component→Hook→Store (Frontend)?
- Testing gaps: New logic paths covered? Locale-independent tests for formatted numbers?

**Specific Patterns**
- **Shadcn UI**: Using `Tabs`/`TabsList`/`TabsTrigger` for tabs? Correct button variants (NOT `ghost` on light)?
- **API**: Service→Repository separation? Maybe/Either for error handling?
- **Testing**: Using `data-testid`/`data-value` for locale-independent assertions?
- **Timezone/Locale**: UTC calculations? Locale-independent formatting?

### Output Format
Prioritized findings with severity levels (Critical → High → Medium → Low). Include file paths with line numbers.

**IMPORTANT**: Focus ONLY on issues, problems, and areas for improvement. Do NOT include:
- Positive feedback or praise
- "What was done well" sections
- Compliments about code quality
- Celebratory comments

Be direct and actionable. If there are no issues, simply state "No issues found."
