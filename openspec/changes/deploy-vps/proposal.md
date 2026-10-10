# Proposal

> Roadmap change 6 of 6. Short proposal only; specs, design and tasks are written when this change starts. Can start any time after `foundation`; scheduled last.

## Why

The app should run on the owner's own VPS rather than a managed host. Packaging it as one container keeps the server setup simple and leaves room for a future online-battling server behind the same reverse proxy.

## What Changes

- **Multi-stage Dockerfile**: build with Node, serve the static `dist/` with Caddy.
- **Caddy config**: automatic HTTPS, SPA fallback to `index.html` for deep links, long-lived caching for hashed assets, short caching for `index.html`.
- A `docker-compose.yml` for the VPS and a short deployment runbook (first deploy, update, rollback to the previous image tag).
- Optional: a GitHub Actions job that builds and publishes the image on tagged releases.
- Optional: self-hosting sprites if hotlinking from GitHub turns out unreliable.

## Capabilities

### New Capabilities
<!-- Probably none: this is packaging/infrastructure, not app behavior. If deep-link fallback and caching headers are not worth specifying, set `skip_specs: true` in .openspec.yaml when this change starts. Candidate if specified: `static-hosting`. -->

### Modified Capabilities
<!-- None expected. -->

## Impact

- New `Dockerfile`, `Caddyfile`, `docker-compose.yml`, `docs/deploy.md`.
- Requires a VPS with Docker and a domain pointed at it.
- Out of scope: any backend/API server, accounts, online battling.
