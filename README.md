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
- [Mantine](https://mantine.dev/) UI components with modals and notifications
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Lingui](https://lingui.dev/) for internationalization
- [CSP Headers](https://csp.withgoogle.com/)
- [Service Worker](https://developer.chrome.com/docs/workbox/service-worker-overview/) with [Serwist](https://serwist.pages.dev/)

### Backend & Data

- [Drizzle ORM](https://orm.drizzle.team/) + PostgreSQL (via [Neon](https://neon.tech/))
- [Drizzle-valibot](https://github.com/drizzle-team/drizzle-orm/tree/main/drizzle-valibot) for schema validation
- [Better Auth](https://github.com/enalmada/better-auth) for authentication
- [Casl](https://casl.js.org/) for authorization
- [React-Email](https://react.email/) for email templates
- [Axiom](https://axiom.co/) logging integration


### Testing & Quality

- [Vitest](https://vitest.dev/) for unit testing
- [Playwright](https://playwright.dev/) for E2E testing
- [Storybook](https://storybook.js.org/) for component development and testing
- [Rollbar](https://rollbar.com/) for error tracking and release monitoring

### Tools

- [Docker](https://docker.com/) for containerization
- [Biome](https://biomejs.dev/) for linting and formatting
- [Fixpack](https://fixpack.dev/) for package.json normalization
- [Turborepo](https://turbo.build/repo) for monorepo management
- [LeftHook](https://lefthook.dev/) for hooks linting
- [Rollbar](https://rollbar.com/) error tracking and release monitoring


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

1. Configure [`app.config.ts`](./app.config.ts#L15) for your preferred deployment target. Read the [hosting](https://tanstack.com/router/latest/docs/framework/react/start/hosting#deployment) docs for more information.

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

- [ ] Nonce implementation (waiting on TanStack Start support)
- [ ] SEO configuration
- [ ] Bundle Analyzer
- [ ] Github Actions
- [ ] Analytics loading (partytown?)
- [ ] AI - Vercel AI SDK

Please note that this is an opinionated test project used for minumum reproduction
of issues and integration testing for a production site using the core technologies.
Not all requests and PRs will be accepted.

## See Also

- https://github.com/dotnize/tanstarter thanks so much for this great starter!
- [nekochan0122/tanstack-boilerplate](https://github.com/nekochan0122/tanstack-boilerplate) - A batteries-included TanStack Start boilerplate that inspired some patterns in this template. If you're looking for a more feature-rich starter, check it out!
- [AlexGaudon/tanstarter-better-auth](https://github.com/AlexGaudon/tanstarter-better-auth) for his own better-auth implementation.
