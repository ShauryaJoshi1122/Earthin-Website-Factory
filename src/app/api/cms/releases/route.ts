import { NextRequest, NextResponse } from 'next/server';
import { CmsReleaseService } from '@/services/cms/release-service';
import { getSessionUser, checkPermission, logAudit } from '@/lib/auth';
import { CONFIG } from '@/lib/config';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

const registerReleaseSchema = z.object({
  version: z.string().min(1),
  name: z.string().default('Earthin News CMS'),
  minPhp: z.string().default('8.3.0'),
  changelog: z.array(z.string()).default([]),
  isStable: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

const service = new CmsReleaseService();

export async function GET() {
  if (!CONFIG.DATABASE_URL) {
    const releaseFile = path.join(process.cwd(), 'existing-cms', 'release.json');
    if (fs.existsSync(releaseFile)) {
      const rel = JSON.parse(fs.readFileSync(releaseFile, 'utf8'));
      return NextResponse.json({
        releases: [
          {
            id: 1,
            version: rel.version || '2.0.0',
            name: rel.name || 'Earthin News CMS',
            minPhp: rel.min_php || '8.3.0',
            changelog: rel.changelog || [],
            isStable: true,
            isDefault: true,
            packageSizeBytes: 26214400,
            releasedAt: rel.released_at || new Date().toISOString(),
          },
        ],
      });
    }
  }

  try {
    const releases = await service.listReleases();
    return NextResponse.json({ releases });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !checkPermission(user, 'cms.manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = registerReleaseSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Validation error: ' + result.error.message }, { status: 400 });
    }

    const release = await service.registerRelease(result.data);
    await logAudit(user.id, 'cms.release_registered', 'cms_release', String(release.id), {
      version: release.version,
    });

    return NextResponse.json({ success: true, release });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
