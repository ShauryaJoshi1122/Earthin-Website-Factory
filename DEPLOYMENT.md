# Deployment Guide
# Earthin Website Factory — Vercel Edition

## 1. Prerequisites for Vercel Deployment

Before deploying the Factory to production:
1. A Vercel account with access to deploy projects.
2. A provisioned Neon Serverless PostgreSQL database (via Vercel Marketplace).
3. A Vercel Blob store connected to the project.
4. Production domain configured: `factory.earthin.online`.

---

## 2. Environment Variables Configuration

Set these variables in your Vercel Project Settings &rarr; **Environment Variables**:

| Variable | Description | Example / Note |
| :--- | :--- | :--- |
| `DATABASE_URL` | Neon PostgreSQL pooled connection URI | `postgresql://user:pass@ep-cool-123.us-east-2.aws.neon.tech/neondb?sslmode=require` |
| `AUTH_SECRET` | 32+ character secret for session signing | `openssl rand -base64 32` |
| `ENCRYPTION_KEY` | 64-character hex key (32 bytes) for AES-256-GCM | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `DEPLOYMENT_SIGNING_KEY` | HMAC secret for CMS installation manifests | `openssl rand -hex 32` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob access token | Injected automatically when Blob is connected |
| `APP_URL` | Canonical public URL of the Factory | `https://factory.earthin.online` |
| `APP_ENV` | Environment name | `production` |
| `DEFAULT_ADMIN_EMAIL` | Initial Super Admin login email | `admin@earthin.online` |
| `DEFAULT_ADMIN_PASSWORD` | Initial Super Admin password | `EarthinAdmin2026!` |

---

## 3. Database Initialization

Once `DATABASE_URL` is configured:

```bash
# 1. Apply Drizzle database migrations
node scripts/migrate.mjs

# 2. Seed initial roles, permissions, and Super Admin
node scripts/seed.mjs

# 3. Sync CMS release metadata, themes, and plugins
node scripts/sync-cms-release.mjs
```

---

## 4. Deploying via Vercel CLI

```bash
# Login to Vercel
npx vercel login

# Link repository to your Vercel project
npx vercel link

# Deploy to Preview environment
npx vercel

# Deploy to Production environment
npx vercel --prod
```

---

## 5. Domain Configuration on Vercel

1. In Vercel Project Dashboard, navigate to **Settings &rarr; Domains**.
2. Add `factory.earthin.online`.
3. In your DNS provider (e.g., Cloudflare or cPanel Zone Editor for `earthin.online`), create a CNAME record:
   - **Type**: `CNAME`
   - **Name**: `factory`
   - **Target**: `cname.vercel-dns.com`
4. Wait for Vercel to generate the Let's Encrypt SSL certificate automatically.
