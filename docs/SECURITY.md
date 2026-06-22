# Security Checklist — MultiPoster TN

## Authentication & Authorization

- [x] Passwords hashed with bcrypt (12 rounds)
- [x] JWT access tokens (15min expiry)
- [x] JWT refresh tokens with rotation
- [x] Refresh tokens stored in MongoDB with revocation
- [x] Role-based access (user/admin)
- [x] Email verification flow
- [x] Password reset with time-limited tokens
- [x] HttpOnly cookies for tokens

## OAuth Token Security

- [x] OAuth tokens encrypted with AES-256 before storage
- [x] Tokens NEVER stored in plaintext
- [x] Auto-refresh for expiring tokens
- [x] Per-account token isolation

## API Security

- [x] Rate limiting (100 req/15min per IP)
- [x] Request validation with Zod DTOs
- [x] Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- [x] CSRF protection via SameSite cookies
- [x] Subscription middleware for plan-gated features
- [x] Input sanitization on all endpoints

## Data Protection

- [x] Environment variables for all secrets
- [x] .env files excluded from git
- [x] Encryption key separate from JWT secrets
- [x] Activity audit logs with 90-day TTL
- [x] Password fields excluded from queries (`select: false`)

## Infrastructure

- [x] Docker non-root user (nextjs:1001)
- [x] FFmpeg runs in isolated worker process
- [x] Local files deleted after successful publish
- [x] MongoDB connection pooling (5-50 connections)
- [x] Redis for queue isolation

## OWASP Top 10 Mitigations

| Risk | Mitigation |
|------|-----------|
| Injection | Mongoose parameterized queries, Zod validation |
| Broken Auth | JWT + refresh rotation, bcrypt, rate limiting |
| Sensitive Data Exposure | AES encryption, HTTPS, no plaintext tokens |
| XXE | No XML parsing |
| Broken Access Control | Auth middleware, subscription checks, admin role |
| Security Misconfiguration | Security headers, env validation |
| XSS | React auto-escaping, CSP headers |
| Insecure Deserialization | JSON-only API, Zod parsing |
| Known Vulnerabilities | npm audit, dependency updates |
| Insufficient Logging | ActivityLog model, error tracking in admin |

## Production Checklist

- [ ] Change all default secrets in `.env`
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure SMTP for email verification
- [ ] Set `NODE_ENV=production`
- [ ] Configure MongoDB authentication
- [ ] Enable Redis password authentication
- [ ] Set up automated backups
- [ ] Configure log aggregation (e.g., Datadog, Grafana)
- [ ] Penetration testing before launch
- [ ] GDPR/data privacy compliance for EU/Tunisia users

## Secret Rotation

Rotate these secrets periodically:
- `JWT_ACCESS_SECRET` — force re-login
- `JWT_REFRESH_SECRET` — invalidate refresh tokens
- `ENCRYPTION_KEY` — requires re-encryption of OAuth tokens
- OAuth app secrets — update in provider dashboards
