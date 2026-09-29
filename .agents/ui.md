# UI

shadcn/ui on Base UI (`components.json` style `base-vega`), Tailwind CSS v4 with tokens in `src/styles/app.css`.

## Components

- Components are in `src/components/ui/`. They are local files: some are shadcn output, some are ours. Add a new one with `bun run ui add <name>` (the CLI version is pinned in `package.json`).
- Re-pulling an existing component overwrites local patches and its consumers rely on the current markup, so read [RADIX_MIGRATION.md](../src/components/ui/RADIX_MIGRATION.md) ("Re-pulling components later") first. Never re-pull `container`, `title`, `tanstack-form` or `toast`, and reject the CLI's dependency and CSS proposals.
- Use `render={<Link .../>}` for composition, not `asChild`. For a navigation link that looks like a button, use `buttonVariants()` on the `Link` so it keeps `role="link"`.
- Every component needs a Storybook story (`bun run check-stories`).

## Tokens and color

- Error text and destructive labels use `text-destructive-strong`. `--destructive` is for borders, rings and `/10`-`/15` tints; it is too light to carry text. `src/styles/__tests__/theme-contrast.test.ts` reads the real token values and fails on low contrast, on `text-destructive` or `text-red-400/500` in components, and on a half-opacity invalid border.
- Invalid form controls use the solid `aria-invalid:border-destructive` in both themes.
- There is no destructive foreground token. Use the tinted destructive variants, not a solid red fill with white text.

## Theme

`ThemeProvider` (`src/components/theme-provider.tsx`) supports light, dark and system, stored under the `theme` key. The initial class is applied by an inline script emitted through `ScriptOnce` (so it carries the CSP nonce) before hydration, to avoid a flash. Use the semantic tokens (`bg-background`, `text-foreground`, ...) so both themes work; check new UI in light and dark.

## Icons, toasts, layout

- Icons: `lucide-react`.
- Toasts: `toast` helpers from `src/components/ui/toast.tsx` (Base UI Toast), normally through the mutation helpers.
- Card is a flex column with a gap, `--card-spacing` and a ring. A card that wraps a table or an iframe should pass `gap-0 py-0`; a row layout inside `CardContent` needs `flex-row`.
