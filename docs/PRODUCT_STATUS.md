# Product status

## Implemented

- Forecast-led marketing landing with clickable university marquee and grant pages.
- Registration before the first test, desired university selection and three-day trial.
- Email/password, verified Google OAuth, email verification and SMS phone verification.
- Test catalog and server-backed attempts with answers revealed only after completion.
- Contextual AI tutor available from application pages and selection-based lesson help.
- Exam-safe AI hints that never expose the answer and reduce the awarded XP.
- Explanation for every submitted answer, error memory and repeated-error review.
- Simple-language lessons for every topic with persisted completion and XP.
- Evidence-based topic mastery using difficulty, speed, errors, confidence and forgetting.
- Dynamic 70/20/10 study plan that reprioritizes future tasks after each completed test.
- Live ENT forecast with expected score, range, target probability and admission chance.
- XP transactions for tests, lessons, practice, reviews and AI-help penalties.
- Global, city and school leaderboard based on XP.
- Free, Premium (4,990 KZT/month) and Until ENT (19,990 KZT once) product model.
- Verified 130+ reward claim workflow with manual review status.
- Role-based administration, question moderation, audit log and rate limits.
- PostgreSQL schema, Redis rate limiting, security headers, health and readiness probes.
- Docker image, production migration, CI, unit tests, Playwright and load smoke tooling.

## External launch inputs

The repository cannot manufacture or legally license these business assets:

- A reviewed question bank at the target production volume. The included set is
  demonstration content; the importer and data model support the full bank.
- Final Kazakh translations reviewed by a native-language editor.
- Production domain, TLS/CDN/WAF and managed PostgreSQL/Redis credentials.
- Verified Google OAuth application and production callback URL.
- Verified transactional email sender and Resend API key.
- Kazakhstan SMS provider endpoint, API key and approved sender name.
- Payment-provider contract, checkout URL and signed webhook secret.
- Anthropic API key and approved production prompt/usage limits.
- Counsel-approved offer, privacy, refunds and 130+ campaign rules.
- Official university grant thresholds maintained by an editorial owner.

These are required deployment, editorial and legal inputs. Public launch remains
blocked until the release checklist is completed.
