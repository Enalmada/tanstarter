FROM oven/bun:1.2.5 AS base
WORKDIR /app

# Install dependencies into temp directory for better caching
FROM base AS install
# Create separate directories for dev and prod dependencies
RUN mkdir -p /temp/dev /temp/prod
COPY package.json bun.lock /temp/dev/
# Install dev dependencies with scripts disabled
RUN cd /temp/dev && bun install --ignore-scripts

# Install production dependencies only (no dev dependencies)
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --ignore-scripts --production

# Build stage with dev dependencies
FROM base AS builder
# Copy dev dependencies
COPY --from=install /temp/dev/node_modules node_modules
# Copy source files
COPY . .
# Set production environment for build
ENV NODE_ENV=production
# Build the app
RUN bun run build

# Final production image
FROM base AS runner
ENV NODE_ENV=production
# Copy only production dependencies
COPY --from=install /temp/prod/node_modules node_modules
# Copy built application files
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bun.lock ./bun.lock
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/public ./public

# Set the user for security
USER bun
# Explicitly specify TCP port
EXPOSE 3000/tcp
ENV PORT 3000

# Run the built server
CMD ["bun", "run", ".output/server/index.mjs"] 