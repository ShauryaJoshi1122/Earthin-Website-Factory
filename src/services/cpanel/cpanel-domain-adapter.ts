import { CpanelClient } from './cpanel-client';
import { CpanelCredentials, CpanelDomainInfo } from './cpanel-types';
import dns from 'dns/promises';

export class CpanelDomainAdapter {
  private client: CpanelClient;

  constructor(credentials: CpanelCredentials) {
    this.client = new CpanelClient(credentials);
  }

  /**
   * List all configured domains and their corresponding document roots
   */
  async listDomains(): Promise<CpanelDomainInfo[]> {
    const result: CpanelDomainInfo[] = [];

    try {
      const res = await this.client.execute('DomainInfo', 'domains_data', { format: 'hash' });
      const data = res.data;

      if (data) {
        if (data.main_domain) {
          result.push({
            domain: data.main_domain.domain,
            documentRoot: data.main_domain.documentroot || '/public_html',
            domainType: 'main_domain',
            status: 'active',
          });
        }

        if (Array.isArray(data.sub_domains)) {
          data.sub_domains.forEach((item: any) => {
            result.push({
              domain: item.domain,
              documentRoot: item.documentroot || `/public_html/${item.domain}`,
              domainType: 'sub_domain',
              status: 'active',
            });
          });
        }

        if (Array.isArray(data.addon_domains)) {
          data.addon_domains.forEach((item: any) => {
            result.push({
              domain: item.domain,
              documentRoot: item.documentroot || `/public_html/${item.domain}`,
              domainType: 'addon_domain',
              status: 'active',
            });
          });
        }
      }
    } catch {
      // Fallback: list_domains
      const simpleRes = await this.client.execute('DomainInfo', 'list_domains');
      if (simpleRes.data?.main_domain) {
        result.push({
          domain: simpleRes.data.main_domain,
          documentRoot: '/public_html',
          domainType: 'main_domain',
          status: 'active',
        });
      }
    }

    return result;
  }

  /**
   * Check DNS resolution for a domain
   */
  async verifyDnsResolution(domain: string): Promise<{ resolved: boolean; ips: string[]; error?: string }> {
    try {
      const ips = await dns.resolve4(domain);
      return { resolved: ips.length > 0, ips };
    } catch (err: any) {
      return { resolved: false, ips: [], error: err.message };
    }
  }

  /**
   * Check SSL status via cPanel SSL UAPI
   */
  async checkSslStatus(domain: string): Promise<{ hasSsl: boolean; issuer?: string; expires?: string }> {
    try {
      const res = await this.client.execute('SSL', 'installed_hosts');
      if (Array.isArray(res.data)) {
        const match = res.data.find((host: any) =>
          Array.isArray(host.domains) ? host.domains.includes(domain) : false
        );
        if (match && match.certificate) {
          return {
            hasSsl: true,
            issuer: match.certificate.issuer_common_name,
            expires: match.certificate.not_after,
          };
        }
      }
      return { hasSsl: false };
    } catch {
      return { hasSsl: false };
    }
  }
}
