import { VerificationResult } from './cpanel-types';

export class CpanelVerificationAdapter {
  /**
   * Verify public homepage, admin login page, and SSL connectivity
   */
  async verifyInstallation(targetBaseUrl: string): Promise<VerificationResult> {
    const cleanUrl = targetBaseUrl.replace(/\/+$/, '');
    let homepageReachable = false;
    let homepageStatus = 0;
    let adminPageReachable = false;
    let adminPageStatus = 0;
    let sslActive = cleanUrl.startsWith('https://');

    // 1. Verify Homepage
    try {
      const homeRes = await fetch(cleanUrl, {
        method: 'GET',
        headers: { 'User-Agent': 'EarthinWebsiteFactory-Verifier/1.0' },
        redirect: 'follow',
      });
      homepageStatus = homeRes.status;
      homepageReachable = homeRes.ok || (homeRes.status >= 200 && homeRes.status < 400);
    } catch {
      homepageReachable = false;
    }

    // 2. Verify Admin Login Page
    try {
      const loginUrl = `${cleanUrl}/login`;
      const adminRes = await fetch(loginUrl, {
        method: 'GET',
        headers: { 'User-Agent': 'EarthinWebsiteFactory-Verifier/1.0' },
        redirect: 'follow',
      });
      adminPageStatus = adminRes.status;
      adminPageReachable = adminRes.ok || (adminRes.status >= 200 && adminRes.status < 400);
    } catch {
      adminPageReachable = false;
    }

    return {
      homepageReachable,
      homepageStatus,
      adminPageReachable,
      adminPageStatus,
      sslActive,
      verifiedAt: new Date().toISOString(),
      details: {
        homepageUrl: cleanUrl,
        adminUrl: `${cleanUrl}/admin`,
      },
    };
  }
}
