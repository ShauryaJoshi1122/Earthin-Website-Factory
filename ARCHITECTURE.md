# System Architecture Document
# Earthin Website Factory — Vercel Edition

## 1. High-Level Architecture Overview

```mermaid
flowchart TB
    User["Team Member / Operator"] -->|HTTPS| VercelFrontend["Next.js 15 App Router\n(factory.earthin.online)"]
    VercelFrontend -->|Route Handlers| ServiceLayer["Service Layer\n(cPanel, Workflow, CMS, Backups)"]
    
    subgraph Vercel_Platform["Vercel Platform Engine"]
        ServiceLayer -->|Drizzle ORM| NeonDB["Neon PostgreSQL\n(Vercel Marketplace)"]
        ServiceLayer -->|Blob SDK| VercelBlob["Vercel Blob Storage\n(Releases, Media, Backups)"]
        ServiceLayer -->|Durable Steps| WorkflowEngine["Durable Workflow Engine\n(28-Step Resilient State Machine)"]
        VercelCron["Vercel Cron Jobs\n(/api/cron/housekeeping)"] -->|Daily Cleanup| ServiceLayer
    end

    subgraph Hosting_Fleet["cPanel Hosting Fleet (Internal / External)"]
        WorkflowEngine -->|UAPI (Port 2083)| cPanelUAPI["cPanel Server UAPI\n(Mysql, Fileman, DomainInfo, SSL)"]
        WorkflowEngine -->|Signed Manifest POST| CMSInstance["Earthin News CMS Instance\n(Target Domain / Document Root)"]
    end
```

---

## 2. Core Subsystems

### 2.1 Database & ORM (`src/db/`)
- **Neon PostgreSQL**: Provisioned through Vercel Marketplace.
- **Drizzle ORM**: Schema declared in `src/db/schema.ts` with 26 tables.
- **Connection Pooling**: Uses `@neondatabase/serverless` for serverless environments and standard `pg` pool fallback for Node.js runtimes.

### 2.2 Security & Cryptography Subsystem (`src/lib/crypto.ts`)
- **Token Encryption**: AES-256-GCM authenticated encryption. Sensitive data is stored in the format `iv:authTag:ciphertext`.
- **Manifest Signing**: HMAC-SHA256 signature generator and constant-time verifier.
- **Secret Hygiene**: Zero plaintext credentials stored in database or printed in server logs.

### 2.3 cPanel Integration Engine (`src/services/cpanel/`)
- **Adapter Interfaces**:
  - `CpanelClient`: Low-level HTTPS transport to `https://{host}:2083/execute/{module}/{function}`.
  - `CpanelConnectionAdapter`: Session validation, quota detection, PHP & MySQL version discovery.
  - `CpanelDomainAdapter`: Virtual host mapping, document root extraction, DNS & SSL checks.
  - `CpanelDatabaseAdapter`: Database & dedicated user creation with cPanel username prefixes.
  - `CpanelFileAdapter`: Remote directory checks, package extraction via `Fileman::extract_files`, and production `.env` generation.
  - `CpanelInstallationAdapter`: Cryptographically signed installation dispatch.
  - `CpanelVerificationAdapter`: Multi-point health check (Homepage HTTP 200, CMS Admin reachability, SSL active).

### 2.4 Durable Deployment Workflow Engine (`src/services/workflow/`)
- **State Persistence**: Every job maintains 28 explicit records in `deployment_steps` and append-only log entries in `deployment_logs`.
- **Browser-Refresh Durability**: The client UI reads step state and progress percentages directly from PostgreSQL, guaranteeing that refreshing the browser never loses deployment progress.
- **Fault-Tolerance & Retries**: Any step that encounters network or API timeouts can be safely retried without re-running completed idempotent operations.

---

## 3. Data Flow for Website Generation

1. **Client Submission**: Operator completes the 9-step wizard and submits `POST /api/websites`.
2. **Atomic Record Creation**: Creates entries in `websites`, `website_domains`, `website_branding`, `website_administrators`, and `website_plugins`.
3. **Workflow Initialization**: Creates `deployment_jobs` row and initializes all 28 rows in `deployment_steps`.
4. **Step 1 to 8**: Validates request, release, hosting health, document root, and PHP/MySQL compatibility.
5. **Step 9 to 11**: Provisions database (`Mysql::create_database`), provisions database user (`Mysql::create_user`), grants privileges (`Mysql::set_privileges_on_database`), and verifies database access. Stores encrypted credentials in `database_credentials`.
6. **Step 12 to 15**: Obtains CMS package, verifies SHA-256 checksum, transfers package to destination directory, and extracts archive.
7. **Step 16**: Writes production `.env` containing database credentials, app keys, and deployment secret.
8. **Step 17 to 22**: Generates HMAC-SHA256 signed installation manifest, dispatches to `POST https://{domain}/install/factory-deploy`, executes migrations, seeds roles, starter news categories, activates theme & plugins, and creates Super Admin.
9. **Step 23 to 27**: Verifies database tables, pings homepage and admin page, verifies SSL status, and marks website `ACTIVE`.
10. **Step 28**: Dispatches completion notification to dashboard.
