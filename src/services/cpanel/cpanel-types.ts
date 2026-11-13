export interface CpanelCredentials {
  serverUrl: string; // e.g. https://cpanel.earthin.online:2083 or https://123.45.67.89:2083
  username: string; // cPanel account username
  apiToken: string; // cPanel API Token
  authType?: 'api_token' | 'password';
}

export interface CpanelUapiResponse<T = any> {
  status: number; // 1 = success, 0 = failure
  errors: string[] | null;
  messages: string[] | null;
  data: T;
  metadata?: Record<string, any>;
}

export interface CpanelServerCapabilities {
  phpVersion: string;
  mysqlVersion: string;
  hasMysqlCreateDb: boolean;
  hasMysqlCreateUser: boolean;
  hasFileman: boolean;
  hasSslSupport: boolean;
  diskUsedMb?: number;
  diskTotalMb?: number;
  detectedDomains: string[];
  rawDetails?: Record<string, any>;
}

export interface CpanelDomainInfo {
  domain: string;
  documentRoot: string;
  domainType: 'main_domain' | 'sub_domain' | 'addon_domain' | 'parked_domain';
  ipv4?: string;
  status: string;
}

export interface DatabaseProvisionResult {
  dbHost: string;
  dbPort: number;
  dbName: string;
  dbUser: string;
  dbPassword: string;
  prefixedDbName: string;
  prefixedDbUser: string;
}

export interface InstallationManifest {
  installId: string;
  timestamp: number;
  siteUrl: string;
  siteName: string;
  tagline: string;
  contactEmail: string;
  dbConnection: 'mysql' | 'sqlite';
  dbHost: string;
  dbPort: string;
  dbDatabase: string;
  dbUsername: string;
  dbPassword: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  selectedTheme?: string;
  selectedPlugins?: string[];
  branding?: {
    mainLogoUrl?: string;
    headerLogoUrl?: string;
    footerLogoUrl?: string;
    faviconUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    headerStyle?: string;
    footerStyle?: string;
  };
}

export interface InstallationHandoffResult {
  success: boolean;
  installedAt?: string;
  cmsVersion?: string;
  adminEmail?: string;
  loginUrl?: string;
  error?: string;
  httpStatus?: number;
}

export interface VerificationResult {
  homepageReachable: boolean;
  homepageStatus: number;
  adminPageReachable: boolean;
  adminPageStatus: number;
  sslActive: boolean;
  verifiedAt: string;
  details?: Record<string, any>;
}
