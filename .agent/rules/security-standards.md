# Security & Compliance Standards (PCI DSS Focus)

This document defines the mandatory security protocols to protect data, endpoints, and prevent malicious attacks. Compliance with these rules is a **HARD REQUIREMENT** for passing PCI DSS audits and ensuring production readiness.

## 1. Data Protection (PCI DSS Reqs 3 & 4)
- **Encryption in Transit**: ALL traffic must be over HTTPS (TLS 1.2 or higher). No exceptions.
- **Encryption at Rest**: Sensitive data (PII, tokens) must be encrypted at the database level using AES-256 or better.
- **Password Hashing**: Use `bcrypt` with a minimum cost factor of 12 or `Argon2id`. NEVER store plain-text passwords.
- **Payment Data**: 
  - ❌ **NEVER** store PAN (Primary Account Number), CVV/CVC, or track data in the database.
  - ✅ **ALWAYS** use PCI-compliant payment gateways (Stripe, PayPal) for tokenized payment processing.
- **Data Redaction**: Logs must automatically redact sensitive information (passwords, tokens, credit card fragments).

## 2. Endpoint & API Security (PCI DSS Req 6)
- **Input Validation**: EVERY API request must be validated using **Zod** or equivalent schema validation. Reject any malformed input immediately (HTTP 400).
- **Anti-Injection**: Use parameterized queries (Mongoose handles this by default). NEVER use `eval()` or unsanitized string concatenation in queries.
- **Rate Limiting**: Implement rate limiting on all public endpoints, especially `/api/auth/**` and `/api/bookings/**` to prevent brute-force and DDoS.
  - Limit: 100 requests per 15 minutes per IP (Adjust based on endpoint sensitivity).
- **CORS Policy**: Strictly define allowed origins. Reject requests from unauthorized domains.
- **Secure Headers**: Implement security headers (CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy).

## 3. Access Control (PCI DSS Reqs 7 & 8)
- **Authentication**: Use NextAuth.js for secure session management.
- **Session Security**: 
  - Cookies must be `HttpOnly`, `Secure`, and `SameSite: Strict`.
  - Session timeout must be enforced (e.g., 30 minutes of inactivity).
- **Least Privilege**: Users and API keys must have the minimum permissions necessary (RBAC).
- **MFA**: Multi-Factor Authentication is REQUIRED for all administrative accounts (`/admin`).

## 4. DDoS & Malicious Traffic Protection
- **Bot Detection**: Use CAPTCHA or invisible bot detection (Cloudflare Turnstile) on public forms.
- **Payload Limits**: Limit request body size (e.g., 1mb for JSON) to prevent memory exhaustion/DDoS.
- **Input Sanitization**: Sanitize all user-generated content to prevent XSS (Cross-Site Scripting).

## 5. Monitoring & Audit (PCI DSS Req 10)
- **Audit Logs**: Record all administrative actions (login, data changes, status updates).
- **Audit Fields**: Every log entry must include: Timestamp, UserID, Action, Source IP, and Result (Success/Fail).
- **Integrity**: Audit logs must be protected from modification or unauthorized access.

## 6. Implementation Checklist (Mandatory for every Feature)
- [ ] Zod schema applied to request body/params?
- [ ] Rate limit applied to endpoint?
- [ ] Auth guard implemented (`middleware.ts` or `getServerSession`)?
- [ ] Data encrypted at rest/redacted in logs?
- [ ] CSRF/Security headers verified?
