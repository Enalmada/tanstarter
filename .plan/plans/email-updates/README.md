# Email System Architecture

**PR**: https://github.com/Enalmada/tanstarter/pull/36

This document explains the design decisions behind the email template system in TanStarter. It serves as both documentation and an educational guide for building production-ready email templates with React Email.

## Why React Email?

React Email lets you build email templates using React components instead of raw HTML tables. This provides:

- **Type safety** - TypeScript catches errors at build time
- **Component reuse** - Share layouts, buttons, and styles across templates
- **Developer experience** - Use familiar React patterns and tooling
- **Preview in Storybook** - Visual testing without sending real emails

## The Problem with Naive Email Templates

A simple email template often has these issues:

```tsx
// ❌ Problems with this approach
const WelcomeEmail = ({ username = "there" }) => (
  <Html>
    <Body style={{ backgroundColor: "#f8f9fa" }}>
      <Button href="https://app.example.com/start">Get Started</Button>
      <Text style={{ color: "#228be6" }}>Contact support@example.com</Text>
    </Body>
  </Html>
);
```

**Issues:**
1. **Hardcoded URLs** - `example.com` might ship to production
2. **Magic colors** - `#228be6` repeated without semantic meaning
3. **No shared layout** - Every email repeats Html/Head/Body boilerplate
4. **Inline styles** - Verbose, hard to maintain, no design system
5. **Optional props with defaults** - Easy to forget required values

## Architecture Decisions

### 1. Required Props for URLs (No Defaults)

```tsx
// ✅ Forces callers to provide real values
interface WelcomeEmailProps {
  gettingStartedUrl: string;  // Required - no example.com default
  supportEmail: string;       // Required - no placeholder
  username?: string;          // Optional - has graceful fallback
}
```

**Why?** Default URLs like `example.com` can accidentally ship to production. By making URLs required, TypeScript ensures every call site provides real values. Optional props like `username` have UI fallbacks ("Welcome!" vs "Welcome Jordan!").

### 2. Tailwind CSS with pixelBasedPreset

```tsx
import { Tailwind } from "@react-email/components";
import { pixelBasedPreset } from "@react-email/tailwind";

const config = {
  presets: [pixelBasedPreset],  // Converts rem → px for email clients
  theme: {
    extend: {
      colors: {
        brand: "#228be6",
        gray: { 50: "#f8fafc", /* ... */ 900: "#0f172a" }
      }
    }
  }
};
```

**Why Tailwind?**
- Consistent with the main app's styling approach
- Familiar syntax for developers
- No verbose inline style objects
- Centralized color palette in config

**Why pixelBasedPreset?**
Email clients have poor CSS support. Tailwind uses `rem` units for accessibility, but many email clients don't support them. The preset converts to pixel values for compatibility.

**Limitations:**
- No `prose` or `space-*` utilities (complex selectors don't inline)
- No React Context inside `<Tailwind>` wrapper
- `hover:` states have limited support

### 3. Shared EmailLayout Component

```tsx
// src/emails/components/EmailLayout.tsx
export const EmailLayout: FC<PropsWithChildren<{ preview: string }>> = ({
  preview,
  children,
}) => (
  <Html lang="en">
    <Head />
    <Preview>{preview}</Preview>
    <Tailwind config={tailwindConfig}>
      <Body className="bg-gray-50 font-sans">
        <Container>
          <Section className="bg-gray-900">{/* Header */}</Section>
          <Section>{children}</Section>
          <Section>{/* Footer with disclaimer */}</Section>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);
```

**Why?**
- Eliminates boilerplate in every template
- Consistent header/footer across all emails
- Single place to update brand styling
- `lang="en"` for accessibility

### 4. Preview Data Pattern

```tsx
// src/emails/preview-data.ts
export const welcomeEmailPreview: WelcomeEmailProps = {
  username: "Jordan",
  gettingStartedUrl: "https://app.example.dev/getting-started",
  supportEmail: "support@example.dev",
};

// src/emails/WelcomeEmail.stories.tsx
export const Default: Story = {
  args: welcomeEmailPreview,
};
```

**Why?**
- Typed preview props catch interface mismatches
- Centralized test data for Storybook
- Easy to add new story variants
- Keeps stories clean and focused

## File Structure

```
src/emails/
├── components/
│   └── EmailLayout.tsx       # Shared wrapper with header/footer
├── WelcomeEmail.tsx          # Template using EmailLayout
├── WelcomeEmail.stories.tsx  # Storybook preview
├── preview-data.ts           # Typed preview props
└── index.ts                  # Barrel exports
```

**Why flat structure?**
For a single application, deep nesting adds complexity without benefit. A `components/` subfolder separates reusable pieces from templates, but templates stay at the root level for easy discovery.

## Adding New Email Templates

1. Create the template using `EmailLayout`:

```tsx
// src/emails/PasswordResetEmail.tsx
export interface PasswordResetEmailProps {
  resetUrl: string;      // Required
  expiresIn: string;     // Required
  username?: string;     // Optional
}

export const PasswordResetEmail: FC<PasswordResetEmailProps> = ({
  resetUrl,
  expiresIn,
  username,
}) => (
  <EmailLayout preview="Reset your password">
    <Heading>{username ? `Hi ${username}` : "Hi"},</Heading>
    <Text>Click the button below to reset your password.</Text>
    <Button href={resetUrl}>Reset Password</Button>
    <Text>This link expires in {expiresIn}.</Text>
    <Text>If the button doesn't work: {resetUrl}</Text>
  </EmailLayout>
);
```

2. Add preview data and story:

```tsx
// preview-data.ts
export const passwordResetPreview: PasswordResetEmailProps = {
  resetUrl: "https://app.example.dev/reset?token=abc123",
  expiresIn: "1 hour",
  username: "Jordan",
};
```

3. Export from barrel:

```tsx
// index.ts
export { PasswordResetEmail, type PasswordResetEmailProps } from "./PasswordResetEmail";
```

## Best Practices

1. **Always include fallback URL text** - Some email clients block buttons
2. **Use `<Text>` for lists** - Native `<ul>/<li>` can render inconsistently
3. **Test across clients** - Gmail, Outlook, Apple Mail all render differently
4. **Keep templates simple** - Complex layouts often break in email clients
5. **Include unsubscribe/contact info** - Legal requirement in many jurisdictions
