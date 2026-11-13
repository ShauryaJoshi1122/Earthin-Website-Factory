import { NextRequest, NextResponse } from 'next/server';
import { db, deploymentJobs, deploymentSteps } from '@/db';
import { eq, and } from 'drizzle-orm';
import { getSessionUser, checkPermission, logAudit } from '@/lib/auth';
import { DeploymentWorkflowEngine } from '@/services/workflow/deployment-workflow';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || !checkPermission(user, 'websites.create')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const jobId = parseInt(id, 10);
  if (isNaN(jobId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const job = (await db.select().from(deploymentJobs).where(eq(deploymentJobs.id, jobId)).limit(1))[0];
    if (!job) return NextResponse.json({ error: 'Deployment job not found' }, { status: 404 });

    // Reset failed step to pending
    await db
      .update(deploymentSteps)
      .set({
        status: 'pending',
        errorDetails: null,
      })
      .where(and(eq(deploymentSteps.deploymentJobId, jobId), eq(deploymentSteps.status, 'failed')));

    await db
      .update(deploymentJobs)
      .set({
        status: 'running',
        errorMessage: null,
        updatedAt: new Date(),
      })
      .where(eq(deploymentJobs.id, jobId));

    await logAudit(user.id, 'deployment.retried', 'deployment_job', String(jobId));

    // Resume durable workflow
    const engine = new DeploymentWorkflowEngine(jobId);
    engine.execute().catch((err) => {
      console.error(`Workflow retry error for job ${jobId}:`, err);
    });

    return NextResponse.json({ success: true, message: `Deployment #${jobId} resumed.` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
