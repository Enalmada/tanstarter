# Radix UI to Base UI Migration Guide

This document covers the migration from Radix UI (used by shadcn/ui "new-york" style) to Base UI (shadcn/ui "base-vega" style).

## Quick Start

1. Update `components.json` to use `"style": "base-vega"`
2. Remove all `@radix-ui/*` packages
3. Add `@base-ui/react`
4. Re-pull components: `bunx shadcn@latest add <component-name>`
5. Update app code to use `render` prop instead of `asChild`

## Key Pattern Changes

### Button/Link Composition

**Radix (asChild pattern):**
```tsx
<Button asChild>
  <Link to="/home">Home</Link>
</Button>
```

**Base UI (render prop pattern):**
```tsx
<Button render={<Link to="/home" />}>
  Home
</Button>
```

### Button nativeButton Warning

When using `render` prop with Button to render as a Link/anchor, Base UI will warn:

```
Base UI: A component that acts as a button was not rendered as a native <button>...
```

**Fix:** Update your Button component to automatically set `nativeButton={false}` when `render` is provided:

```tsx
function Button({
  render,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      {...(render ? { render, nativeButton: false } : {})}
      {...props}
    />
  );
}
```

### Navigation Links with Button Styling (Recommended)

**IMPORTANT:** When using `Button` with `render={<Link />}`, Base UI adds `role="button"` to the element, which overrides the link's implicit `role="link"`. This breaks accessibility - navigation elements should be links, not buttons.

**Problem with render prop:**
```tsx
// ❌ This renders with role="button", not role="link"
<Button render={<Link to="/tasks/new" />}>New Task</Button>
```

**Solution:** Use `buttonVariants` directly on Link for navigation:
```tsx
import { buttonVariants } from "~/components/ui/button";

// ✅ Renders as a proper link with button styling
<Link to="/tasks/new" className={buttonVariants()}>New Task</Link>

// ✅ With size/variant options
<Link to="/tasks" className={buttonVariants({ size: "lg" })}>
  Get Started
</Link>

<Link to="/settings" className={buttonVariants({ variant: "outline" })}>
  Settings
</Link>
```

**When to use which pattern:**
- **Navigation (changes URL):** Use `Link` with `buttonVariants()` - preserves `role="link"`
- **Actions (onClick handlers):** Use `Button` component - correctly uses `role="button"`
- **DropdownMenuItem links:** Use `render` prop - menu item semantics are appropriate

### Trigger Components (Dialog, Sheet, DropdownMenu)

**Radix:**
```tsx
<DialogTrigger asChild>
  <Button>Open</Button>
</DialogTrigger>
```

**Base UI:**
```tsx
<DialogTrigger render={<Button />}>
  Open
</DialogTrigger>
```

### DropdownMenuItem with Links

**Radix:**
```tsx
<DropdownMenuItem asChild>
  <Link to="/profile">Profile</Link>
</DropdownMenuItem>
```

**Base UI:**
```tsx
<DropdownMenuItem render={<Link to="/profile" />}>
  Profile
</DropdownMenuItem>
```

### DropdownMenuLabel Must Be In Group

In Base UI, `DropdownMenuLabel` (MenuGroupLabel) **must** be inside a `DropdownMenuGroup`. This is different from Radix where labels could be standalone.

**Radix (label can be standalone):**
```tsx
<DropdownMenuContent>
  <DropdownMenuLabel>My Account</DropdownMenuLabel>
  <DropdownMenuSeparator />
  <DropdownMenuItem>Profile</DropdownMenuItem>
</DropdownMenuContent>
```

**Base UI (label must be in group):**
```tsx
<DropdownMenuContent>
  <DropdownMenuGroup>
    <DropdownMenuLabel>My Account</DropdownMenuLabel>
  </DropdownMenuGroup>
  <DropdownMenuSeparator />
  <DropdownMenuGroup>
    <DropdownMenuItem>Profile</DropdownMenuItem>
  </DropdownMenuGroup>
</DropdownMenuContent>
```

If you see this error:
```
Error: Base UI: MenuGroupRootContext is missing. Menu group parts must be used within <Menu.Group>.
```

Wrap your `DropdownMenuLabel` in a `DropdownMenuGroup`.

### External Links

For external `<a>` tags, you can either use render prop or wrap the button:

```tsx
// Option 1: Wrap button in anchor (simpler)
<a href="https://example.com" target="_blank" rel="noopener noreferrer">
  <Button variant="outline">Visit Site</Button>
</a>

// Option 2: render prop
<Button render={<a href="https://example.com" target="_blank" rel="noopener noreferrer" />}>
  Visit Site
</Button>
```

## Select Placeholder

Base UI Select doesn't have a `placeholder` prop on the root. Use `SelectValue` with a render function:

**Radix:**
```tsx
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
</Select>
```

**Base UI:**
```tsx
<Select>
  <SelectTrigger>
    <SelectValue>
      {(value) => value ?? "Select option"}
    </SelectValue>
  </SelectTrigger>
</Select>
```

For forms where you need to display labels instead of values:
```tsx
<SelectValue>
  {(value) => {
    if (value) {
      const option = options.find((opt) => opt.value === value);
      return option?.label ?? value;
    }
    return "Select...";
  }}
</SelectValue>
```

## TypeScript: exactOptionalPropertyTypes

If your project uses `exactOptionalPropertyTypes: true` in tsconfig, Base UI components may have type conflicts when spreading props that can be `undefined`.

### Fix for UI Components

Destructure problematic props and conditionally spread them:

```tsx
// button.tsx
function Button({
  className,
  style,
  disabled,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      className={cn(buttonVariants({ className }))}
      {...(style ? { style } : {})}
      {...(disabled !== undefined ? { disabled } : {})}
      {...props}
    />
  );
}
```

```tsx
// input.tsx
function Input({ className, type, style, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      className={cn("...", className)}
      {...(style ? { style } : {})}
      {...props}
    />
  );
}
```

### Fix for App Code

When creating wrapper components, define explicit prop interfaces instead of spreading:

```tsx
// Instead of this (causes type errors):
function GoogleButton(props: React.ComponentPropsWithoutRef<"button">) {
  return <Button {...props} />;
}

// Do this:
interface GoogleButtonProps {
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

function GoogleButton({
  disabled = false,
  className = "",
  children,
  onClick,
  type = "button",
}: GoogleButtonProps) {
  return (
    <Button
      variant="outline"
      disabled={disabled}
      className={className}
      onClick={onClick}
      type={type}
    >
      {children}
    </Button>
  );
}
```

## Checkbox Accessibility in Tests

Base UI Checkbox renders differently than Radix:
- A hidden `<input type="checkbox">` for form submission
- A visible `<span role="checkbox">` for the UI

This affects test queries:

**Radix (checkbox has accessible name from label):**
```tsx
screen.getByRole("checkbox", { name: "Completed" })
```

**Base UI (use label text query or role without name):**
```tsx
// Find by label
screen.getByLabelText("Completed")

// Or find checkbox role without name filter
screen.getByRole("checkbox")
```

## Linting: Label Without Control

The Label component may trigger `noLabelWithoutControl` lint warnings because `htmlFor` is passed via props spread. Add a biome-ignore comment:

```tsx
function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: htmlFor is passed via props spread
    <label
      data-slot="label"
      className={cn("...", className)}
      {...props}
    />
  );
}
```

## TanStack Form Integration

shadcn/ui's default form component uses React Hook Form. For TanStack Form projects, use the TanStack Form version instead.

### Install TanStack Form Component

```bash
bunx shadcn@canary add https://shadcn-tanstack-form.netlify.app/r/tanstack-form.json
```

This creates `tanstack-form.tsx` with:
- `useAppForm` - Form hook with pre-configured field components
- `useFormContext` - Access form context
- `useFieldContext` - Access field context within FormItem
- `withForm` - HOC for form components
- Field components: `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage`

### Fix Radix Slot Dependency

The component uses `@radix-ui/react-slot`. Replace with `React.cloneElement` for Base UI:

```tsx
// Before (uses Radix Slot):
import { Slot } from "@radix-ui/react-slot";

function FormControl({ ...props }: React.ComponentProps<typeof Slot>) {
  return <Slot {...props} />;
}

// After (Base UI pattern):
function FormControl({
  children,
  ...props
}: React.ComponentProps<"div"> & { children: React.ReactElement }) {
  const { errors, formItemId, formDescriptionId, formMessageId } = useFieldContext();

  return React.cloneElement(children, {
    "data-slot": "form-control",
    id: formItemId,
    "aria-describedby": !errors.length ? formDescriptionId : `${formDescriptionId} ${formMessageId}`,
    "aria-invalid": !!errors.length,
    ...props,
  } as React.HTMLAttributes<HTMLElement> & Record<string, any>);
}
```

### Remove React Hook Form

If migrating from React Hook Form to TanStack Form:

1. Delete `src/components/ui/form.tsx` (React Hook Form version)
2. Remove dependencies from `package.json`:
   ```json
   // Remove from dependencies:
   "@hookform/resolvers": "..."

   // Remove from devDependencies:
   "react-hook-form": "..."
   ```
3. Run `bun install` to update lockfile

### Usage Example

```tsx
import { useAppForm } from "~/components/ui/tanstack-form";

function MyForm() {
  const form = useAppForm({
    defaultValues: { email: "", password: "" },
    onSubmit: async ({ value }) => {
      console.log(value);
    },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      <form.Field name="email">
        {(field) => (
          <form.FieldComponent.FormItem>
            <form.FieldComponent.FormLabel>Email</form.FieldComponent.FormLabel>
            <form.FieldComponent.FormControl>
              <Input
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </form.FieldComponent.FormControl>
            <form.FieldComponent.FormMessage />
          </form.FieldComponent.FormItem>
        )}
      </form.Field>
      <Button type="submit">Submit</Button>
    </form>
  );
}
```

## Components Checklist

When migrating, search your codebase for these patterns:

- [ ] `asChild` prop usage - convert to `render` prop
- [ ] `<SelectValue placeholder=` - convert to render function
- [ ] Test files using `getByRole("checkbox", { name: "..." })` - update queries
- [ ] Wrapper components spreading button props - use explicit interfaces
- [ ] React Hook Form imports - migrate to TanStack Form
- [ ] `@radix-ui/react-slot` imports - replace with `React.cloneElement`

## Files Typically Affected

- Route files with `<Button>` + `<Link>` combinations
- Navigation components (Navbar, Sidebar)
- Dialog/Sheet trigger buttons
- Dropdown menus with navigation items
- Form components using Select
- Test files for form components
- Form components using React Hook Form
