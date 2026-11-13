# REST API Documentation
# Earthin Website Factory

Base Path: `/api`  
Authentication: Session cookie (`earthin_factory_session`) or Bearer token where supported.

---

## 1. Authentication Endpoints

### `POST /api/auth/login`
- **Description**: Authenticate operator credentials and issue HttpOnly session cookie.
- **Request Body**:
  ```json
  {
    "email": "admin@earthin.online",
    "password": "password"
  }
  ```
- **Response**: `{ "success": true, "user": { "id": 1, "name": "...", "role": "SUPER_ADMIN" } }`

### `POST /api/auth/logout`
- **Description**: Terminate session and clear cookie.
- **Response**: `{ "success": true, "message": "Logged out successfully." }`

### `GET /api/auth/me`
- **Description**: Retrieve current authenticated session user profile and permissions.
- **Response**: `{ "authenticated": true, "user": { "id": 1, "name": "...", "permissions": [...] } }`

---

## 2. Dashboard Endpoints

### `GET /api/dashboard/stats`
- **Description**: Real-time aggregated statistics from PostgreSQL database.
- **Response**:
  ```json
  {
    "stats": {
      "totalWebsites": 12,
      "activeWebsites": 10,
      "deployingCount": 1,
      "failedCount": 1,
      "hostingCount": 3,
      "releasesCount": 2
    },
    "recentDeployments": [...],
    "degradedHosting": [...]
  }
  ```

### `GET /api/dashboard/activity`
- **Description**: Live stream of latest audit trail events.

---

## 3. Hosting Endpoints

### `GET /api/hosting`
- **Description**: List all cPanel hosting connections and capabilities.

### `POST /api/hosting`
- **Description**: Connect a new cPanel account (server URL, username, encrypted API token).

### `POST /api/hosting/test`
- **Description**: Test connectivity and auto-detect server capabilities (PHP, MySQL, disk quota, domains).

### `GET /api/hosting/:id/domains`
- **Description**: Retrieve domains and document roots from cPanel vhost configuration.

### `DELETE /api/hosting/:id`
- **Description**: Remove a hosting connection (guarded against active website dependencies).

---

## 4. Websites Endpoints

### `GET /api/websites`
- **Description**: List websites with branding, domain, hosting, and status.

### `POST /api/websites`
- **Description**: Create new website, initialize configuration, and trigger durable deployment workflow.
- **Payload**:
  ```json
  {
    "name": "Earthin Samachar",
    "title": "Earthin Samachar — Hindi News",
    "primaryDomain": "samachar.earthin.online",
    "hostingConnectionId": 1,
    "selectedThemeSlug": "earthin-samachar",
    "selectedPluginSlugs": ["live-tv", "breaking-news-broadcaster"],
    "adminName": "Shaurya Joshi",
    "adminEmail": "shaurya@earthin.online"
  }
  ```

### `GET /api/websites/:id`
- **Description**: Retrieve full details, branding, domains, administrators, plugins, deployments, and backups for a website.

### `PATCH /api/websites/:id`
- **Description**: Update website branding or metadata.

### `DELETE /api/websites/:id`
- **Description**: Delete website record.

---

## 5. Deployments Endpoints

### `GET /api/deployments`
- **Description**: List deployment jobs with progress percentage and status.

### `GET /api/deployments/:id`
- **Description**: Retrieve deployment job, all 28 steps breakdown with timestamps and attempts, and execution logs.

### `POST /api/deployments/:id/retry`
- **Description**: Safe retry of a failed deployment step.

### `POST /api/deployments/:id/cancel`
- **Description**: Cancel a running deployment.

---

## 6. Backups Endpoints

### `GET /api/backups`
- **Description**: List backup records with integrity verification status.

### `POST /api/backups`
- **Description**: Trigger creation of a database or full snapshot backup.

### `POST /api/backups/:id/restore`
- **Description**: Restore target website from verified backup snapshot.

---

## 7. Storage & Cron Endpoints

### `POST /api/upload`
- **Description**: Upload branding logos, favicons, or release archives to Vercel Blob.

### `GET /api/cron/housekeeping`
- **Description**: Reconcile stalled jobs, update hosting statuses, and prune audit logs.
