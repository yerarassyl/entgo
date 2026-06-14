# Production deployment

## Required services

- Two stateless application replicas built from `Dockerfile`.
- Managed PostgreSQL 16+ with daily backups and point-in-time recovery.
- Managed Redis 7+ with authentication and private networking.
- TLS termination and CDN/WAF in front of the application.
- Transactional email provider compatible with the Resend API.
- SMS provider compatible with the configured HTTP adapter.
- Google OAuth application with the production callback URL.
- Alibaba Cloud Model Studio access for Qwen contextual tutoring.
- Payment checkout provider configured through the generic checkout and webhook contract.

## Required environment

Copy `.env.example` into the deployment secret manager. Replace every placeholder.
`AUTH_SECRET` must contain at least 32 random bytes. `NEXT_PUBLIC_APP_URL` must use
the final `https://` origin. Never expose database, Redis, email, payment, or AI
credentials through `NEXT_PUBLIC_*`.

For Qwen, create an API key in the same Model Studio region as the selected
endpoint. The default configuration uses the international Singapore endpoint
and `qwen-plus`. Store the key as `DASHSCOPE_API_KEY`; change `QWEN_BASE_URL`
only when deploying into another Alibaba Cloud region.

## Release procedure

1. Build and scan the container image.
2. Run `npm run db:deploy` as a one-off release job.
3. Deploy the new image with a rolling update.
4. Require successful responses from `/api/health` and `/api/ready`.
5. Run the browser smoke tests against the final origin.
6. Verify Google, email and SMS authentication, exam completion, AI tutoring,
   password recovery, university forecasts and payment webhook.

## Capacity baseline

For the initial 1,000 registered users use two application replicas with at
least 1 vCPU and 1 GB RAM each. Configure the PostgreSQL pool to stay below the
managed database connection limit. Static assets should be cached by the CDN.
Scale application replicas on request latency and CPU, not registered-user count.

## Backups and incident response

- Keep 14 daily PostgreSQL backups and enable point-in-time recovery.
- Test restoration quarterly.
- Retain structured application logs for 30 days without raw passwords, tokens,
  full IP addresses, or payment data.
- Rotate compromised secrets immediately and invalidate all sessions when
  `AUTH_SECRET` or the database is exposed.
- Promote the first administrator with
  `npm run admin:promote -- admin@example.com`.
