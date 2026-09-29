/**
 * How better-auth finds the client IP (rate limiting, session ip_address).
 *
 * Production runs behind Fly's proxy (fly.toml `[http_service]`), which sets
 * `Fly-Client-IP` to the connecting client's address and overwrites any value a
 * client sent. The machine is only reachable through that proxy, so this
 * single-value header is trustworthy.
 *
 * `X-Forwarded-For` is deliberately not listed: Fly appends to it, so its
 * leftmost entry is client-controlled, and better-auth ignores multi-value
 * headers when no `trustedProxies` are set. `trustedProxies` is not used either:
 * it only applies to forwarded chains, and Fly's proxy addresses are not stable.
 *
 * Dev, unit tests and Playwright send no such header. better-auth then falls back
 * to 127.0.0.1 when NODE_ENV is development or test, and rate limiting is off
 * outside production, so nothing needs the header locally. A production build run
 * outside Fly (e.g. `docker run` locally) has no header, so it gets the shared
 * per-path bucket and warning; a client could also set the header there.
 */
export const authIpAddress = {
	ipAddressHeaders: ["fly-client-ip"],
};
