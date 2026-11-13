import { InstallationManifest, InstallationHandoffResult } from './cpanel-types';
import { signPayload } from '@/lib/crypto';

export class CpanelInstallationAdapter {
  /**
   * Execute the automated, signed installation handoff to the deployed CMS
   */
  async executeInstallationHandoff(
    targetBaseUrl: string,
    manifest: InstallationManifest
  ): Promise<InstallationHandoffResult> {
    const cleanUrl = targetBaseUrl.replace(/\/+$/, '');
    const endpoint = `${cleanUrl}/install/factory-deploy`;

    const signature = signPayload(manifest);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 95000); // 95s timeout for migrations + seeding

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Earthin-Signature': signature,
          'X-Earthin-Timestamp': String(manifest.timestamp),
          'X-Earthin-Install-Id': manifest.installId,
          'User-Agent': 'EarthinWebsiteFactory-Installer/1.0',
        },
        body: JSON.stringify(manifest),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg =
          json?.error ||
          json?.message ||
          `CMS installation endpoint returned HTTP ${response.status} ${response.statusText}`;
        return {
          success: false,
          error: errorMsg,
          httpStatus: response.status,
        };
      }

      if (json && json.success) {
        return {
          success: true,
          installedAt: json.installed_at || new Date().toISOString(),
          cmsVersion: json.cms_version || '2.0.0',
          adminEmail: manifest.adminEmail,
          loginUrl: `${cleanUrl}/login`,
          httpStatus: response.status,
        };
      }

      return {
        success: false,
        error: json?.error || 'Installation handoff did not return success status.',
        httpStatus: response.status,
      };
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        return {
          success: false,
          error: `CMS installation handoff timed out after 95 seconds on ${endpoint}. Check server logs.`,
          httpStatus: 504,
        };
      }
      return {
        success: false,
        error: `Failed to reach CMS installation endpoint: ${err.message}`,
        httpStatus: 500,
      };
    }
  }
}
