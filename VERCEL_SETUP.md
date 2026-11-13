# Vercel Setup & Marketplace Integrations
# Earthin Website Factory

## 1. Connecting Neon PostgreSQL via Vercel Marketplace

1. Open your Vercel Dashboard and navigate to the **Marketplace** tab (or **Storage** tab).
2. Search for **Neon** (Serverless Postgres).
3. Click **Add Integration** and select your team and the `earthin-website-factory` project.
4. Choose the primary cloud region nearest to your cPanel hosting servers (e.g., `us-east-2`, `ap-south-1`, or `eu-central-1`).
5. Upon creation, Vercel automatically creates and binds the environment variables:
   - `DATABASE_URL`
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`
6. Neon handles connection pooling automatically, allowing hundreds of serverless executions to query PostgreSQL without exhausting database connection limits.

---

## 2. Connecting Vercel Blob

1. In the Vercel Dashboard, select your project &rarr; **Storage** &rarr; **Create Database / Store**.
2. Select **Blob**.
3. Choose a store name, e.g. `earthin-factory-storage`.
4. Connect it to all environments (Production, Preview, Development).
5. Vercel automatically exposes `BLOB_READ_WRITE_TOKEN`.
6. Use private Blob storage for:
   - Verified CMS release packages (`/releases/{version}/*.zip`).
   - Private SQL backups (`/backups/{website_id}/*.sql`).
   - Branding assets (`/branding/*`).

---

## 3. Vercel Cron Jobs

The Factory includes an automated housekeeping cron configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/housekeeping",
      "schedule": "0 2 * * *"
    }
  ]
}
```

The route `/api/cron/housekeeping`:
- Detects stalled deployment jobs (jobs left in `running` status for > 2 hours).
- Transitions them to `failed` with descriptive diagnostic messages.
- Verifies server health and logs reconciliation metrics into `audit_logs`.
