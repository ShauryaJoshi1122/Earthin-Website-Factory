import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  integer,
  bigint,
  jsonb,
  primaryKey,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ==========================================
// 1. USERS & AUTHENTICATION
// ==========================================
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  status: text('status').notNull().default('active'), // active, suspended, pending
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at'),
});

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(), // SUPER_ADMIN, ADMIN, WEBSITE_OPERATOR, VIEWER
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull().default('general'),
});

export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: integer('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: integer('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permissionId] })]
);

export const userRoles = pgTable(
  'user_roles',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: integer('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.roleId] })]
);

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(), // token hash or secure session id
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 2. HOSTING CONNECTIONS & CAPABILITIES
// ==========================================
export const hostingConnections = pgTable('hosting_connections', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull().default('internal_cpanel'), // internal_cpanel, external_cpanel
  serverUrl: text('server_url').notNull(), // https://cpanel.domain.com:2083
  username: text('username').notNull(),
  apiTokenEncrypted: text('api_token_encrypted').notNull(),
  authType: text('auth_type').notNull().default('api_token'), // api_token, password
  status: text('status').notNull().default('active'), // active, degraded, disconnected, error
  lastTestedAt: timestamp('last_tested_at'),
  lastError: text('last_error'),
  maxConcurrentDeployments: integer('max_concurrent_deployments').notNull().default(2),
  createdByUserId: integer('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const hostingCapabilities = pgTable('hosting_capabilities', {
  id: serial('id').primaryKey(),
  hostingConnectionId: integer('hosting_connection_id')
    .notNull()
    .unique()
    .references(() => hostingConnections.id, { onDelete: 'cascade' }),
  phpVersion: text('php_version'),
  mysqlVersion: text('mysql_version'),
  hasMysqlCreateDb: boolean('has_mysql_create_db').default(true),
  hasMysqlCreateUser: boolean('has_mysql_create_user').default(true),
  hasFileman: boolean('has_fileman').default(true),
  hasSslSupport: boolean('has_ssl_support').default(true),
  diskUsedMb: integer('disk_used_mb'),
  diskTotalMb: integer('disk_total_mb'),
  detectedDomains: jsonb('detected_domains').$type<string[]>(),
  rawDetails: jsonb('raw_details'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ==========================================
// 3. CMS RELEASES, THEMES & PLUGINS
// ==========================================
export const cmsReleases = pgTable('cms_releases', {
  id: serial('id').primaryKey(),
  version: text('version').notNull().unique(), // e.g. '2.0.0'
  name: text('name').notNull().default('Earthin News CMS'),
  minPhp: text('min_php').notNull().default('8.3.0'),
  changelog: jsonb('changelog').$type<string[]>().default([]),
  isStable: boolean('is_stable').default(true).notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  packageSizeBytes: bigint('package_size_bytes', { mode: 'number' }).default(0),
  packageChecksumSha256: text('package_checksum_sha256'),
  blobPackageUrl: text('blob_package_url'),
  releasedAt: timestamp('released_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const cmsPackages = pgTable('cms_packages', {
  id: serial('id').primaryKey(),
  cmsReleaseId: integer('cms_release_id')
    .notNull()
    .references(() => cmsReleases.id, { onDelete: 'cascade' }),
  packageType: text('package_type').notNull().default('full_cpanel'), // full_cpanel, upgrade_patch
  storagePath: text('storage_path').notNull(),
  blobUrl: text('blob_url'),
  checksumSha256: text('checksum_sha256').notNull(),
  sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
  isVerified: boolean('is_verified').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const cmsThemes = pgTable('cms_themes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(), // e.g. earthin-samachar
  version: text('version').notNull(),
  description: text('description'),
  author: text('author').default('Earthin Media Systems'),
  screenshotUrl: text('screenshot_url'),
  minCmsVersion: text('min_cms_version').default('1.0.0'),
  supportedFeatures: jsonb('supported_features').$type<string[]>().default([]),
  settingsSchema: jsonb('settings_schema'),
  isApproved: boolean('is_approved').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const cmsPlugins = pgTable('cms_plugins', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(), // e.g. live-tv, breaking-news-broadcaster
  version: text('version').notNull(),
  description: text('description'),
  category: text('category').default('Editorial'),
  icon: text('icon').default('puzzle'),
  minCmsVersion: text('min_cms_version').default('1.0.0'),
  requiredPermissions: jsonb('required_permissions').$type<string[]>().default([]),
  settingsSchema: jsonb('settings_schema'),
  isApproved: boolean('is_approved').default(true).notNull(),
  isCore: boolean('is_core').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 4. WEBSITES & CONFIGURATION
// ==========================================
export const websites = pgTable('websites', {
  id: serial('id').primaryKey(),
  uuid: text('uuid').notNull().unique(),
  name: text('name').notNull(),
  title: text('title').notNull(),
  tagline: text('tagline'),
  description: text('description'),
  primaryDomain: text('primary_domain').notNull().unique(),
  subdomain: text('subdomain'),
  documentRoot: text('document_root').notNull().default('/public_html'),
  language: text('language').notNull().default('hi'),
  country: text('country').notNull().default('India'),
  state: text('state'),
  city: text('city'),
  contactEmail: text('contact_email').notNull(),
  contactPhone: text('contact_phone'),
  address: text('address'),
  hostingConnectionId: integer('hosting_connection_id')
    .notNull()
    .references(() => hostingConnections.id, { onDelete: 'restrict' }),
  cmsReleaseId: integer('cms_release_id').references(() => cmsReleases.id, { onDelete: 'set null' }),
  selectedThemeSlug: text('selected_theme_slug').default('earthin-samachar'),
  status: text('status').notNull().default('draft'), // draft, provisioning, active, failed, disabled
  sslStatus: text('ssl_status').notNull().default('pending'), // pending, active, expired, failed
  healthStatus: text('health_status').notNull().default('healthy'), // healthy, degraded, offline
  lastDeployedAt: timestamp('last_deployed_at'),
  createdByUserId: integer('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const websiteDomains = pgTable('website_domains', {
  id: serial('id').primaryKey(),
  websiteId: integer('website_id')
    .notNull()
    .references(() => websites.id, { onDelete: 'cascade' }),
  domain: text('domain').notNull(),
  isPrimary: boolean('is_primary').default(true).notNull(),
  dnsVerified: boolean('dns_verified').default(false).notNull(),
  sslVerified: boolean('ssl_verified').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const websiteBranding = pgTable('website_branding', {
  id: serial('id').primaryKey(),
  websiteId: integer('website_id')
    .notNull()
    .unique()
    .references(() => websites.id, { onDelete: 'cascade' }),
  mainLogoUrl: text('main_logo_url'),
  headerLogoUrl: text('header_logo_url'),
  footerLogoUrl: text('footer_logo_url'),
  faviconUrl: text('favicon_url'),
  primaryColor: text('primary_color').notNull().default('#d60000'),
  secondaryColor: text('secondary_color').notNull().default('#0b1120'),
  headerStyle: text('header_style').notNull().default('aajtak_broadcast'),
  footerStyle: text('footer_style').notNull().default('standard'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const websiteAdministrators = pgTable('website_administrators', {
  id: serial('id').primaryKey(),
  websiteId: integer('website_id')
    .notNull()
    .references(() => websites.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  invitationToken: text('invitation_token'),
  invitationStatus: text('invitation_status').notNull().default('pending'), // pending, accepted, expired
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const websitePlugins = pgTable('website_plugins', {
  id: serial('id').primaryKey(),
  websiteId: integer('website_id')
    .notNull()
    .references(() => websites.id, { onDelete: 'cascade' }),
  cmsPluginId: integer('cms_plugin_id')
    .notNull()
    .references(() => cmsPlugins.id, { onDelete: 'cascade' }),
  isActive: boolean('is_active').default(true).notNull(),
  settings: jsonb('settings'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const databaseCredentials = pgTable('database_credentials', {
  id: serial('id').primaryKey(),
  websiteId: integer('website_id')
    .notNull()
    .unique()
    .references(() => websites.id, { onDelete: 'cascade' }),
  dbHost: text('db_host').notNull().default('localhost'),
  dbPort: integer('db_port').notNull().default(3306),
  dbName: text('db_name').notNull(),
  dbUser: text('db_user').notNull(),
  dbPasswordEncrypted: text('db_password_encrypted').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ==========================================
// 5. DEPLOYMENT JOBS, STEPS & LOGS
// ==========================================
export const deploymentJobs = pgTable('deployment_jobs', {
  id: serial('id').primaryKey(),
  uuid: text('uuid').notNull().unique(),
  websiteId: integer('website_id')
    .notNull()
    .references(() => websites.id, { onDelete: 'cascade' }),
  hostingConnectionId: integer('hosting_connection_id')
    .notNull()
    .references(() => hostingConnections.id, { onDelete: 'restrict' }),
  cmsReleaseId: integer('cms_release_id').references(() => cmsReleases.id, { onDelete: 'set null' }),
  jobType: text('job_type').notNull().default('initial_install'), // initial_install, update, reinstall, backup_restore
  status: text('status').notNull().default('queued'), // queued, running, completed, failed, cancelled
  currentStepNumber: integer('current_step_number').notNull().default(1),
  totalSteps: integer('total_steps').notNull().default(28),
  progressPercentage: integer('progress_percentage').notNull().default(0),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  triggeredByUserId: integer('triggered_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const deploymentSteps = pgTable('deployment_steps', {
  id: serial('id').primaryKey(),
  deploymentJobId: integer('deployment_job_id')
    .notNull()
    .references(() => deploymentJobs.id, { onDelete: 'cascade' }),
  stepNumber: integer('step_number').notNull(),
  stepName: text('step_name').notNull(),
  status: text('status').notNull().default('pending'), // pending, running, completed, failed, skipped
  attemptCount: integer('attempt_count').notNull().default(0),
  maxAttempts: integer('max_attempts').notNull().default(3),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  errorDetails: text('error_details'),
  metadata: jsonb('metadata'),
});

export const deploymentLogs = pgTable('deployment_logs', {
  id: serial('id').primaryKey(),
  deploymentJobId: integer('deployment_job_id')
    .notNull()
    .references(() => deploymentJobs.id, { onDelete: 'cascade' }),
  stepNumber: integer('step_number'),
  level: text('level').notNull().default('info'), // info, warn, error, debug
  message: text('message').notNull(),
  context: jsonb('context'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const workflowRuns = pgTable('workflow_runs', {
  id: serial('id').primaryKey(),
  workflowId: text('workflow_id').notNull().unique(),
  deploymentJobId: integer('deployment_job_id')
    .notNull()
    .references(() => deploymentJobs.id, { onDelete: 'cascade' }),
  state: jsonb('state'),
  status: text('status').notNull().default('running'), // running, paused, completed, failed
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ==========================================
// 6. BACKUPS, AUDIT LOGS, NOTIFICATIONS & SETTINGS
// ==========================================
export const backupRecords = pgTable('backup_records', {
  id: serial('id').primaryKey(),
  websiteId: integer('website_id')
    .notNull()
    .references(() => websites.id, { onDelete: 'cascade' }),
  backupType: text('backup_type').notNull().default('database'), // database, full, media
  storagePath: text('storage_path').notNull(),
  blobUrl: text('blob_url'),
  sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
  checksumSha256: text('checksum_sha256').notNull(),
  status: text('status').notNull().default('completed'), // pending, completed, failed, restored
  integrityVerified: boolean('integrity_verified').default(false).notNull(),
  metadata: jsonb('metadata'),
  createdByUserId: integer('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  resourceType: text('resource_type').notNull(),
  resourceId: text('resource_id'),
  details: jsonb('details'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }), // null = broadcast
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull().default('info'), // info, success, warning, error
  link: text('link'),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const systemSettings = pgTable('system_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  group: text('group').notNull().default('general'),
  type: text('type').notNull().default('string'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ==========================================
// DRIZZLE RELATIONS DEFINITIONS
// ==========================================
export const usersRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
  sessions: many(sessions),
  auditLogs: many(auditLogs),
  notifications: many(notifications),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  userRoles: many(userRoles),
}));

export const hostingConnectionsRelations = relations(hostingConnections, ({ one, many }) => ({
  capabilities: one(hostingCapabilities, {
    fields: [hostingConnections.id],
    references: [hostingCapabilities.hostingConnectionId],
  }),
  websites: many(websites),
  deploymentJobs: many(deploymentJobs),
}));

export const websitesRelations = relations(websites, ({ one, many }) => ({
  hostingConnection: one(hostingConnections, {
    fields: [websites.hostingConnectionId],
    references: [hostingConnections.id],
  }),
  cmsRelease: one(cmsReleases, {
    fields: [websites.cmsReleaseId],
    references: [cmsReleases.id],
  }),
  branding: one(websiteBranding, {
    fields: [websites.id],
    references: [websiteBranding.websiteId],
  }),
  domains: many(websiteDomains),
  administrators: many(websiteAdministrators),
  plugins: many(websitePlugins),
  databaseCredentials: one(databaseCredentials, {
    fields: [websites.id],
    references: [databaseCredentials.websiteId],
  }),
  deploymentJobs: many(deploymentJobs),
  backups: many(backupRecords),
}));

export const deploymentJobsRelations = relations(deploymentJobs, ({ one, many }) => ({
  website: one(websites, {
    fields: [deploymentJobs.websiteId],
    references: [websites.id],
  }),
  hostingConnection: one(hostingConnections, {
    fields: [deploymentJobs.hostingConnectionId],
    references: [hostingConnections.id],
  }),
  cmsRelease: one(cmsReleases, {
    fields: [deploymentJobs.cmsReleaseId],
    references: [cmsReleases.id],
  }),
  steps: many(deploymentSteps),
  logs: many(deploymentLogs),
}));
