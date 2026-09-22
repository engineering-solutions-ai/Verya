# Verya

**The control plane for our enterprise AI solutions.**

Verya is not an AI product. It is the layer that makes a *portfolio* of AI products sellable to an enterprise: one identity, one tenancy model, one set of entitlements, one bill, one audit trail — shared by every service we build.

---

## Status

| | |
|---|---|
| Stage | **Design** — architecture defined, platform implementation not started |
| Website | Landing page for the Knowledge Engine pilot in [`apps/web`](apps/web/) |
| First service | [`team-ai-knowledge-engine`](https://github.com/engineering-solutions-ai/team-ai-knowledge-engine) |
| Target | External enterprise pilots |

---

## The Shape of It

```
Customer IdP  →  Verya Control Plane  →  Verya Services
(Okta, Entra)    identity, orgs,          knowledge-engine,
                 entitlements,            and everything after it
                 metering, billing,
                 audit
```

Verya stores identity, entitlements, usage *counts*, and audit metadata. It never stores customer content. A control-plane breach must not be a content breach.

---

## Platform Decisions

| Decision | Choice |
|---|---|
| Scope | Full platform — identity, tenancy, catalog, entitlements, metering, billing, audit, console |
| Repo topology | Polyrepo — one repo per service; the `verya-sdk` package is the single shared dependency |
| Tenancy | Pooled multi-tenant (`org_id` + Postgres RLS) with a dedicated-deployment tier from the same image |
| Audience | External enterprise pilots |
| Stack | Python 3.12 + FastAPI · Next.js 15 · Neon PostgreSQL 16 · Upstash Redis · Fly.io · Stripe · WorkOS |

Architecture decision records will live in `docs/adr/`.

---

## Website

The public landing page lives in [`apps/web`](apps/web/). It builds with no dependencies and deploys to GitHub Pages on every push to `main`.

```bash
node tools/build-site.mjs      # writes dist/index.html
node tools/screenshots.mjs     # refreshes docs/screenshots/
```

See [`apps/web/README.md`](apps/web/README.md) for the pilot form setup and what to know before sharing it.

---

## Documentation

| Document | Covers |
|---|---|
| [Overview](docs/platform/overview.md) | What Verya is, design principles, trust boundaries, v1 scope |
| [Architecture](docs/platform/architecture.md) | Components, stack, request path, deployment topologies, degradation |
| [Tenancy](docs/platform/tenancy.md) | `org_id`, row-level security, dedicated tier, tenant lifecycle, testing |
| Identity | _(next)_ Token format, JWKS, SSO federation, scopes, service accounts |
| Billing | _(next)_ Plans, meters, Stripe integration, quota enforcement |
| Service Contract | _(next)_ What a service must implement to join the platform |

---

## The One Rule

> **No row exists without an `org_id`, and no query crosses an `org_id` boundary.**

Enforced by Postgres row-level security, not by convention. See [Tenancy](docs/platform/tenancy.md).
