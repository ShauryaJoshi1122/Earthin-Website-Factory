import { CpanelCredentials, CpanelUapiResponse } from './cpanel-types';

export class CpanelClient {
  private serverUrl: string;
  private username: string;
  private apiToken: string;
  private authType: 'api_token' | 'password';

  constructor(credentials: CpanelCredentials) {
    let url = credentials.serverUrl.trim().replace(/\/+$/, '');
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    // If no port specified, default to 2083 (cPanel SSL)
    if (!url.match(/:\d+$/)) {
      url = `${url}:2083`;
    }
    this.serverUrl = url;
    this.username = credentials.username.trim();
    this.apiToken = credentials.apiToken.trim();
    this.authType = credentials.authType || 'api_token';
  }

  /**
   * Execute cPanel UAPI function
   * Endpoint format: https://server:2083/execute/{Module}/{function}
   */
  async execute<T = any>(
    module: string,
    func: string,
    params: Record<string, string | number | boolean> = {}
  ): Promise<CpanelUapiResponse<T>> {
    const url = new URL(`${this.serverUrl}/execute/${module}/${func}`);

    // Append query params for GET or pass in body for POST
    Object.entries(params).forEach(([key, val]) => {
      url.searchParams.append(key, String(val));
    });

    const authHeader =
      this.authType === 'password'
        ? `Basic ${Buffer.from(`${this.username}:${this.apiToken}`).toString('base64')}`
        : `cpanel ${this.username}:${this.apiToken}`;

    const headers: Record<string, string> = {
      Authorization: authHeader,
      Accept: 'application/json',
      'User-Agent': 'EarthinWebsiteFactory/1.0',
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000); // 35s timeout

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok && response.status === 401) {
        throw new Error(
          `cPanel Authentication Failed (401 Unauthorized). Verify your cPanel username '${this.username}' and ${
            this.authType === 'password' ? 'cPanel password' : 'API token'
          }.`
        );
      }

      if (!response.ok && response.status === 403) {
        throw new Error(
          `cPanel Permission Denied (403 Forbidden). Ensure API Token has permissions for Module '${module}'.`
        );
      }

      const json = (await response.json()) as CpanelUapiResponse<T>;

      if (json.status === 0 || (json.errors && json.errors.length > 0)) {
        const errorMsg = json.errors ? json.errors.join('; ') : 'Unknown cPanel API failure';
        throw new Error(`cPanel UAPI Error [${module}::${func}]: ${errorMsg}`);
      }

      return json;
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error(`cPanel connection timed out reaching ${this.serverUrl} [${module}::${func}].`);
      }
      throw err;
    }
  }

  /**
   * Post multipart data or direct body to cPanel (e.g. for Fileman uploads)
   */
  async executePost<T = any>(
    module: string,
    func: string,
    formData: FormData | Record<string, any>
  ): Promise<CpanelUapiResponse<T>> {
    const url = `${this.serverUrl}/execute/${module}/${func}`;
    const headers: Record<string, string> = {
      Authorization: `cpanel ${this.username}:${this.apiToken}`,
      Accept: 'application/json',
      'User-Agent': 'EarthinWebsiteFactory/1.0',
    };

    let body: any;
    if (formData instanceof FormData) {
      body = formData;
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(formData);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60s for POST

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const json = (await response.json()) as CpanelUapiResponse<T>;
      if (json.status === 0 || (json.errors && json.errors.length > 0)) {
        const errorMsg = json.errors ? json.errors.join('; ') : 'Unknown cPanel API error';
        throw new Error(`cPanel UAPI POST Error [${module}::${func}]: ${errorMsg}`);
      }
      return json;
    } catch (err: any) {
      clearTimeout(timeout);
      throw err;
    }
  }

  getUsername(): string {
    return this.username;
  }

  getServerUrl(): string {
    return this.serverUrl;
  }
}
