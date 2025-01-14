# [TanStarter](https://github.com/enalmada/tanstarter)

A production starter template for TanStack Start.

## Core Technologies

### Frontend

- TanStack 
   - [Start](https://tanstack.com/start/latest) 
   - [Router](https://tanstack.com/router/latest) 
   - [Query](https://tanstack.com/query/latest) 
     -[@lukemorales/query-key-factory](https://github.com/lukemorales/query-key-factory)
   - [Form](https://tanstack.com/form/latest) 
   - [Table](https://tanstack.com/table/latest)
- [Mantine](https://mantine.dev/) UI components
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Lucide Icons](https://lucide.dev/) for icons
- [Lingui](https://lingui.dev/) for internationalization
- [CSP Headers](https://csp.withgoogle.com/)
- [Service Worker](https://developer.chrome.com/docs/workbox/service-worker-overview/) with Serwist

### Backend & Data

- [Drizzle ORM](https://orm.drizzle.team/) + PostgreSQL (via [Neon](https://neon.tech/))
- [Drizzle-valibot](https://github.com/drizzle-team/drizzle-orm/tree/main/drizzle-valibot) for schema validation
- [Lucia Auth](https://lucia-auth.com/)
- [Docker](https://docker.com/) for containerization
- [Casl](https://casl.js.org/) for authorization

### Testing & Quality

- [Vitest](https://vitest.dev/) for testing
- [Playwright](https://playwright.dev/) for E2E testing


### Tools

- [Biome](https://biomejs.dev/) for linting and formatting
- [Fixpack](https://fixpack.dev/) for package.json normalization
- [React-Email](https://react.email/) for email templates
- [Turborepo](https://turbo.build/repo) for monorepo management


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

- [ ] [Sentry](https://sentry.io/) integration for error tracking
- [ ] Nonce implementation (waiting on TanStack Start support)
- [ ] [Axiom](https://axiom.co/) logging integration
- [ ] Optimized image component implementation
- [ ] SEO configuration
- [ ] Bundle Analyzer
- [ ] Github Actions
- [ ] Analytics loading (partytown?)
- [ ] AI - Vercel AI SDK



Please note that this is an opinionated test project used for minumum reproduction 
of issues and integration testing for a production site using the core technologies.
Not all requests and PRs will be accepted.


## Credits
Thanks to dotnize for taking the time to create a starter template for TanStack Starter.  https://github.com/dotnize/tanstarter 