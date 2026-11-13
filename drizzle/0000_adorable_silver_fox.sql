CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"action" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text,
	"details" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "backup_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"website_id" integer NOT NULL,
	"backup_type" text DEFAULT 'database' NOT NULL,
	"storage_path" text NOT NULL,
	"blob_url" text,
	"size_bytes" bigint NOT NULL,
	"checksum_sha256" text NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"integrity_verified" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_by_user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_packages" (
	"id" serial PRIMARY KEY NOT NULL,
	"cms_release_id" integer NOT NULL,
	"package_type" text DEFAULT 'full_cpanel' NOT NULL,
	"storage_path" text NOT NULL,
	"blob_url" text,
	"checksum_sha256" text NOT NULL,
	"size_bytes" bigint NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_plugins" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"version" text NOT NULL,
	"description" text,
	"category" text DEFAULT 'Editorial',
	"icon" text DEFAULT 'puzzle',
	"min_cms_version" text DEFAULT '1.0.0',
	"required_permissions" jsonb DEFAULT '[]'::jsonb,
	"settings_schema" jsonb,
	"is_approved" boolean DEFAULT true NOT NULL,
	"is_core" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cms_plugins_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "cms_releases" (
	"id" serial PRIMARY KEY NOT NULL,
	"version" text NOT NULL,
	"name" text DEFAULT 'Earthin News CMS' NOT NULL,
	"min_php" text DEFAULT '8.3.0' NOT NULL,
	"changelog" jsonb DEFAULT '[]'::jsonb,
	"is_stable" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"package_size_bytes" bigint DEFAULT 0,
	"package_checksum_sha256" text,
	"blob_package_url" text,
	"released_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cms_releases_version_unique" UNIQUE("version")
);
--> statement-breakpoint
CREATE TABLE "cms_themes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"version" text NOT NULL,
	"description" text,
	"author" text DEFAULT 'Earthin Media Systems',
	"screenshot_url" text,
	"min_cms_version" text DEFAULT '1.0.0',
	"supported_features" jsonb DEFAULT '[]'::jsonb,
	"settings_schema" jsonb,
	"is_approved" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cms_themes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "database_credentials" (
	"id" serial PRIMARY KEY NOT NULL,
	"website_id" integer NOT NULL,
	"db_host" text DEFAULT 'localhost' NOT NULL,
	"db_port" integer DEFAULT 3306 NOT NULL,
	"db_name" text NOT NULL,
	"db_user" text NOT NULL,
	"db_password_encrypted" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "database_credentials_website_id_unique" UNIQUE("website_id")
);
--> statement-breakpoint
CREATE TABLE "deployment_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" text NOT NULL,
	"website_id" integer NOT NULL,
	"hosting_connection_id" integer NOT NULL,
	"cms_release_id" integer,
	"job_type" text DEFAULT 'initial_install' NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"current_step_number" integer DEFAULT 1 NOT NULL,
	"total_steps" integer DEFAULT 28 NOT NULL,
	"progress_percentage" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"triggered_by_user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "deployment_jobs_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE "deployment_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"deployment_job_id" integer NOT NULL,
	"step_number" integer,
	"level" text DEFAULT 'info' NOT NULL,
	"message" text NOT NULL,
	"context" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deployment_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"deployment_job_id" integer NOT NULL,
	"step_number" integer NOT NULL,
	"step_name" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"error_details" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "hosting_capabilities" (
	"id" serial PRIMARY KEY NOT NULL,
	"hosting_connection_id" integer NOT NULL,
	"php_version" text,
	"mysql_version" text,
	"has_mysql_create_db" boolean DEFAULT true,
	"has_mysql_create_user" boolean DEFAULT true,
	"has_fileman" boolean DEFAULT true,
	"has_ssl_support" boolean DEFAULT true,
	"disk_used_mb" integer,
	"disk_total_mb" integer,
	"detected_domains" jsonb,
	"raw_details" jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hosting_capabilities_hosting_connection_id_unique" UNIQUE("hosting_connection_id")
);
--> statement-breakpoint
CREATE TABLE "hosting_connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'internal_cpanel' NOT NULL,
	"server_url" text NOT NULL,
	"username" text NOT NULL,
	"api_token_encrypted" text NOT NULL,
	"auth_type" text DEFAULT 'api_token' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"last_tested_at" timestamp,
	"last_error" text,
	"max_concurrent_deployments" integer DEFAULT 2 NOT NULL,
	"created_by_user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text DEFAULT 'info' NOT NULL,
	"link" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text DEFAULT 'general' NOT NULL,
	CONSTRAINT "permissions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" integer NOT NULL,
	"permission_id" integer NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"group" text DEFAULT 'general' NOT NULL,
	"type" text DEFAULT 'string' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" integer NOT NULL,
	"role_id" integer NOT NULL,
	CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "website_administrators" (
	"id" serial PRIMARY KEY NOT NULL,
	"website_id" integer NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"invitation_token" text,
	"invitation_status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "website_branding" (
	"id" serial PRIMARY KEY NOT NULL,
	"website_id" integer NOT NULL,
	"main_logo_url" text,
	"header_logo_url" text,
	"footer_logo_url" text,
	"favicon_url" text,
	"primary_color" text DEFAULT '#d60000' NOT NULL,
	"secondary_color" text DEFAULT '#0b1120' NOT NULL,
	"header_style" text DEFAULT 'aajtak_broadcast' NOT NULL,
	"footer_style" text DEFAULT 'standard' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "website_branding_website_id_unique" UNIQUE("website_id")
);
--> statement-breakpoint
CREATE TABLE "website_domains" (
	"id" serial PRIMARY KEY NOT NULL,
	"website_id" integer NOT NULL,
	"domain" text NOT NULL,
	"is_primary" boolean DEFAULT true NOT NULL,
	"dns_verified" boolean DEFAULT false NOT NULL,
	"ssl_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "website_plugins" (
	"id" serial PRIMARY KEY NOT NULL,
	"website_id" integer NOT NULL,
	"cms_plugin_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"settings" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "websites" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" text NOT NULL,
	"name" text NOT NULL,
	"title" text NOT NULL,
	"tagline" text,
	"description" text,
	"primary_domain" text NOT NULL,
	"subdomain" text,
	"document_root" text DEFAULT '/public_html' NOT NULL,
	"language" text DEFAULT 'hi' NOT NULL,
	"country" text DEFAULT 'India' NOT NULL,
	"state" text,
	"city" text,
	"contact_email" text NOT NULL,
	"contact_phone" text,
	"address" text,
	"hosting_connection_id" integer NOT NULL,
	"cms_release_id" integer,
	"selected_theme_slug" text DEFAULT 'earthin-samachar',
	"status" text DEFAULT 'draft' NOT NULL,
	"ssl_status" text DEFAULT 'pending' NOT NULL,
	"health_status" text DEFAULT 'healthy' NOT NULL,
	"last_deployed_at" timestamp,
	"created_by_user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "websites_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "websites_primary_domain_unique" UNIQUE("primary_domain")
);
--> statement-breakpoint
CREATE TABLE "workflow_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_id" text NOT NULL,
	"deployment_job_id" integer NOT NULL,
	"state" jsonb,
	"status" text DEFAULT 'running' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workflow_runs_workflow_id_unique" UNIQUE("workflow_id")
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backup_records" ADD CONSTRAINT "backup_records_website_id_websites_id_fk" FOREIGN KEY ("website_id") REFERENCES "public"."websites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backup_records" ADD CONSTRAINT "backup_records_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_packages" ADD CONSTRAINT "cms_packages_cms_release_id_cms_releases_id_fk" FOREIGN KEY ("cms_release_id") REFERENCES "public"."cms_releases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "database_credentials" ADD CONSTRAINT "database_credentials_website_id_websites_id_fk" FOREIGN KEY ("website_id") REFERENCES "public"."websites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployment_jobs" ADD CONSTRAINT "deployment_jobs_website_id_websites_id_fk" FOREIGN KEY ("website_id") REFERENCES "public"."websites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployment_jobs" ADD CONSTRAINT "deployment_jobs_hosting_connection_id_hosting_connections_id_fk" FOREIGN KEY ("hosting_connection_id") REFERENCES "public"."hosting_connections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployment_jobs" ADD CONSTRAINT "deployment_jobs_cms_release_id_cms_releases_id_fk" FOREIGN KEY ("cms_release_id") REFERENCES "public"."cms_releases"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployment_jobs" ADD CONSTRAINT "deployment_jobs_triggered_by_user_id_users_id_fk" FOREIGN KEY ("triggered_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployment_logs" ADD CONSTRAINT "deployment_logs_deployment_job_id_deployment_jobs_id_fk" FOREIGN KEY ("deployment_job_id") REFERENCES "public"."deployment_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployment_steps" ADD CONSTRAINT "deployment_steps_deployment_job_id_deployment_jobs_id_fk" FOREIGN KEY ("deployment_job_id") REFERENCES "public"."deployment_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosting_capabilities" ADD CONSTRAINT "hosting_capabilities_hosting_connection_id_hosting_connections_id_fk" FOREIGN KEY ("hosting_connection_id") REFERENCES "public"."hosting_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosting_connections" ADD CONSTRAINT "hosting_connections_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "website_administrators" ADD CONSTRAINT "website_administrators_website_id_websites_id_fk" FOREIGN KEY ("website_id") REFERENCES "public"."websites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "website_branding" ADD CONSTRAINT "website_branding_website_id_websites_id_fk" FOREIGN KEY ("website_id") REFERENCES "public"."websites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "website_domains" ADD CONSTRAINT "website_domains_website_id_websites_id_fk" FOREIGN KEY ("website_id") REFERENCES "public"."websites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "website_plugins" ADD CONSTRAINT "website_plugins_website_id_websites_id_fk" FOREIGN KEY ("website_id") REFERENCES "public"."websites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "website_plugins" ADD CONSTRAINT "website_plugins_cms_plugin_id_cms_plugins_id_fk" FOREIGN KEY ("cms_plugin_id") REFERENCES "public"."cms_plugins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "websites" ADD CONSTRAINT "websites_hosting_connection_id_hosting_connections_id_fk" FOREIGN KEY ("hosting_connection_id") REFERENCES "public"."hosting_connections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "websites" ADD CONSTRAINT "websites_cms_release_id_cms_releases_id_fk" FOREIGN KEY ("cms_release_id") REFERENCES "public"."cms_releases"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "websites" ADD CONSTRAINT "websites_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_runs" ADD CONSTRAINT "workflow_runs_deployment_job_id_deployment_jobs_id_fk" FOREIGN KEY ("deployment_job_id") REFERENCES "public"."deployment_jobs"("id") ON DELETE cascade ON UPDATE no action;