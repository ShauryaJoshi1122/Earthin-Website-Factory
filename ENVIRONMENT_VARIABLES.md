# Environment Variables Specification
# Earthin Website Factory

This document defines all environment variables required by Earthin Website Factory across Development, Preview, and Production environments.

---

## 1. Required Variables

### Database
- `DATABASE_URL` (Required)
  - **Description**: Connection string for Neon PostgreSQL database.
  - **Format**: `postgresql://[user]:[password]@[endpoint].neon.tech/[dbname]?sslmode=require`

### Authentication & Sessions
- `AUTH_SECRET` (Required)
  - **Description**: Cryptographic key used to sign and verify operator JWT session cookies.
  - **Format**: 32+ character random string or base64 string.
  - **Generation**: `openssl rand -base64 32`

### Security & Secret Storage
- `ENCRYPTION_KEY` (Required)
  - **Description**: 32-byte key for AES-256-GCM encryption of external cPanel API tokens and database credentials.
  - **Format**: 64-character hexadecimal string.
  - **Generation**: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

- `DEPLOYMENT_SIGNING_KEY` (Required)
  - **Description**: Shared secret key used for HMAC-SHA256 signature verification between the Factory and deployed CMS instances.
  - **Format**: Random string or hex digest.
  - **Generation**: `openssl rand -hex 32`

### File Storage (Vercel Blob)
- `BLOB_READ_WRITE_TOKEN` (Required for cloud storage)
  - **Description**: Access token for Vercel Blob store.
  - **Provisioned by**: Vercel Dashboard when Blob is connected.

### Application Environment
- `APP_URL` (Required)
  - **Description**: The public URL where the Factory is hosted.
  - **Example**: `https://factory.earthin.online`

- `APP_ENV` (Optional, default: `development`)
  - **Options**: `development` | `preview` | `production`

- `PORT` (Optional, default: `3000`)
  - **Description**: Port for local dev server.

### Default Super Administrator (Initial Seeding)
- `DEFAULT_ADMIN_EMAIL` (Optional, default: `admin@earthin.online`)
- `DEFAULT_ADMIN_PASSWORD` (Optional, default: `EarthinAdmin2026!`)

---

## 2. Environment Verification Checklist

Before starting production deployments, verify:
- [ ] `DATABASE_URL` connects cleanly (`npm run db:migrate` exits with code 0).
- [ ] `ENCRYPTION_KEY` is exactly 64 hex characters.
- [ ] `AUTH_SECRET` is set and non-empty.
- [ ] `DEPLOYMENT_SIGNING_KEY` is set and non-empty.
- [ ] `BLOB_READ_WRITE_TOKEN` is available in Vercel environment.
