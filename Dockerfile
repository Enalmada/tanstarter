# Keep in sync with packageManager in package.json
FROM oven/bun:1.4.2 AS base
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
ENV NODE_ENV=production
# .output is self-contained: Nitro bundles every server dependency into
# .output/server (there is no .output/server/node_modules) and copies public/
# into .output/public, so the runner needs no node_modules, package.json or
# public/ of its own.
COPY --from=builder /app/.output ./.output

# Set the user for security
USER bun
# Explicitly specify TCP port
EXPOSE 3000/tcp
ENV PORT=3000

# Run the built server
CMD ["bun", "run", ".output/server/index.mjs"]
