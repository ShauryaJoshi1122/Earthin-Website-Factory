# Project Roadmap
# Earthin Website Factory — Vercel Edition

Status Tracking:
- [x] **Completed**: Implemented, verified with unit tests, and production build tested.
- [/] **In Progress**: Active operational enhancements.
- [ ] **Planned**: Future scheduled milestone.
- [!] **Blocked**: Blocked by external dependency.

---

## Phase 1: Inspection & Architecture Verification
- [x] Inspect existing CMS repository (`existing-cms`) and verify its file structure.
- [x] Verify packaging command (`PackageCpanelReleaseCommand.php`) and output formats.
- [x] Verify database migrations, seeders, and starter categories.
- [x] Verify existing web installer (`/install`) and CSRF handoff mechanisms.
- [x] Verify theme engine (Earthin Samachar Starter, Earthin Patrika Express) and plugin schemas (14 plugins).

## Phase 2: Vercel Platform & Foundation
- [x] Establish Next.js 15 App Router + React 19 project foundation.
- [x] Configure Tailwind CSS with Earthin dark cinematic palette (`#080D17`, `#101827`, `#151F30`, `#4F8CFF`, `#16A36A`, `#F0A43B`, `#E34B5B`).
- [x] Set up Neon PostgreSQL via Drizzle ORM.
- [x] Configure Vercel Blob client and server upload adapters.
- [x] Configure Vercel Cron (`/api/cron/housekeeping`).

## Phase 3: Database Design, Auth & Permissions
- [x] Design 26-table Drizzle schema (`users`, `roles`, `permissions`, `hosting_connections`, `websites`, `deployment_jobs`, `deployment_steps`, etc.).
- [x] Implement Drizzle migration generator and automated SQL runner script (`scripts/migrate.mjs`).
- [x] Implement database seeder (`scripts/seed.mjs`) for roles, permissions, and initial Super Admin.
- [x] Implement AES-256-GCM encryption/decryption for credentials (`src/lib/crypto.ts`).
- [x] Implement HMAC-SHA256 signature generator and constant-time verifier.
- [x] Implement HttpOnly cookie-based session authentication with JWT (`src/lib/auth.ts`).
- [x] Implement RBAC authorization matrix for `SUPER_ADMIN`, `ADMIN`, `WEBSITE_OPERATOR`, `VIEWER`.

## Phase 4: Main Dashboard & Website Creation Wizard
- [x] Build dark cinematic Layout with responsive Sidebar and Header (`src/components/`).
- [x] Build Main Dashboard (`/`) with live statistics, recent deployments, hosting capacity alerts, and activity stream.
- [x] Build 9-step guided Website Creation Wizard (`/websites/create`):
  - [x] Step 1: Channel Info & Contacts
  - [x] Step 2: Branding Logos & Color Pickers
  - [x] Step 3: cPanel Hosting Selection
  - [x] Step 4: Domain & Document Root
  - [x] Step 5: Theme Selection with Previews
  - [x] Step 6: Newsroom Plugins Selection
  - [x] Step 7: Administrator Credentials
  - [x] Step 8: Complete Review Manifest
  - [x] Step 9: Launch Durable Deployment

## Phase 5: cPanel Integration Engine
- [x] Implement `CpanelClient` with timeout handling and error normalization.
- [x] Implement `CpanelConnectionAdapter` for server capability and PHP/MySQL discovery.
- [x] Implement `CpanelDomainAdapter` for domain listing, docroot mapping, and SSL checking.
- [x] Implement `CpanelDatabaseAdapter` for automated database/user provisioning with cPanel username prefixes.
- [x] Implement `CpanelFileAdapter` for remote directory checks, package extraction, and `.env` writing.
- [x] Implement `CpanelInstallationAdapter` for automated signed manifest dispatch.
- [x] Implement `CpanelVerificationAdapter` for multi-point reachability testing.

## Phase 6: CMS Release & Package Storage
- [x] Implement `CmsReleaseService` for registering releases and storing checksums.
- [x] Implement release metadata sync from `release.json`.
- [x] Implement themes and plugins sync script (`scripts/sync-cms-release.mjs`).

## Phase 7: Durable Deployment Workflow Engine
- [x] Implement 28-step state machine (`src/services/workflow/deployment-workflow.ts`).
- [x] Persist each step status, timestamps, and attempt counts in PostgreSQL.
- [x] Implement real-time deployment logging (`deployment_logs`).
- [x] Provide browser-refresh durability.
- [x] Implement safe step retries and workflow cancellation.

## Phase 8: Secure CMS Installation Handoff
- [x] Implement `factoryDeploy` in `InstallerController.php` inside the CMS.
- [x] Exempt CSRF for automated deployment route in `existing-cms/bootstrap/app.php`.
- [x] Add HMAC signature verification, timestamp freshness check, and replay protection.
- [x] Implement permanent installation lock (`storage/app/installed.lock`).

## Phase 9: Website Management, Backups & Updates
- [x] Build Website Inventory (`/websites`) with search and status badges.
- [x] Build Website Details (`/websites/[id]`) with configuration, branding, and deployment history.
- [x] Build Backups module (`/backups`) with snapshot creation, integrity checks, and restore workflow.
- [x] Implement CMS Update action and rollback safeguards.

## Phase 10: Security Hardening & Automated Tests
- [x] Write unit & integration tests (`npm test` passes 100%):
  - [x] `tests/crypto.test.mjs`
  - [x] `tests/cpanel-adapters.test.mjs`
  - [x] `tests/workflow-steps.test.mjs`
  - [x] `tests/auth-rbac.test.mjs`
- [x] Compile clean Next.js production build (`npm run build` passes 100%).

## Phase 11: Deployment & Verification
- [/] Connect Neon PostgreSQL via Vercel Marketplace in production environment.
- [/] Deploy to Vercel preview and verify live deployment.
- [ ] Connect custom production domain `factory.earthin.online`.
