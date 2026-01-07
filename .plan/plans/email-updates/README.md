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
6. **Hardcoded app name** - Cannot reuse templates across different brands

## Architecture Decisions

### 1. Required Props for URLs and Branding (No Defaults)

```tsx
// ✅ Forces callers to provide real values
interface WelcomeEmailProps {
  appName: string;            // Required - no hardcoded brand
  gettingStartedUrl: string;  // Required - no example.com default
  supportEmail: string;       // Required - no placeholder
  unsubscribeUrl?: string;    // Optional - for email compliance
  username?: string;          // Optional - has graceful UI fallback
}
```

**Why?** Default URLs like `example.com` can accidentally ship to production. By making URLs required, TypeScript ensures every call site provides real values. Optional props like `username` have UI fallbacks ("Welcome!" vs "Welcome Jordan!").

**Why required appName?** A hardcoded brand name limits reusability. Making it required ensures templates work across different applications/brands.

### 1b. Optional Unsubscribe URL for Compliance

```tsx
interface EmailLayoutProps {
  unsubscribeUrl?: string;  // Optional - shown in footer when provided
}

// In footer:
{unsubscribeUrl && (
  <Text>
    <Link href={unsubscribeUrl}>Unsubscribe</Link> from these emails.
  </Text>
)}
```

**Why optional?** Not all emails require unsubscribe links (e.g., transactional emails like password resets). But when needed for marketing emails, CAN-SPAM and GDPR compliance requires it.

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
export interface EmailLayoutProps {
  preview: string;
  appName: string;
  supportEmail: string;
  unsubscribeUrl?: string;
}

export const EmailLayout: FC<PropsWithChildren<EmailLayoutProps>> = ({
  preview,
  appName,
  supportEmail,
  unsubscribeUrl,
  children,
}) => (
  <Html lang="en">
    <Head />
    <Preview>{preview}</Preview>
    <Tailwind config={tailwindConfig}>
      <Body className="bg-gray-50 font-sans">
        <Container>
          <Section className="bg-gray-900">
            <Text>{appName}</Text>
          </Section>
          <Section>{children}</Section>
          <Section>
            <Text>You received this because you have an account with {appName}.</Text>
            {unsubscribeUrl && <Link href={unsubscribeUrl}>Unsubscribe</Link>}
          </Section>
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
- Configurable branding via props

### 4. Preview Data Pattern with Type Safety

```tsx
// src/emails/preview-data.ts
import type { WelcomeEmailProps } from "./WelcomeEmail";

// Use const satisfies Required<T> for preview data
// This ensures all props have concrete values (no string | undefined)
// which avoids exactOptionalPropertyTypes issues in stories
export const welcomeEmailPreview = {
  username: "Jordan",
  appName: "TanStarter",
  gettingStartedUrl: "https://app.tanstarter.dev/getting-started",
  supportEmail: "support@tanstarter.dev",
  unsubscribeUrl: "https://app.tanstarter.dev/settings/notifications",
} as const satisfies Required<WelcomeEmailProps>;

// src/emails/WelcomeEmail.stories.tsx
export const Default: Story = {
  args: welcomeEmailPreview,
};
```

**Why `as const satisfies Required<T>`?**
- Typed preview props catch interface mismatches
- `as const` preserves literal types for better inference
- `Required<T>` ensures all optional props have values in previews
- Avoids TypeScript `exactOptionalPropertyTypes` errors in Storybook
- Centralized test data for easy story variants

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
  appName: string;       // Required
  resetUrl: string;      // Required
  expiresIn: string;     // Required
  supportEmail: string;  // Required
  username?: string;     // Optional
}

export const PasswordResetEmail: FC<PasswordResetEmailProps> = ({
  appName,
  resetUrl,
  expiresIn,
  supportEmail,
  username,
}) => (
  <EmailLayout
    preview="Reset your password"
    appName={appName}
    supportEmail={supportEmail}
  >
    <Heading>{username ? `Hi ${username}` : "Hi"},</Heading>
    <Text>Click the button below to reset your password.</Text>
    <Button href={resetUrl}>Reset Password</Button>
    <Text>This link expires in {expiresIn}.</Text>
    <Text>If the button does not work: {resetUrl}</Text>
  </EmailLayout>
);
```

2. Add preview data:

```tsx
// preview-data.ts
export const passwordResetPreview = {
  appName: "TanStarter",
  resetUrl: "https://app.tanstarter.dev/reset?token=abc123",
  expiresIn: "1 hour",
  supportEmail: "support@tanstarter.dev",
  username: "Jordan",
} as const satisfies Required<PasswordResetEmailProps>;
```

3. Export from barrel:

```tsx
// index.ts
export * from "./PasswordResetEmail";
```

## Best Practices

1. **Always include fallback URL text** - Some email clients block buttons
2. **Use `<Text>` for lists** - Native `<ul>/<li>` can render inconsistently
3. **Test across clients** - Gmail, Outlook, Apple Mail all render differently
4. **Keep templates simple** - Complex layouts often break in email clients
5. **Include unsubscribe/contact info** - Legal requirement in many jurisdictions
6. **Make branding configurable** - Pass `appName` as a prop, do not hardcode
7. **Use JSDoc comments on interface props** - Documents intent for other developers
8. **Use `as const satisfies Required<T>`** - Avoids type issues with optional props in previews
