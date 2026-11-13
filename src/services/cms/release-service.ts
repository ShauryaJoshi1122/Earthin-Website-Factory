import { db } from '@/db';
import { cmsReleases, cmsPackages, cmsThemes, cmsPlugins } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import crypto from 'crypto';
import { put } from '@vercel/blob';

export interface RegisterReleaseInput {
  version: string;
  name: string;
  minPhp?: string;
  changelog?: string[];
  isStable?: boolean;
  isDefault?: boolean;
  packageBuffer?: Buffer;
  packageFilename?: string;
}

export class CmsReleaseService {
  /**
   * List all registered CMS releases
   */
  async listReleases() {
    return db.select().from(cmsReleases).orderBy(desc(cmsReleases.releasedAt));
  }

  /**
   * Get default active release
   */
  async getDefaultRelease() {
    const defaultRel = await db.select().from(cmsReleases).where(eq(cmsReleases.isDefault, true)).limit(1);
    if (defaultRel.length > 0) return defaultRel[0];

    const latest = await db.select().from(cmsReleases).where(eq(cmsReleases.isStable, true)).orderBy(desc(cmsReleases.releasedAt)).limit(1);
    return latest[0] || null;
  }

  /**
   * Register a new release and optionally upload package to Vercel Blob
   */
  async registerRelease(input: RegisterReleaseInput) {
    let blobUrl: string | undefined;
    let checksum = '';
    let sizeBytes = 0;

    if (input.packageBuffer) {
      sizeBytes = input.packageBuffer.length;
      checksum = crypto.createHash('sha256').update(input.packageBuffer).digest('hex');

      // Upload to Vercel Blob if token available
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        try {
          const filename = input.packageFilename || `earthin-news-cms-v${input.version}.zip`;
          const blob = await put(`releases/${input.version}/${filename}`, input.packageBuffer, {
            access: 'public',
            addRandomSuffix: false,
          });
          blobUrl = blob.url;
        } catch (err) {
          console.error('Vercel Blob upload warning:', err);
        }
      }
    }

    if (input.isDefault) {
      // Unset previous defaults
      await db.update(cmsReleases).set({ isDefault: false });
    }

    const inserted = await db
      .insert(cmsReleases)
      .values({
        version: input.version,
        name: input.name || 'Earthin News CMS',
        minPhp: input.minPhp || '8.3.0',
        changelog: input.changelog || [],
        isStable: input.isStable !== false,
        isDefault: input.isDefault || false,
        packageSizeBytes: sizeBytes,
        packageChecksumSha256: checksum || null,
        blobPackageUrl: blobUrl || null,
        releasedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: cmsReleases.version,
        set: {
          name: input.name,
          minPhp: input.minPhp || '8.3.0',
          changelog: input.changelog || [],
          isStable: input.isStable !== false,
          isDefault: input.isDefault || false,
          packageSizeBytes: sizeBytes || undefined,
          packageChecksumSha256: checksum || undefined,
          blobPackageUrl: blobUrl || undefined,
        },
      })
      .returning();

    const release = inserted[0];

    if (input.packageBuffer) {
      await db.insert(cmsPackages).values({
        cmsReleaseId: release.id,
        packageType: 'full_cpanel',
        storagePath: blobUrl || `local://releases/${release.version}`,
        blobUrl: blobUrl || null,
        checksumSha256: checksum,
        sizeBytes,
        isVerified: true,
      });
    }

    return release;
  }

  /**
   * List approved themes
   */
  async listThemes() {
    return db.select().from(cmsThemes).where(eq(cmsThemes.isApproved, true));
  }

  /**
   * List approved plugins
   */
  async listPlugins() {
    return db.select().from(cmsPlugins).where(eq(cmsPlugins.isApproved, true));
  }
}
