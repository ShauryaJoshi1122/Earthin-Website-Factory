# cPanel Integration & UAPI Adapter Guide
# Earthin Website Factory

## 1. Overview
The Factory interacts with cPanel hosting accounts (both internal Earthin cPanel servers and client-managed third-party cPanels) strictly using authenticated HTTPS requests to the **cPanel UAPI** on port `2083`.

---

## 2. Authentication Standard
- **Method**: cPanel API Tokens (recommended over plain passwords).
- **HTTP Header**:
  ```http
  Authorization: cpanel <cpanel_username>:<api_token>
  Accept: application/json
  ```
- **Token Security**: Tokens are encrypted at rest with AES-256-GCM and never exposed to the frontend.

---

## 3. UAPI Modules & Operations

### 3.1 Connection & Server Discovery (`CpanelConnectionAdapter`)
- `Variables::get_user_information`: Validates active session and retrieves user details.
- `PHP::get_vhost_versions`: Discovers installed PHP runtime versions.
- `Mysql::get_server_information`: Detects MySQL / MariaDB server capabilities.
- `Quota::get_quota_info`: Reads disk quota and storage usage.

### 3.2 Virtual Hosts & Domains (`CpanelDomainAdapter`)
- `DomainInfo::domains_data`: Lists all domains (`main_domain`, `sub_domains`, `addon_domains`) and their document roots.
- `SSL::installed_hosts`: Verifies active SSL certificates and expiry dates.

### 3.3 Database Provisioning (`CpanelDatabaseAdapter`)
- `Mysql::create_database`:
  - Parameter `name`: `<cpanel_user>_<slug>_<suffix>` (respects 64-character limit).
- `Mysql::create_user`:
  - Parameter `name`: `<cpanel_user>_u_<suffix>` (respects 32-character limit).
  - Parameter `password`: 22-character cryptographically secure password.
- `Mysql::set_privileges_on_database`:
  - Parameter `privileges`: `ALL PRIVILEGES`.

### 3.4 File Operations (`CpanelFileAdapter`)
- `Fileman::list_files`: Checks destination directory availability.
- `Fileman::extract_files`: Extracts release ZIP archive into destination document root.
- `Fileman::save_file_content`: Writes the production `.env` file containing database credentials and deployment signing secret.

---

## 4. Error Handling & Timeout Behavior
- Request timeouts are configured per operation (35 seconds for GET inspection, 60 seconds for file extraction, 95 seconds for installation handoff).
- HTTP 401 returns explicit credential invalidation notices.
- HTTP 403 returns missing module permission errors.
- Unhandled errors are captured in `deployment_logs` and attached to the failed step in `deployment_steps`.
