# Earthin News CMS Integration Guide
# Earthin Website Factory

## 1. Source of Truth
The existing Earthin News CMS repository (`https://github.com/ShauryaJoshi1122/News-Crms`) is the authoritative source of truth for all news portal instances. The Factory does not replace or modify core CMS business logic.

---

## 2. Automated Installation Endpoint

The CMS exposes a dedicated automated deployment endpoint:

```http
POST /install/factory-deploy
```

### 2.1 Request Headers
- `X-Earthin-Signature`: HMAC-SHA256 signature of request body using `DEPLOYMENT_SIGNING_KEY`.
- `X-Earthin-Timestamp`: Unix timestamp (must be within 15 minutes of server clock).
- `X-Earthin-Install-Id`: UUID of deployment manifest.
- `Content-Type`: `application/json`

### 2.2 Payload Schema
```json
{
  "installId": "uuid-v4-string",
  "timestamp": 1700000000,
  "site_url": "https://samachar.earthin.online",
  "site_name": "Earthin Samachar",
  "tagline": "ताज़ा और निष्पक्ष समाचार",
  "contact_email": "editor@earthin.online",
  "db_connection": "mysql",
  "db_host": "localhost",
  "db_port": "3306",
  "db_database": "earthin_samachar_a1b2",
  "db_username": "earthin_u_a1b2",
  "db_password": "secure_random_db_password",
  "admin_name": "Editor In Chief",
  "admin_email": "admin@earthin.online",
  "admin_password": "generated_secure_admin_password",
  "selected_theme": "earthin-samachar",
  "selected_plugins": [
    "live-tv",
    "breaking-news-broadcaster"
  ],
  "branding": {
    "primaryColor": "#d60000",
    "mainLogoUrl": "https://blob.../logo.png",
    "faviconUrl": "https://blob.../favicon.ico"
  }
}
```

### 2.3 Actions Performed by the CMS
1. Verifies that `storage/app/installed.lock` does not exist (returns HTTP 403 if already locked).
2. Verifies cryptographic signature and timestamp freshness.
3. Tests database connectivity via `InstallerService::testDatabaseConnection()`.
4. Executes non-destructive migrations (`php artisan migrate --force`).
5. Seeds roles and permissions (`RolesAndPermissionsSeeder`).
6. Seeds starter Hindi news categories (National, States, Politics, Business, Sports, Entertainment, Tech).
7. Syncs themes and sets active theme in `site_settings`.
8. Activates approved plugins in the `plugins` database table.
9. Writes branding parameters (colors, logo, favicon) into `site_settings`.
10. Creates the Super Admin user account.
11. Writes `storage/app/installed.lock`, permanently sealing `/install` and `/install/factory-deploy`.
12. Returns JSON response:
```json
{
  "success": true,
  "message": "Earthin News CMS installed successfully via automated factory handoff.",
  "cms_version": "2.0.0",
  "installed_at": "2026-11-13T10:00:00Z",
  "install_id": "uuid-v4-string",
  "admin_email": "admin@earthin.online"
}
```

---

## 3. Themes & Plugins Synchronization

The Factory inspects and mirrors the themes and plugins declared in the CMS:

### Themes
- `earthin-samachar`: Broadcast-grade 24x7 Hindi & bilingual news portal theme.
- `earthin-patrika`: Editorial newspaper broadsheet theme.

### Verified Newsroom Plugins
1. `live-tv`: 24x7 HLS (`.m3u8`) stream player & studio switcher.
2. `breaking-news-broadcaster`: Real-time emergency ticker and broadcast alert desk.
3. `reporter-press-card`: Digital Press ID card generator with QR verification.
4. `news-poll-survey`: Public opinion polling with real-time percentage tallies.
5. `media-watermark-stamper`: Automated channel watermark stamping on article media.
6. `fact-check-badge`: Truth meter and claim verification tags for viral stories.
7. `live-update-badge`: Rolling timeline and live blog update badges.
8. `audio-podcast-player`: HTML5 voice newsreader and editorial audio podcast stream.
9. `cricket-live-score`: Real-time match commentary widget.
10. `daily-rashifal-panchang`: Daily astrological forecast & calendar widget.
11. `election-live-desk`: Constituency-wise election count and seat tally table.
12. `short-news-reels`: 60-second vertical video news clips.
13. `weather-market-widget`: BSE / Nifty indices and local city weather card.
14. `web-stories`: AMP-compatible visual story slides for mobile audiences.
