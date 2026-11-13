# Backup & Disaster Recovery Guide
# Earthin Website Factory

## 1. Overview
The Factory provides automated snapshot creation, bit-level integrity verification, and instant restoration for any managed news website.

---

## 2. Backup Types
1. **Database Snapshot (`database`)**:
   - Dumps MySQL tables, schema, articles, taxonomies, settings, and users.
   - Preserves news content and metadata.
2. **Full Archive (`full`)**:
   - Complete package including database and server files.
3. **Media Archive (`media`)**:
   - Archives the `storage/app/public/media/` directory containing featured images, videos, and watermarked assets.

---

## 3. Integrity Verification Standard
- Every backup file is hashed using **SHA-256** immediately upon generation.
- The hash is recorded in `backup_records.checksum_sha256`.
- Backups are only marked `integrity_verified = true` once the computed checksum matches the stored file payload.
- Unverified or corrupt backups cannot be used for restoration.

---

## 4. Disaster Recovery Workflow

When restoring a website from backup:
1. Operator navigates to **Backups** (`/backups`) or **Website Details** (`/websites/[id]`).
2. Identifies the verified backup snapshot.
3. Clicks **Restore**.
4. Confirmation prompt requires explicit consent to prevent accidental overwrites.
5. Restoration executes against the target cPanel database.
6. The event is permanently logged in `audit_logs`.
