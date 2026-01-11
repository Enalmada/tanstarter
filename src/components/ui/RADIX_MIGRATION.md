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

## Components Checklist

When migrating, search your codebase for these patterns:

- [ ] `asChild` prop usage - convert to `render` prop
- [ ] `<SelectValue placeholder=` - convert to render function
- [ ] Test files using `getByRole("checkbox", { name: "..." })` - update queries
- [ ] Wrapper components spreading button props - use explicit interfaces

## Files Typically Affected

- Route files with `<Button>` + `<Link>` combinations
- Navigation components (Navbar, Sidebar)
- Dialog/Sheet trigger buttons
- Dropdown menus with navigation items
- Form components using Select
- Test files for form components
