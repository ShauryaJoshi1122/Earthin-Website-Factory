import { NextRequest, NextResponse } from 'next/server';
import { BackupService } from '@/services/backup/backup-service';
import { getSessionUser, checkPermission, logAudit } from '@/lib/auth';

const backupService = new BackupService();

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || !checkPermission(user, 'websites.edit')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const backupId = parseInt(id, 10);
  if (isNaN(backupId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const res = await backupService.restoreBackup(backupId);
    await logAudit(user.id, 'backup.restored', 'backup_record', String(backupId));
    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
