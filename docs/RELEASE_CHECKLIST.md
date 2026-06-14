# Release checklist

- [ ] Production secrets are stored outside the repository.
- [ ] PostgreSQL backups and restore test are configured.
- [ ] Redis requires authentication and is not publicly reachable.
- [ ] TLS, CDN and WAF are enabled.
- [ ] Email sender domain is verified.
- [ ] Google OAuth production callback and consent screen are verified.
- [ ] SMS sender, delivery receipts and Kazakhstan phone formatting are verified.
- [ ] AI provider budget, rate limits and failure fallback are verified.
- [ ] Payment checkout and signed webhook are verified.
- [ ] University grant thresholds have an owner and review date.
- [ ] 130+ reward rules, stock limits and proof-review process are published.
- [ ] Legal entity, support contacts and final refund wording are published.
- [ ] Question content has documented usage rights and editorial approval.
- [ ] `npm run check` passes.
- [ ] `npm audit --omit=dev` reports no high-severity vulnerabilities.
- [ ] Playwright smoke tests pass against the release image.
- [ ] Load test meets the agreed p95 latency and error-rate targets.
- [ ] Monitoring alerts cover readiness, 5xx rate, latency, database and Redis.
