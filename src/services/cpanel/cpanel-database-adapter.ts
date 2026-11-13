import { CpanelClient } from './cpanel-client';
import { CpanelCredentials, DatabaseProvisionResult } from './cpanel-types';
import { generateSecurePassword } from '@/lib/crypto';
import crypto from 'crypto';

export class CpanelDatabaseAdapter {
  private client: CpanelClient;
  private cpanelUsername: string;

  constructor(credentials: CpanelCredentials) {
    this.client = new CpanelClient(credentials);
    this.cpanelUsername = credentials.username.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  /**
   * Provision a fresh, isolated MySQL database and dedicated user on cPanel
   */
  async provisionDatabase(websiteSlug: string): Promise<DatabaseProvisionResult> {
    const rawSuffix = crypto.randomBytes(3).toString('hex'); // 6 chars hex
    const cleanSlug = websiteSlug.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);

    // cPanel usernames limit max 16 or 32 chars: prefix (up to 8) + '_' + user (up to 7)
    const baseDbName = `${cleanSlug}_${rawSuffix}`;
    const baseDbUser = `u_${rawSuffix}`;

    // Expected prefixed names in cPanel
    const prefixedDbName = `${this.cpanelUsername}_${baseDbName}`;
    const prefixedDbUser = `${this.cpanelUsername}_${baseDbUser}`;

    const dbPassword = generateSecurePassword(22);

    // 1. Create Database: Mysql::create_database
    await this.client.execute('Mysql', 'create_database', {
      name: prefixedDbName,
    });

    // 2. Create Database User: Mysql::create_user
    await this.client.execute('Mysql', 'create_user', {
      name: prefixedDbUser,
      password: dbPassword,
    });

    // 3. Grant ALL PRIVILEGES: Mysql::set_privileges_on_database
    await this.client.execute('Mysql', 'set_privileges_on_database', {
      user: prefixedDbUser,
      database: prefixedDbName,
      privileges: 'ALL PRIVILEGES',
    });

    return {
      dbHost: 'localhost',
      dbPort: 3306,
      dbName: prefixedDbName,
      dbUser: prefixedDbUser,
      dbPassword,
      prefixedDbName,
      prefixedDbUser,
    };
  }

  /**
   * Verify whether the provisioned database exists
   */
  async verifyDatabaseExists(dbName: string): Promise<boolean> {
    try {
      const res = await this.client.execute('Mysql', 'get_database_user', {
        database: dbName,
      });
      return res.status === 1;
    } catch {
      return false;
    }
  }
}
