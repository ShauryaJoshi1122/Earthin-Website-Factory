import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.log('Skipping sync: DATABASE_URL not set.');
  process.exit(0);
}

const pool = new pg.Pool({ connectionString });

async function syncCmsMetadata() {
  const client = await pool.connect();
  try {
    const cmsDir = join(process.cwd(), 'existing-cms');
    if (!existsSync(cmsDir)) {
      console.log('existing-cms directory not found. Skipping sync.');
      return;
    }

    // 1. Sync Release
    const releaseFile = join(cmsDir, 'release.json');
    if (existsSync(releaseFile)) {
      const release = JSON.parse(readFileSync(releaseFile, 'utf8'));
      console.log(`Syncing CMS Release v${release.version}...`);
      await client.query(
        `
        INSERT INTO cms_releases (version, name, min_php, changelog, is_stable, is_default, released_at)
        VALUES ($1, $2, $3, $4, true, true, $5)
        ON CONFLICT (version) DO UPDATE SET
          name = EXCLUDED.name,
          min_php = EXCLUDED.min_php,
          changelog = EXCLUDED.changelog,
          is_default = EXCLUDED.is_default;
      `,
        [
          release.version,
          release.name || 'Earthin News CMS',
          release.min_php || '8.3.0',
          JSON.stringify(release.changelog || []),
          release.released_at || new Date().toISOString(),
        ]
      );
    }

    // 2. Sync Themes
    const themesDir = join(cmsDir, 'themes');
    if (existsSync(themesDir)) {
      const themeDirs = readdirSync(themesDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);

      for (const slug of themeDirs) {
        const themeJsonPath = join(themesDir, slug, 'theme.json');
        if (existsSync(themeJsonPath)) {
          const theme = JSON.parse(readFileSync(themeJsonPath, 'utf8'));
          console.log(`Syncing Theme: ${theme.name} (${slug})...`);
          await client.query(
            `
            INSERT INTO cms_themes (name, slug, version, description, author, min_cms_version, supported_features, settings_schema, is_approved)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
            ON CONFLICT (slug) DO UPDATE SET
              name = EXCLUDED.name,
              version = EXCLUDED.version,
              description = EXCLUDED.description,
              author = EXCLUDED.author,
              min_cms_version = EXCLUDED.min_cms_version,
              supported_features = EXCLUDED.supported_features,
              settings_schema = EXCLUDED.settings_schema;
          `,
            [
              theme.name,
              slug,
              theme.version || '1.0.0',
              theme.description || '',
              theme.author || 'Earthin News CMS',
              theme.min_cms_version || '1.0.0',
              JSON.stringify(theme.supported_features || []),
              JSON.stringify(theme.settings_schema || {}),
            ]
          );
        }
      }
    }

    // 3. Sync Plugins
    const pluginsDir = join(cmsDir, 'plugins');
    if (existsSync(pluginsDir)) {
      const pluginDirs = readdirSync(pluginsDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);

      for (const slug of pluginDirs) {
        const pluginJsonPath = join(pluginsDir, slug, 'plugin.json');
        if (existsSync(pluginJsonPath)) {
          const plugin = JSON.parse(readFileSync(pluginJsonPath, 'utf8'));
          console.log(`Syncing Plugin: ${plugin.name} (${slug})...`);
          await client.query(
            `
            INSERT INTO cms_plugins (name, slug, version, description, category, icon, min_cms_version, required_permissions, settings_schema, is_approved, is_core)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, false)
            ON CONFLICT (slug) DO UPDATE SET
              name = EXCLUDED.name,
              version = EXCLUDED.version,
              description = EXCLUDED.description,
              category = EXCLUDED.category,
              icon = EXCLUDED.icon,
              min_cms_version = EXCLUDED.min_cms_version,
              required_permissions = EXCLUDED.required_permissions,
              settings_schema = EXCLUDED.settings_schema;
          `,
            [
              plugin.name,
              slug,
              plugin.version || '1.0.0',
              plugin.description || '',
              plugin.category || 'Editorial',
              plugin.icon || 'puzzle',
              plugin.min_cms_version || '1.0.0',
              JSON.stringify(plugin.required_permissions || []),
              JSON.stringify(plugin.settings_schema || {}),
            ]
          );
        }
      }
    }

    console.log('CMS releases, themes and plugins synced successfully.');
  } catch (error) {
    console.error('Sync failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

syncCmsMetadata();
