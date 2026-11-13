# Security Policy & Safeguards
# Earthin Website Factory

## 1. Secrets & Credentials Encryption

All external hosting credentials and database credentials stored by the Factory are encrypted at rest using **AES-256-GCM** authenticated encryption:
- **Key Derivation**: 32-byte cryptographically secure key passed via `ENCRYPTION_KEY`.
- **Initialization Vector**: Unique 96-bit random IV generated per encryption operation via `crypto.randomBytes(12)`.
- **Integrity Tag**: 128-bit authentication tag guarantees ciphertext cannot be tampered with.
- **Format**: Stored in PostgreSQL as `iv:authTag:ciphertext`.
- **Zero Plaintext Leakage**: Raw cPanel API tokens and generated MySQL passwords are never returned in public API payloads, never transmitted to the browser, and never logged in console outputs.

---

## 2. Secure Installation Handoff & Manifest Signing

To prevent rogue installations or public bypasses on newly provisioned servers:
1. Every automated installation request to `POST https://{domain}/install/factory-deploy` requires an **HMAC-SHA256 signature** in header `X-Earthin-Signature`.
2. The payload contains `timestamp` and `installId` (UUID). The server verifies that `abs(time() - timestamp) <= 900` (15 minutes window) to block replay attacks.
3. The signature is computed using a secret known only to the Factory and injected into the website's `.env` as `FACTORY_DEPLOYMENT_SECRET`.
4. The CMS installer verifies the signature using constant-time comparison (`hash_equals`).
5. Upon successful installation, the CMS writes `storage/app/installed.lock`, permanently sealing the installer route against all future requests.

---

## 3. Role-Based Access Control (RBAC)

The application enforces server-side RBAC on all Route Handlers and operations:

| Capability | SUPER_ADMIN | ADMIN | WEBSITE_OPERATOR | VIEWER |
| :--- | :---: | :---: | :---: | :---: |
| Full Factory & Settings Access | Yes | No | No | No |
| Team & Operator Management | Yes | No | No | No |
| Connect / Delete cPanel Hosting | Yes | Yes | No | No |
| Create New Websites | Yes | Yes | Yes | No |
| Select Themes & Approved Plugins | Yes | Yes | Yes | No |
| Trigger Deployments & Retries | Yes | Yes | Yes | No |
| Create Backups & Restore | Yes | Yes | No | No |
| View Websites & Real-Time Logs | Yes | Yes | Yes | Yes |

---

## 4. SSRF & Outbound Request Protection

- cPanel API connections are strictly bound to authorized hostnames configured by an administrator.
- Arbitrary file download URLs are never fetched blindly; releases are pulled only from verified private storage or pre-registered CMS distributions.
- Uploads are strictly restricted to 10MB and validated against allowed MIME types (`image/png`, `image/jpeg`, `image/webp`, `image/svg+xml`, `image/x-icon`, `application/zip`).

---

## 5. Session Security

- Sessions use JSON Web Tokens (JWT) signed with HMAC-SHA256 via `jose`.
- Delivered exclusively via `HttpOnly`, `SameSite=Lax`, and `Secure` (in production) cookies.
- Prevents XSS-based session hijacking.
