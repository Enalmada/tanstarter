# [TanStarter](https://github.com/enalmada/tanstarter)

A production starter template for TanStack Start.

## Core Technologies

### Frontend

- TanStack
  - [Start](https://tanstack.com/start/latest)
  - [Router](https://tanstack.com/router/latest)
  - [Query](https://tanstack.com/query/latest) -[@lukemorales/query-key-factory](https://github.com/lukemorales/query-key-factory)
  - [Form](https://tanstack.com/form/latest)
  - [Table](https://tanstack.com/table/latest)
- [shadcn/ui](https://ui.shadcn.com/) UI components with modals and notifications
- [Tailwind CSS](https://tailwindcss.com/) styling
- [Lingui](https://lingui.dev/) localization
- [start-secure](https://github.com/enalmada/start-secure) Content Security Policy (CSP) middleware
- [Service Worker](https://developer.chrome.com/docs/workbox/service-worker-overview/) with [Serwist](https://serwist.pages.dev/)

### Backend & Data

- [Drizzle ORM](https://orm.drizzle.team/) + PostgreSQL (via [Neon](https://neon.tech/))
- [Drizzle-valibot](https://github.com/drizzle-team/drizzle-orm/tree/main/drizzle-valibot) schema validation
- [Better Auth](https://github.com/enalmada/better-auth) authentication
- [Casl](https://casl.js.org/) authorization
- [React-Email](https://react.email/) email templates
- [Axiom](https://axiom.co/) logging integration

### Testing & Quality

- [Vitest](https://vitest.dev/) unit testing
- [Playwright](https://playwright.dev/) E2E testing
- [Storybook](https://storybook.js.org/) component development and testing
- [Rollbar](https://rollbar.com/) error tracking and release monitoring

### Tools

- [Docker](https://docker.com/) containerization
- [Biome](https://biomejs.dev/) fast linting and formatting
- [Fixpack](https://fixpack.dev/) package.json normalization
- [Turborepo](https://turbo.build/repo) monorepo management
- [LeftHook](https://lefthook.dev/) precommit checks
- [envin](https://github.com/enalmada/envin) type-safe environment variable validation

## Getting Started

1. [Use this template](https://github.com/new?template_name=tanstarter&template_owner=enalmada) or clone this repository.

2. Install dependencies:

   ```bash
   bun install
   ```

3. Create a `.env` file based on [`.env.example`](./.env.example).

4. Run the development server:

   ```bash
   bun dev
   ```

   The development server should be now running at [http://localhost:3000](http://localhost:3000).

## Building for production

1. Configure [`vite.config.ts`](./vite.config.ts) for your preferred deployment target. Read the [hosting](https://tanstack.com/router/latest/docs/framework/react/start/hosting#deployment) docs for more information.

2. Build the application:

   ```bash
   bun run build
   ```

3. If building for Node, you start the application via:

   ```bash
   bun start
   ```

## Production Readiness Checklist

The following items are still needed for full production readiness:

- [ ] Nonce implementation ([waiting on TanStack Start support](https://github.com/TanStack/router/discussions/3028))
- [ ] SEO configuration
- [ ] Bundle Analyzer (couldn't get it to work)

## Future Considerations

- [ ] event pipelines - Rudderstack
- [ ] AI - Vercel AI SDK
- [ ] [posthog proxy](https://posthog.com/docs/libraries/posthog-js#proxy-mode)

## Contributing

Please note that this is an opinionated test project used for minimum reproduction
of issues and integration testing for a production site using the core technologies.
Not all requests and PRs will be accepted.

## See Also

- https://github.com/dotnize/tanstarter - Thanks so much for this great starter!
- [nekochan0122/tanstack-boilerplate](https://github.com/nekochan0122/tanstack-boilerplate) - A batteries-included TanStack Start boilerplate that inspired some patterns in this template
- [AlexGaudon/tanstarter-better-auth](https://github.com/AlexGaudon/tanstarter-better-auth) - Better-auth implementation reference
