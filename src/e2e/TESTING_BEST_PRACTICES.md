# E2E Testing Best Practices - TanStarter

This guide documents the testing patterns and best practices implemented in TanStarter. Use this as a reference when writing new tests or refactoring existing ones.

## Table of Contents

1. [Page Object Model Pattern](#page-object-model-pattern)
2. [Test Organization](#test-organization)
3. [Writing Tests](#writing-tests)
4. [Common Patterns](#common-patterns)
5. [Best Practices](#best-practices)
6. [Examples](#examples)

---

## Page Object Model Pattern

### What is POM?

Page Object Model (POM) is a design pattern that:
- Encapsulates page interactions in reusable classes
- Separates test logic from UI interactions
- Makes tests resilient to UI changes
- Improves test maintainability and readability

### Structure

```
src/e2e/
├── pages/                    # Page Object Models
│   ├── base.page.ts         # Base class with common functionality
│   ├── admin/               # Admin-specific pages
│   │   ├── tasks-list.page.ts
│   │   ├── task-form.page.ts
│   │   └── users.page.ts
│   ├── member/              # Member-specific pages
│   │   ├── tasks-list.page.ts
│   │   └── task-form.page.ts
│   └── public/              # Public pages
│       └── marketing.page.ts
│
├── admin/                    # Admin tests
│   ├── tasks.test.ts
│   ├── access.test.ts
│   └── users.test.ts
├── member/                   # Member tests
│   ├── tasks.test.ts
│   └── access.test.ts
├── public/                   # Public tests
│   └── marketing.test.ts
└── authenticated/            # Integration tests
    ├── admin-task.test.ts
    └── task.test.ts
```

---

## Page Object Model Implementation

### 1. BasePage Class

All page objects extend `BasePage` for common functionality:

```typescript
import { BasePage } from "../base.page";

export class MyPage extends BasePage {
  protected readonly path = "/my-page";

  constructor(page: Page) {
    super(page);
  }
}
```

**BasePage provides:**
- `goto()` - Navigate to page and wait for load
- `gotoAndWaitForReady()` - Navigate + wait for spinners
- `waitForPageLoad()` - Wait for DOM and network idle
- `waitForLoadingComplete()` - Wait for loading spinners
- `waitForUrl()` - Wait for URL pattern
- `getUrl()`, `isOnPage()` - URL utilities

### 2. Locator Methods

Define locators as methods, not properties:

```typescript
// ✅ Good - Dynamic locators
getAddNewButton(): Locator {
  return this.page.getByRole("button", { name: "Add New" });
}

// ❌ Avoid - Static locators (can be stale)
private readonly addNewButton = this.page.getByRole("button", { name: "Add New" });
```

**Use semantic locators:**
- `getByRole()` - Buttons, links, headings
- `getByLabel()` - Form inputs
- `getByPlaceholder()` - Input placeholders
- `getByTestId()` - Last resort for complex elements

### 3. Three-Layer POM Pattern

Organize methods in three layers:

**Layer 1: Element Locators**
```typescript
getTitleInput(): Locator {
  return this.page.getByLabel("Title");
}
```

**Layer 2: Data Retrieval**
```typescript
async getTitleValue(): Promise<string> {
  return await this.getTitleInput().inputValue() || "";
}
```

**Layer 3: Validation Methods**
```typescript
async assertTitleMatches(expected: string): Promise<void> {
  const actual = await this.getTitleValue();
  expect(actual).toBe(expected);
}
```

### 4. Action Methods

Encapsulate user actions:

```typescript
async clickAddNew(): Promise<void> {
  await this.getAddNewButton().click();
}

async createTask(data: { title: string; description?: string }): Promise<void> {
  await this.fillTitle(data.title);
  if (data.description) {
    await this.fillDescription(data.description);
  }
  await this.submit();
}
```

### 5. Complex Workflows

For integration tests, provide workflow helpers:

```typescript
/**
 * Complete CRUD workflow: Create → Edit → Delete
 * Useful for integration tests that need full lifecycle
 */
async performCRUDWorkflow(options: {
  title: string;
  updatedTitle?: string;
}): Promise<void> {
  // Create
  await this.createTask({ title: options.title });
  await this.waitForUrl(/^\/admin\/tasks\/[^/]+$/);

  // Edit if specified
  if (options.updatedTitle) {
    await this.editTask({ title: options.updatedTitle });
  }

  // Delete
  await this.delete();
  await this.waitForUrl("/admin/tasks");
}
```

---

## Writing Tests

### Test Structure

```typescript
import { expect, test } from "@playwright/test";
import { AdminTasksListPage } from "../pages/admin/tasks-list.page";
import { AdminTaskFormPage } from "../pages/admin/task-form.page";

test.describe("Feature Name", () => {
  // Setup auth state
  test.use({ storageState: "playwright/.auth/admin.json" });

  // Setup before each test
  test.beforeEach(async ({ page }) => {
    const tasksListPage = new AdminTasksListPage(page);
    await tasksListPage.gotoAndWaitForReady();
  });

  test("should perform specific action", async ({ page }) => {
    // Arrange - Create page objects
    const tasksListPage = new AdminTasksListPage(page);

    // Act - Perform actions
    await tasksListPage.clickAddNew();

    // Assert - Verify results
    expect(tasksListPage.isOnPage("/admin/tasks/new")).toBe(true);
  });
});
```

### Test Naming

Use descriptive names that explain:
- What is being tested
- Expected behavior
- Context if relevant

**Good examples:**
- `"should show admin tasks page with correct table structure"`
- `"should handle complete task CRUD workflow"`
- `"should navigate to task details when clicking row"`

**Avoid:**
- `"test 1"`
- `"admin page works"`
- `"tasks"`

### Arrange-Act-Assert Pattern

Structure tests clearly:

```typescript
test("should create and display new task", async ({ page }) => {
  // Arrange - Set up page objects and data
  const taskFormPage = new AdminTaskFormPage(page);
  const testTitle = `Test Task ${Date.now()}`;

  // Act - Perform the action being tested
  await taskFormPage.createTask({ title: testTitle });
  await taskFormPage.waitForUrl(/^\/admin\/tasks\/[^/]+$/);

  // Assert - Verify the result
  const createdTitle = await taskFormPage.getTitleValue();
  expect(createdTitle).toBe(testTitle);
});
```

---

## Common Patterns

### 1. Authentication

Use pre-authenticated storage states:

```typescript
// For admin tests
test.use({ storageState: "playwright/.auth/admin.json" });

// For member tests
test.use({ storageState: "playwright/.auth/member.json" });

// For public tests (no auth needed)
// Don't specify storageState
```

### 2. Waiting for Page Load

```typescript
// Option 1: Use BasePage method (recommended)
await tasksListPage.gotoAndWaitForReady();

// Option 2: Manual waiting (when needed)
await page.goto("/admin/tasks");
await page.waitForLoadState("domcontentloaded");
await page.waitForLoadState("networkidle");
```

### 3. Waiting for Loading Spinners

```typescript
// Automatic (preferred)
await taskFormPage.waitForFormReady();

// Manual (if needed)
await taskFormPage.waitForLoadingComplete();
```

### 4. Dynamic Test Data

Use timestamps for unique data:

```typescript
const testTitle = `Test Task ${Date.now()}`;
const testEmail = `user-${Date.now()}@example.com`;
```

### 5. URL Verification

```typescript
// Using BasePage helper
expect(tasksListPage.isOnPage("/admin/tasks")).toBe(true);

// Using regex
expect(taskFormPage.isOnPage(/^\/admin\/tasks\/[^/]+$/)).toBe(true);

// Wait for URL
await taskFormPage.waitForUrl("/admin/tasks/new");
```

### 6. Test Cleanup

Always clean up test data:

```typescript
test("should create and delete task", async ({ page }) => {
  const taskFormPage = new AdminTaskFormPage(page);

  // Create task
  await taskFormPage.createTask({ title: "Test Task" });

  // Use task...

  // Clean up (important!)
  await taskFormPage.delete();
  await taskFormPage.waitForUrl("/admin/tasks");
});
```

---

## Best Practices

### 1. Use Page Objects, Not Direct Playwright API

**❌ Avoid:**
```typescript
test("should create task", async ({ page }) => {
  await page.goto("/admin/tasks/new");
  await page.getByPlaceholder("Enter task title").fill("Test");
  await page.getByRole("button", { name: "Create Task" }).click();
});
```

**✅ Prefer:**
```typescript
test("should create task", async ({ page }) => {
  const taskFormPage = new AdminTaskFormPage(page);
  await taskFormPage.goto();
  await taskFormPage.createTask({ title: "Test" });
});
```

### 2. Avoid Hardcoded Timeouts

**❌ Avoid:**
```typescript
await page.waitForSelector("button", { timeout: 5000 });
```

**✅ Prefer:**
```typescript
// Let Playwright auto-wait (default timeout)
await expect(taskFormPage.getSubmitButton()).toBeVisible();

// Or use BasePage helper
await taskFormPage.waitForLoadingComplete();
```

### 3. Use Semantic Locators

**❌ Avoid:**
```typescript
page.locator(".btn-primary");
page.locator("#submit-button");
page.locator("div > button:nth-child(2)");
```

**✅ Prefer:**
```typescript
page.getByRole("button", { name: "Submit" });
page.getByLabel("Task Title");
page.getByPlaceholder("Enter description");
```

### 4. Test One Thing Per Test

**❌ Avoid:**
```typescript
test("should test everything", async ({ page }) => {
  // Tests navigation, form, list, and delete all in one
  // 100+ lines of code
});
```

**✅ Prefer:**
```typescript
test("should create task", async ({ page }) => { /* ... */ });
test("should edit task", async ({ page }) => { /* ... */ });
test("should delete task", async ({ page }) => { /* ... */ });
```

### 5. Keep Tests Independent

Each test should be able to run in isolation:

```typescript
test.describe("Tasks", () => {
  // ✅ Good - Each test is self-contained
  test("should create task", async ({ page }) => {
    await taskFormPage.createTask({ title: "Task 1" });
    await taskFormPage.delete(); // Cleanup
  });

  test("should edit task", async ({ page }) => {
    await taskFormPage.createTask({ title: "Task 2" });
    await taskFormPage.edit({ title: "Updated" });
    await taskFormPage.delete(); // Cleanup
  });
});
```

### 6. Document Complex Tests

Add comments for complex workflows:

```typescript
test("should handle multi-step workflow", async ({ page }) => {
  // Step 1: Create task as admin
  const taskFormPage = new AdminTaskFormPage(page);
  await taskFormPage.createTask({ title: "Complex Task" });

  // Step 2: Verify task appears in list
  const tasksListPage = new AdminTasksListPage(page);
  await tasksListPage.goto();
  // ... assertions

  // Step 3: Clean up
  await taskFormPage.delete();
});
```

---

## Examples

### Example 1: Simple Page Test

```typescript
test("should show task form page", async ({ page }) => {
  const taskFormPage = new AdminTaskFormPage(page);
  await taskFormPage.goto();

  const fields = taskFormPage.getFormFields();
  await expect(fields.title).toBeVisible();
  await expect(fields.description).toBeVisible();
  await expect(taskFormPage.getSubmitButton()).toBeVisible();
});
```

### Example 2: Form Submission

```typescript
test("should create new task", async ({ page }) => {
  const taskFormPage = new AdminTaskFormPage(page);
  await taskFormPage.goto();

  const testTitle = `Test Task ${Date.now()}`;
  await taskFormPage.createTask({
    title: testTitle,
    description: "Test description",
  });

  await taskFormPage.waitForUrl(/^\/admin\/tasks\/[^/]+$/);

  const createdTitle = await taskFormPage.getTitleValue();
  expect(createdTitle).toBe(testTitle);

  // Clean up
  await taskFormPage.delete();
});
```

### Example 3: CRUD Workflow

```typescript
test("should perform complete CRUD workflow", async ({ page }) => {
  const tasksListPage = new AdminTasksListPage(page);
  const taskFormPage = new AdminTaskFormPage(page);

  // Create
  await tasksListPage.clickAddNew();
  const testTitle = `Test Task ${Date.now()}`;
  await taskFormPage.createTask({ title: testTitle });

  // Read (verify created)
  expect(await taskFormPage.getTitleValue()).toBe(testTitle);

  // Update
  const updatedTitle = `Updated ${testTitle}`;
  await taskFormPage.editTask({ title: updatedTitle });
  expect(await taskFormPage.getTitleValue()).toBe(updatedTitle);

  // Delete
  await taskFormPage.delete();
  expect(tasksListPage.isOnPage("/admin/tasks")).toBe(true);
});
```

### Example 4: Using Helper Methods

```typescript
test("should use workflow helper", async ({ page }) => {
  const tasksListPage = new AdminTasksListPage(page);
  const taskFormPage = new AdminTaskFormPage(page);

  await tasksListPage.clickAddNew();

  // One method handles Create → Edit → Delete
  await taskFormPage.performCRUDWorkflow({
    title: `Workflow Test ${Date.now()}`,
    updatedTitle: `Updated Workflow ${Date.now()}`,
  });

  expect(tasksListPage.isOnPage("/admin/tasks")).toBe(true);
});
```

---

## Troubleshooting

### Test Timeouts

If tests timeout, check:
1. Is `waitForLoadingComplete()` being called?
2. Are loading spinners actually appearing?
3. Is network idle being reached?

```typescript
// Debug loading states
console.log("Before goto");
await taskFormPage.goto();
console.log("After goto");
await taskFormPage.waitForLoadingComplete();
console.log("Loading complete");
```

### Stale Elements

If getting "Element is not attached to the DOM":
1. Use dynamic locators (methods, not properties)
2. Don't cache element references
3. Re-query elements before interacting

```typescript
// ✅ Good - Fresh query each time
async clickButton(): Promise<void> {
  await this.getSubmitButton().click();
}

// ❌ Bad - Element might be stale
private submitButton = this.page.getByRole("button");
async clickButton(): Promise<void> {
  await this.submitButton.click(); // May fail if page changed
}
```

### Flaky Tests

If tests are flaky:
1. Add proper waits (`waitForLoadState`, `waitForSelector`)
2. Use `toBeVisible()` instead of `toBe(true)` for visibility
3. Ensure test data is unique (use `Date.now()`)
4. Clean up test data after each test

---

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Page Object Model Guide](https://playwright.dev/docs/pom)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [FrontlineIQ POM Learnings](../../../POM_LEARNINGS_FROM_FRONTLINEIQ.md)

---

## Summary

**Key Takeaways:**
1. ✅ Always use Page Objects for UI interactions
2. ✅ Use semantic locators (`getByRole`, `getByLabel`)
3. ✅ Avoid hardcoded timeouts; use smart waiting
4. ✅ Keep tests focused and independent
5. ✅ Clean up test data after each test
6. ✅ Document complex workflows
7. ✅ Follow the three-layer POM pattern

**Before Writing a Test:**
- [ ] Is there a Page Object for this page?
- [ ] If not, create one first
- [ ] Use existing Page Object methods
- [ ] Follow Arrange-Act-Assert pattern
- [ ] Add cleanup code
- [ ] Verify test can run in isolation

**Code Review Checklist:**
- [ ] Uses Page Objects (not direct Playwright API)
- [ ] Uses semantic locators
- [ ] No hardcoded timeouts
- [ ] Test name is descriptive
- [ ] Test is focused (tests one thing)
- [ ] Test cleans up after itself
- [ ] Complex logic is documented

---

**Last Updated**: 2025-11-02
**Maintained By**: Engineering Team
