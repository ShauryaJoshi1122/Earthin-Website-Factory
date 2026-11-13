import pg from 'pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.log('Skipping seed: DATABASE_URL not set.');
  process.exit(0);
}

const pool = new pg.Pool({ connectionString });

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Seeding roles and permissions...');

    // 1. Roles
    const rolesList = [
      { name: 'SUPER_ADMIN', description: 'Full Factory access, team management, security and server settings' },
      { name: 'ADMIN', description: 'Website creation, hosting management, deployment monitoring' },
      { name: 'WEBSITE_OPERATOR', description: 'Website creation, branding, theme and plugin selection' },
      { name: 'VIEWER', description: 'Read-only access to websites, deployments and reports' },
    ];

    for (const r of rolesList) {
      await client.query(
        `INSERT INTO roles (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
        [r.name, r.description]
      );
    }

    // 2. Default Super Admin
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@earthin.online';
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'EarthinAdmin2026!';
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    const userRes = await client.query(
      `
      INSERT INTO users (name, email, password_hash, status)
      VALUES ($1, $2, $3, 'active')
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
      RETURNING id;
    `,
      ['Earthin Super Admin', adminEmail, passwordHash]
    );

    const userId = userRes.rows[0].id;
    const superAdminRoleRes = await client.query(`SELECT id FROM roles WHERE name = 'SUPER_ADMIN'`);
    if (superAdminRoleRes.rows.length > 0) {
      const roleId = superAdminRoleRes.rows[0].id;
      await client.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [userId, roleId]
      );
    }

    console.log(`Default Super Admin created: ${adminEmail} (password: ${adminPassword})`);
  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
