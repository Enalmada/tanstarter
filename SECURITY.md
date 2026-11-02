# Security policy

## Reporting a vulnerability

Please report vulnerabilities privately through GitHub: open the repository's **Security** tab and choose **Report a vulnerability**. Do not open a public issue or pull request for a security problem. If you do not see **Report a vulnerability**, open an issue asking for a private contact and leave the details out.

Include what you found, how to reproduce it, and the version or commit. You can expect an acknowledgement within a few business days. This is a starter template maintained on a best-effort basis, so there is no fixed fix timeline, but confirmed issues are fixed on `main` and noted in the commit message.

## Scope

In scope: code in this repository (server functions, auth setup, CSP and header middleware, the Dockerfile and the CI workflows).

Out of scope: vulnerabilities in third-party dependencies with no exploit path through this code (report those upstream), and issues in a deployment you have customised.

## What this repository does to stay safe

See [Security](.agents/security.md) for the controls (CSP, CSRF, server-function auth, environment allowlist) and the CI checks (secret scan, static analysis, dependency audit).
