# Keep the version in sync with packageManager in package.json (by hand: Dependabot
# moves this tag and digest, not packageManager). The digest pins the exact image.
FROM oven/bun:1.4.2@sha256:9114c058aeae42162ee16dd5084b95fe9473970bb6bcb5b232ab1630f0546895 AS base
WORKDIR /app

# Install dependencies into a separate stage for better layer caching
FROM base AS install
# bunfig.toml pins the hoisted linker (Bun 1.4 defaults fresh installs to isolated)
COPY package.json bun.lock bunfig.toml ./
# Install all dependencies (the build needs devDependencies) with scripts disabled
RUN bun install --frozen-lockfile --ignore-scripts

# Build stage
FROM base AS builder
COPY --from=install /app/node_modules node_modules
# Copy source files
COPY . .
# Set production environment for build
ENV NODE_ENV=production
# Build the app (includes sw.js; see scripts/vite-service-worker.ts)
RUN bun run build

# Final production image
FROM base AS runner
# Pull in Debian security fixes published after the pinned base image was built
# (container-scan.yml fails on a fixable CRITICAL). This trades bit-for-bit
# reproducible builds for those fixes; the digest still fixes the base. Drop it
# once a base-image bump from Dependabot carries them.
RUN apt-get update \
	&& apt-get upgrade --yes --no-install-recommends \
	&& rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
# .output is self-contained: Nitro bundles every server dependency into
# .output/server (there is no .output/server/node_modules) and copies public/
# into .output/public, so the runner needs no node_modules, package.json or
# public/ of its own. It also holds the migration runner (.output/migrate, written
# by `build:migrate` with the SQL migrations next to it), which fly.toml's
# release_command runs.
COPY --from=builder /app/.output ./.output

# Set the user for security
USER bun
# Explicitly specify TCP port
EXPOSE 3000/tcp
ENV PORT=3000

# Run the built server
CMD ["bun", "run", ".output/server/index.mjs"]
