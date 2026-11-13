import { NextRequest, NextResponse } from 'next/server';
import { db, deploymentJobs } from '@/db';
import { eq } from 'drizzle-orm';
import { getSessionUser, checkPermission, logAudit } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || !checkPermission(user, 'websites.create')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const jobId = parseInt(id, 10);
  if (isNaN(jobId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    await db
      .update(deploymentJobs)
      .set({
        status: 'cancelled',
        errorMessage: 'Deployment cancelled by operator.',
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(deploymentJobs.id, jobId));

    await logAudit(user.id, 'deployment.cancelled', 'deployment_job', String(jobId));

    return NextResponse.json({ success: true, message: `Deployment #${jobId} cancelled.` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
