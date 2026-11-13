/**
 * Central Application Configuration with Zero-Config Vercel Fallbacks
 * 
 * Ensures that when deploying to Vercel or any environment, the application
 * immediately connects to the provisioned Neon PostgreSQL database,
 * Neon Object Storage, and Neon Realtime without requiring manual dashboard inputs.
 */

export const CONFIG = {
  // Database (Neon PostgreSQL)
  DATABASE_URL:
    process.env.DATABASE_URL ||
    'postgresql://neondb_owner:npg_FfZ4wkOp0VKY@ep-sweet-base-ber7hyx1-pooler.c-9.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require',
  DATABASE_URL_UNPOOLED:
    process.env.DATABASE_URL_UNPOOLED ||
    'postgresql://neondb_owner:npg_FfZ4wkOp0VKY@ep-sweet-base-ber7hyx1.c-9.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require',

  // Object Storage (Neon S3-Compatible)
  AWS_ENDPOINT_URL_S3:
    process.env.AWS_ENDPOINT_URL_S3 ||
    'https://br-lucky-art-beu1ddof.storage.c-9.us-east-2.aws.neon.tech',
  AWS_ACCESS_KEY_ID:
    process.env.AWS_ACCESS_KEY_ID ||
    'nak_live_f6dd1bba7e2f4e1aa91baec97cc1f0a3',
  AWS_SECRET_ACCESS_KEY:
    process.env.AWS_SECRET_ACCESS_KEY ||
    'nsk_live_ee4c7bfd283064d731fdd9c4232f145d31365c806fab3db1209c12d738655ff1',
  AWS_REGION: process.env.AWS_REGION || 'us-east-2',
  STORAGE_BUCKET: 'assets',

  // Realtime (Neon Realtime WebSocket)
  NEON_REALTIME_URL:
    process.env.NEON_REALTIME_URL ||
    'wss://ep-sweet-base-ber7hyx1.rt.c-9.us-east-2.aws.neon.tech/',
  NEON_REALTIME_SECRET:
    process.env.NEON_REALTIME_SECRET ||
    'nrt_live_1IPANl7QP6MzTS8i4dknio9c-7qAk_Qf-Fwr_jKJuQFc',

  // Security & Authentication
  AUTH_SECRET:
    process.env.AUTH_SECRET ||
    'earthin_factory_dev_secret_replace_in_production_32chars!',
  ENCRYPTION_KEY:
    process.env.ENCRYPTION_KEY ||
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  DEPLOYMENT_SIGNING_KEY:
    process.env.DEPLOYMENT_SIGNING_KEY ||
    'earthin_manifest_signing_key_secret_2026',

  // App Metadata & Host
  APP_URL:
    process.env.APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'),
  APP_ENV: process.env.NODE_ENV || 'production',
};
