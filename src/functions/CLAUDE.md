# Server Functions - Data Access Layer Pattern

This guide helps AI assistants maintain consistent patterns when working with TanStack Start server functions.

## Core Principle: Separation of Concerns

**Business logic** (server functions) should be separate from **data access** (database queries).

```
Server Function (.ts)          Data Access Layer (.db.ts)
├─ Input validation           ├─ Database queries
├─ Authorization              ├─ ORM operations
├─ Business logic             ├─ Transactions
├─ Call DAL functions         └─ Type-safe returns
└─ Response transformation
```

## Quick Rules

### ✅ DO

- **Extract to `*.db.ts`**: Complex queries, joins, aggregations, transactions
- **Keep inline**: ORM condition builders (`eq`, `and`, `or`, `notInArray`)
- **Name clearly**: `get[Entity]By[Property]`, `update[Entity]`, `create[Entity]`
- **Add JSDoc**: Document parameters and return types on all DAL functions
- **Preserve parallelism**: Use `Promise.all()` for independent queries

### ❌ DON'T

- **No direct ORM calls** in server functions (except condition builders)
- **No business logic** in `*.db.ts` files (validation, authorization, etc.)
- **No generic abstractions** like `Repository<T>` - use specific, named functions
- **No breaking parallel execution** - keep queries independent

## File Organization

```
src/functions/
  user.db.ts                 # Data access layer for user operations
  user-role.ts               # Server function (uses user.db.ts)
  comment/
    comment.db.ts            # Data access layer for comments
    vote-comment.ts          # Server function (uses comment.db.ts)
    batch-comment-counts.ts  # Server function (uses comment.db.ts)
```

## Pattern Examples

### Example 1: Simple CRUD Operations

**❌ Before (inline queries):**
```typescript
// user-role.ts
import { eq } from "drizzle-orm";
import db from "~/server/db";
import { UserTable } from "~/server/db/schema";

export const makeUserAdmin = createServerFn()
  .handler(async ({ data: { userId, role } }) => {
    // Inline query - hard to reuse
    const [user] = await db
      .select()
      .from(UserTable)
      .where(eq(UserTable.id, userId))
      .limit(1);

    // Another inline query
    const [updated] = await db
      .update(UserTable)
      .set({ role, updatedAt: new Date() })
      .where(eq(UserTable.id, userId))
      .returning();

    return updated;
  });
```

**✅ After (using DAL):**
```typescript
// user.db.ts
export async function getUserById(userId: string) {
  return db
    .select()
    .from(UserTable)
    .where(eq(UserTable.id, userId))
    .limit(1);
}

export async function updateUserRole(userId: string, role: UserRole, updatedById: string) {
  return db
    .update(UserTable)
    .set({ role, updatedAt: new Date(), updatedById })
    .where(eq(UserTable.id, userId))
    .returning();
}

// user-role.ts
import { getUserById, updateUserRole } from "./user.db";

export const makeUserAdmin = createServerFn()
  .handler(async ({ data: { userId, role } }) => {
    const [user] = await getUserById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    const [updated] = await updateUserRole(userId, role, currentUser.id);
    return updated;
  });
```

### Example 2: Complex Queries with Parallel Execution

**✅ Batch operations with Promise.all:**
```typescript
// comment.db.ts
export async function getReplyCountsByCommentIds(commentIds: string[]) {
  return db
    .select({
      commentId: CommentTable.parentCommentId,
      count: sql<number>`count(*)`,
    })
    .from(CommentTable)
    .where(inArray(CommentTable.parentCommentId, commentIds))
    .groupBy(CommentTable.parentCommentId);
}

export async function getVoteCountsByCommentIds(commentIds: string[]) {
  return db
    .select({
      commentId: CommentTagsTable.commentId,
      yesCount: sql<number>`count(*) filter (where ${CommentTagsTable.against} = false)`,
      noCount: sql<number>`count(*) filter (where ${CommentTagsTable.against} = true)`,
    })
    .from(CommentTagsTable)
    .where(inArray(CommentTagsTable.commentId, commentIds))
    .groupBy(CommentTagsTable.commentId);
}

// batch-comment-counts.ts
import { getReplyCountsByCommentIds, getVoteCountsByCommentIds } from "./comment.db";

export const batchCommentCounts = createServerFn()
  .handler(async ({ data: { commentIds } }) => {
    // Clear business intent, parallel execution
    const [replyCounts, voteCounts] = await Promise.all([
      getReplyCountsByCommentIds(commentIds),
      getVoteCountsByCommentIds(commentIds),
    ]);

    return buildResponse(replyCounts, voteCounts);
  });
```

### Example 3: Condition Builders (Acceptable in Business Logic)

**✅ Build conditions in business logic, execute in DAL:**
```typescript
// discussion-list.ts
import { and, eq, notInArray } from "drizzle-orm";
import { getActiveDiscussions } from "./discussion.db";

export const listDiscussions = createServerFn()
  .handler(async ({ data: { pastIds, includeArchived } }) => {
    // Build conditions based on business rules
    const conditions = [eq(DiscussionTable.active, true)];

    if (pastIds.length > 0) {
      conditions.push(notInArray(DiscussionTable.id, pastIds));
    }

    if (!includeArchived) {
      conditions.push(eq(DiscussionTable.archived, false));
    }

    // Pass conditions to DAL
    return getActiveDiscussions(and(...conditions), { limit: 10 });
  });

// discussion.db.ts
export async function getActiveDiscussions(
  conditions: ReturnType<typeof and>,
  options: { limit: number }
) {
  return db.query.DiscussionTable.findMany({
    where: conditions,
    limit: options.limit,
  });
}
```

### Example 4: Transactions (Encapsulate in DAL)

**✅ Transaction in DAL:**
```typescript
// group.db.ts
export async function createImmediateMembership(
  groupId: string,
  userId: string,
  currentMemberCount: number
) {
  return db.transaction(async (tx) => {
    const [membership] = await tx
      .insert(GroupMembershipTable)
      .values({ groupId, userId, role: "MEMBER" })
      .returning();

    await tx
      .update(GroupTable)
      .set({ memberCount: currentMemberCount + 1 })
      .where(eq(GroupTable.id, groupId));

    return membership;
  });
}

// group-join.ts
import { createImmediateMembership } from "./group.db";

export const joinGroup = createServerFn()
  .handler(async ({ data: { groupId, userId } }) => {
    const group = await getGroupById(groupId);

    // Clean, atomic operation
    return createImmediateMembership(groupId, userId, group.memberCount);
  });
```

## Naming Conventions

| Pattern | Example | Use Case |
|---------|---------|----------|
| `get[Entity]By[Property]` | `getUserById()` | Single entity lookup |
| `get[Entity]sBy[Property]` | `getCommentsByDiscussionId()` | Multiple entities |
| `get[Metric]By[Entity]Ids` | `getReplyCountsByCommentIds()` | Batch aggregations |
| `getUser[Action]By[Entity]Ids` | `getUserVotesByCommentIds()` | User-specific batch |
| `create[Entity]` | `createComment()` | Insert operation |
| `update[Entity]` | `updateUserRole()` | Update operation |
| `delete[Entity]` | `deleteComment()` | Delete operation |

## Code Organization Within `.db.ts` Files

1. **Imports** at top
2. **JSDoc header** describing the module
3. **Read operations** (gets, lists, searches)
   - Batch queries first
   - Single entity queries second
4. **Write operations** (creates, updates, deletes)
5. **Transactions** (complex atomic operations)
6. **User-specific queries** (if needed)

## When to Create a New `.db.ts` File

Create a new data access layer file when:

- ✅ You have 3+ related database operations for an entity
- ✅ Queries are complex (joins, aggregations, raw SQL)
- ✅ Same query pattern is used in multiple places
- ✅ Transactions involve multiple steps

**Don't create `.db.ts` for:**
- ❌ Single simple query used once
- ❌ Generic CRUD already covered by `base-db-operations.ts`

## Migration Checklist

When refactoring existing code:

- [ ] Create `[entity].db.ts` file with data access functions
- [ ] Add JSDoc comments to all functions
- [ ] Move database queries from server functions to DAL
- [ ] Keep condition builders in business logic (acceptable)
- [ ] Preserve parallel execution with `Promise.all()`
- [ ] Run `bun run check-types` (must pass)
- [ ] Run `bun run lint` (must pass)
- [ ] Verify all tests still pass

## Reference Implementations

See these files for complete examples:

- `src/functions/user.db.ts` - Simple CRUD operations
- `src/functions/comment/comment.db.ts` - Complex batch operations
- `src/functions/discussion/discussion.db.ts` - Search and pagination
- `src/functions/group/group.db.ts` - Transactions and joins

## Common Pitfalls

### ❌ Don't put business logic in DAL

```typescript
// ❌ BAD: Validation in .db.ts
export async function getComments(discussionId: string) {
  const comments = await db.select()...;

  if (comments.length > MAX_ALLOWED) {
    throw new Error("Too many comments");
  }

  return comments;
}

// ✅ GOOD: Pure data access
export async function getComments(discussionId: string) {
  return db.select()...;
}
```

### ❌ Don't break parallel execution

```typescript
// ❌ BAD: Sequential (slow)
const replies = await getReplyCountsByCommentIds(ids);
const votes = await getVoteCountsByCommentIds(ids);

// ✅ GOOD: Parallel (fast)
const [replies, votes] = await Promise.all([
  getReplyCountsByCommentIds(ids),
  getVoteCountsByCommentIds(ids),
]);
```

### ❌ Don't over-abstract

```typescript
// ❌ BAD: Generic repository
class Repository<T> {
  findAll() { /* ... */ }
  findById() { /* ... */ }
}

// ✅ GOOD: Specific functions
export async function getActiveDiscussions() { /* ... */ }
export async function getDiscussionById(id: string) { /* ... */ }
```

## Questions?

Refer to this guide and the reference implementations listed above for guidance on data access layer patterns.
