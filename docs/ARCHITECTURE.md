# entgo.kz architecture

## Product boundaries

- `Marketing`: landing, pricing, FAQ and acquisition experiments.
- `Assessment`: onboarding, full tests, topic tests and adaptive tests.
- `Learning`: theory, explanations, study plans and daily tasks.
- `Identity`: email, phone and Google sign-in, sessions and account recovery.
- `Billing`: subscriptions, school licenses, payments and refunds.
- `Engagement`: streaks, achievements, reminders, groups and leaderboards.
- `Content`: question bank, moderation, localization and source tracking.

## Runtime

- Next.js App Router for the web application and server-side endpoints.
- PostgreSQL as the source of truth.
- Redis for rate limits, distributed locks, ephemeral exam state and queues.
- Object storage for question media and exports.
- Background workers for plan generation, notifications and analytics fan-out.

## Security baseline

- Passwords use Argon2id or bcrypt with a calibrated work factor.
- Session tokens are random, rotated, hashed at rest and stored in secure cookies.
- Every state-changing request is protected against CSRF and validated with Zod.
- Rate limits are enforced by IP hash and account ID at the edge and server.
- Role checks are deny-by-default and repeated inside data access functions.
- Question authoring and administrative actions are written to `AuditLog`.
- Secrets never use `NEXT_PUBLIC_` and are injected by the deployment platform.
- Production uses TLS, managed PostgreSQL backups, Redis authentication and private networking.
- Uploaded content is size/type checked and scanned before publication.
- Personal data is minimized; raw IP addresses are not persisted.

## Initial capacity target

The first production shape supports 1,000 registered users and exam bursts through:

- stateless application replicas;
- pooled PostgreSQL connections;
- indexed attempt and question queries;
- Redis-backed throttling and temporary state;
- asynchronous AI work outside request/response paths;
- CDN caching for public pages and static assets.

## Local development

The repository uses PGlite Socket and a Redis-compatible local process so the
full stack can run on Windows without administrator privileges or Docker.
These are development tools only; production remains on managed PostgreSQL and
Redis services.
