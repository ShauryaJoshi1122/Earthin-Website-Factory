import { NextRequest, NextResponse } from 'next/server';
import { CmsReleaseService } from '@/services/cms/release-service';
import { getSessionUser, checkPermission, logAudit } from '@/lib/auth';
import { z } from 'zod';

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
