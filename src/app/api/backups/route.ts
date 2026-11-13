import { NextRequest, NextResponse } from 'next/server';
import { BackupService } from '@/services/backup/backup-service';
import { getSessionUser, checkPermission, logAudit } from '@/lib/auth';
import { z } from 'zod';

const backupService = new BackupService();

const createBackupSchema = z.object({
  websiteId: z.number().int(),
  backupType: z.enum(['database', 'full', 'media']).default('database'),
});

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const websiteId = url.searchParams.get('websiteId') ? parseInt(url.searchParams.get('websiteId')!, 10) : undefined;

  try {
    const backups = await backupService.listBackups(websiteId);
    return NextResponse.json({ backups });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !checkPermission(user, 'websites.edit')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = createBackupSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const backup = await backupService.createBackup({
      websiteId: result.data.websiteId,
      backupType: result.data.backupType,
      userId: user.id,
    });

    await logAudit(user.id, 'backup.created', 'backup_record', String(backup.id), {
      websiteId: result.data.websiteId,
      backupType: result.data.backupType,
    });

    return NextResponse.json({ success: true, backup });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
