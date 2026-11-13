# Earthin Website Factory — Vercel Edition

> **Automated News Website Creation & Deployment Platform for Earthin**  
> Primary Target Domain: `factory.earthin.online`  
> Decoupled Production Architecture on Next.js 15, Neon PostgreSQL, Drizzle ORM, Vercel Blob & Durable Workflow Execution.

---

## 1. What the Product Does

**Earthin Website Factory** is an enterprise web application designed to empower non-technical Earthin editorial team members to create and deploy independent, broadcast-grade news portals with zero manual server configuration.

Through an intuitive 9-step guided wizard, a team member can:
1. Log into the Factory dashboard (`factory.earthin.online`).
2. Click **Create Website**.
3. Enter news channel information (Channel Name, Title, Tagline, Editorial contacts, City/State).
4. Upload branding assets (Main Logo, Favicon, Header/Footer logos) and choose primary & studio palette colors.
5. Select a cPanel hosting connection (Internal Earthin cPanel or External customer cPanel).
6. Specify the domain and document root.
7. Select an approved editorial theme (e.g., *Earthin Samachar Starter* or *Earthin Patrika Express*).
8. Activate verified newsroom plugins (Live TV M3U8 Player, Breaking News Broadcaster, Public Opinion Poll, Reporter Press Card, Media Watermark, etc.).
9. Configure the initial Super Administrator.
10. Click **Generate Website** and watch real-time durable installation progress through all 28 automated steps.
11. Receive a fully operational news portal with CMS administrator access.

---

## 2. Non-Negotiable Architecture

The entire Factory application runs strictly on Vercel-compatible infrastructure:

- **Frontend & Routing**: Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Lucide icons.
- **Cinematic Dark Theme**: `#080D17` (Canvas), `#101827` (Sidebar), `#151F30` (Cards), `#4F8CFF` (Primary), `#16A36A` (Success), `#F0A43B` (Warning), `#E34B5B` (Error).
- **Database**: Neon PostgreSQL via Vercel Marketplace, managed via Drizzle ORM with connection pooling.
- **Durable Deployment Workflow**: Stateful 28-step resilient execution engine with persistent step records in PostgreSQL, per-step retry handling, and browser-refresh durability.
- **File & Package Storage**: Vercel Blob (private stores for CMS release archives and database backups, client direct uploads for branding).
- **Security & Secrets**: AES-256-GCM encryption for all cPanel API tokens and database passwords, HMAC-SHA256 signature on automated installation manifests.
- **Cron Jobs**: Vercel Cron (`/api/cron/housekeeping`) for reconciling stalled jobs and pruning old logs.

---

## 3. Installation & Quick Start

### Prerequisites
- Node.js `v20+` or `v22+`
- PostgreSQL database (Neon serverless or local PostgreSQL)
- Vercel account

### Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/ShauryaJoshi1122/earthin-website-factory.git
cd earthin-website-factory

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL, AUTH_SECRET, ENCRYPTION_KEY, DEPLOYMENT_SIGNING_KEY

# 4. Generate and run database migrations
npm run db:generate
npm run db:migrate

# 5. Seed default roles, super admin, and sync CMS releases/themes/plugins
npm run db:seed
npm run cms:sync

# 6. Run test suite
npm test

# 7. Start development server
npm run dev
# Open http://localhost:3000
```

---

## 4. Vercel Setup & Marketplace Integrations

### Database Provisioning (Neon PostgreSQL)
1. In your Vercel Dashboard, go to **Storage & Databases** or **Marketplace**.
2. Select **Neon Serverless Postgres** and connect it to this project.
3. Vercel automatically exposes `DATABASE_URL` (and `POSTGRES_URL`).
4. Run migrations using `npm run db:migrate`.

### File Storage (Vercel Blob)
1. In Vercel Project Settings &rarr; **Storage**, click **Connect Blob**.
2. Vercel automatically sets `BLOB_READ_WRITE_TOKEN`.
3. Private storage is utilized for CMS package distribution and SQL backups.

### Deployment to Vercel
```bash
# Link project to Vercel
npx vercel link

# Pull environment variables
npx vercel env pull .env.local

# Deploy to preview
npx vercel

# Deploy to production
npx vercel --prod
```

---

## 5. cPanel Integration Architecture

The Factory integrates with internal and external cPanel accounts via a modular adapter pattern:
- **`CpanelClient`**: Low-level HTTPS transport to `https://{host}:2083/execute/{Module}/{function}` using `Authorization: cpanel {username}:{token}`.
- **`CpanelConnectionAdapter`**: Capability discovery (PHP version, MySQL version, disk quotas, vhost domains).
- **`CpanelDomainAdapter`**: Domain listing, document root mapping, DNS resolution, and SSL status verification.
- **`CpanelDatabaseAdapter`**: Automated MySQL database and dedicated user provisioning with cPanel username prefixes and secure random passwords.
- **`CpanelFileAdapter`**: Destination folder validation, package extraction via `Fileman::extract_files`, and production `.env` generation.
- **`CpanelInstallationAdapter`**: Signed HMAC-SHA256 deployment manifest dispatch to `/install/factory-deploy`.
- **`CpanelVerificationAdapter`**: Public homepage HTTP 200 verification, Admin login reachability, and SSL validation.

---

## 6. Testing

The Factory includes an automated test suite executed with the native Node.js test runner:

```bash
npm test
```

### Verified Test Suites:
- `tests/crypto.test.mjs`: AES-256-GCM encryption/decryption, HMAC-SHA256 manifest signing and verification, tamper rejection.
- `tests/cpanel-adapters.test.mjs`: cPanel URL normalization, database naming limits and user prefixing rules.
- `tests/workflow-steps.test.mjs`: 28 unique sequential steps, progress percentage calculation at boundaries.
- `tests/auth-rbac.test.mjs`: Role-based access control permission matrices across SUPER_ADMIN, ADMIN, WEBSITE_OPERATOR, and VIEWER.

---

## 7. License & Organization

Proprietary and Confidential. Copyright &copy; 2026 **Earthin**. All rights reserved.
