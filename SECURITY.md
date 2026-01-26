# Security Policy

## Security Design

This Chrome extension follows security best practices:

### Content Security Policy (A05)
- `script-src 'self'` - No inline/external scripts
- `object-src 'none'` - No plugins
- `base-uri 'self'` - Prevents base tag injection

### Input Validation (A03)
- Platform names validated against allowlist
- Message types validated before processing
- Settings sanitized with type/range checking
- Message origin verified (extension ID match)

### URL Security (A10)
- Tab URLs from strict allowlist only
- Only `leetcode.com` and `codeforces.com`
- HTTPS enforced

### Minimal Permissions
| Permission | Purpose |
| --- | --- |
| `alarms` | Schedule reminders |
| `tabs` | Open practice sites |
| `storage` | Save local settings |

No `host_permissions` - cannot access page content.

## OWASP Mapping

| Control | Status |
| --- | --- |
| A01 Access Control | N/A - No user accounts |
| A02 Cryptography | N/A - No encryption |
| A03 Injection | ✅ Input validation |
| A04 Insecure Design | ✅ Minimal attack surface |
| A05 Misconfiguration | ✅ CSP configured |
| A06 Vulnerable Components | ✅ No dependencies |
| A07 Auth Failures | N/A - No authentication |
| A08 Data Integrity | N/A - No webhooks |
| A09 Logging | ✅ No sensitive logs |
| A10 SSRF | ✅ URL allowlist |

## Reporting Vulnerabilities

Do NOT open public issues. Email details privately.
