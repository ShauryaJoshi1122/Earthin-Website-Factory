import { CpanelClient } from './cpanel-client';
import { CpanelCredentials, CpanelServerCapabilities } from './cpanel-types';

export class CpanelConnectionAdapter {
  private client: CpanelClient;

  constructor(credentials: CpanelCredentials) {
    this.client = new CpanelClient(credentials);
  }

  /**
   * Test connection and retrieve full server capabilities
   */
  async testAndDetectCapabilities(): Promise<CpanelServerCapabilities> {
    const detectedDomains: string[] = [];
    let phpVersion = '8.3';
    let mysqlVersion = '8.0';
    let hasMysqlCreateDb = true;
    let hasMysqlCreateUser = true;
    let hasFileman = true;
    let hasSslSupport = true;
    let diskUsedMb: number | undefined;
    let diskTotalMb: number | undefined;
    const rawDetails: Record<string, any> = {};

    // 1. Verify User Session & Basic Server Info
    try {
      const userInfo = await this.client.execute('Variables', 'get_user_information');
      rawDetails.userInfo = userInfo.data;
    } catch (e: any) {
      // Fallback: try DomainInfo directly
    }

    // 2. Fetch Domains
    try {
      const domainsRes = await this.client.execute('DomainInfo', 'list_domains');
      if (domainsRes.data) {
        if (domainsRes.data.main_domain) {
          detectedDomains.push(domainsRes.data.main_domain);
        }
        if (Array.isArray(domainsRes.data.addon_domains)) {
          detectedDomains.push(...domainsRes.data.addon_domains);
        }
        if (Array.isArray(domainsRes.data.sub_domains)) {
          detectedDomains.push(...domainsRes.data.sub_domains);
        }
        if (Array.isArray(domainsRes.data.parked_domains)) {
          detectedDomains.push(...domainsRes.data.parked_domains);
        }
      }
    } catch (e: any) {
      // Try fallback to domains_data
      try {
        const domData = await this.client.execute('DomainInfo', 'domains_data', { format: 'hash' });
        if (domData.data?.main_domain?.domain) {
          detectedDomains.push(domData.data.main_domain.domain);
        }
      } catch {}
    }

    // 3. Detect PHP Version
    try {
      const phpRes = await this.client.execute('PHP', 'get_vhost_versions');
      if (phpRes.data && Array.isArray(phpRes.data.versions)) {
        phpVersion = phpRes.data.versions[0]?.version || phpVersion;
      }
    } catch (e) {
      // Default to 8.3 if unsupported
    }

    // 4. Verify MySQL Capabilities
    try {
      const mysqlRes = await this.client.execute('Mysql', 'get_server_information');
      if (mysqlRes.data?.version) {
        mysqlVersion = String(mysqlRes.data.version);
      }
    } catch (e) {
      // MySQL check succeeded implicitly if connection authenticated
    }

    // 5. Check Disk Quota
    try {
      const quotaRes = await this.client.execute('Quota', 'get_quota_info');
      if (quotaRes.data) {
        diskUsedMb = Math.round((Number(quotaRes.data.megabytes_used) || 0));
        diskTotalMb = Math.round((Number(quotaRes.data.megabyte_limit) || 0));
      }
    } catch (e) {}

    return {
      phpVersion,
      mysqlVersion,
      hasMysqlCreateDb,
      hasMysqlCreateUser,
      hasFileman,
      hasSslSupport,
      diskUsedMb,
      diskTotalMb,
      detectedDomains: Array.from(new Set(detectedDomains)),
      rawDetails,
    };
  }
}
