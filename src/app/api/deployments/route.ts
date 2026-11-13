import { NextRequest, NextResponse } from 'next/server';
import { db, deploymentJobs, websites, hostingConnections, cmsReleases } from '@/db';
import { eq, desc } from 'drizzle-orm';
import { getSessionUser, checkPermission, logAudit } from '@/lib/auth';
import { DeploymentWorkflowEngine } from '@/services/workflow/deployment-workflow';
import { generateUuid } from '@/lib/crypto';
import { z } from 'zod';

const createDeploymentSchema = z.object({
  websiteId: z.number().int(),
  jobType: z.enum(['initial_install', 'update', 'reinstall', 'backup_restore']).default('initial_install'),
});

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ deployments: [] });
  }

  try {
    const list = await db
      .select({
        id: deploymentJobs.id,
        uuid: deploymentJobs.uuid,
        websiteId: deploymentJobs.websiteId,
        websiteName: websites.name,
        domain: websites.primaryDomain,
        hostingName: hostingConnections.name,
        cmsVersion: cmsReleases.version,
        jobType: deploymentJobs.jobType,
        status: deploymentJobs.status,
        currentStepNumber: deploymentJobs.currentStepNumber,
        totalSteps: deploymentJobs.totalSteps,
        progressPercentage: deploymentJobs.progressPercentage,
        errorMessage: deploymentJobs.errorMessage,
        startedAt: deploymentJobs.startedAt,
        completedAt: deploymentJobs.completedAt,
        createdAt: deploymentJobs.createdAt,
      })
      .from(deploymentJobs)
      .innerJoin(websites, eq(deploymentJobs.websiteId, websites.id))
      .innerJoin(hostingConnections, eq(deploymentJobs.hostingConnectionId, hostingConnections.id))
      .leftJoin(cmsReleases, eq(deploymentJobs.cmsReleaseId, cmsReleases.id))
      .orderBy(desc(deploymentJobs.createdAt));

    return NextResponse.json({ deployments: list });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !checkPermission(user, 'websites.create')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = createDeploymentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { websiteId, jobType } = result.data;

    const websiteRows = await db.select().from(websites).where(eq(websites.id, websiteId)).limit(1);
    if (!websiteRows.length) return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    const website = websiteRows[0];

    const defaultRelease = (await db.select().from(cmsReleases).where(eq(cmsReleases.isDefault, true)).limit(1))[0];

    const jobUuid = generateUuid();
    const insertedJobs = await db
      .insert(deploymentJobs)
      .values({
        uuid: jobUuid,
        websiteId: website.id,
        hostingConnectionId: website.hostingConnectionId,
        cmsReleaseId: defaultRelease?.id || null,
        jobType,
        status: 'running',
        currentStepNumber: 1,
        totalSteps: 28,
        progressPercentage: 0,
        startedAt: new Date(),
        triggeredByUserId: user.id,
      })
      .returning();

    const job = insertedJobs[0];

    await logAudit(user.id, 'deployment.started', 'deployment_job', String(job.id), {
      websiteId,
      jobType,
    });

    // Execute durable workflow in background
    const engine = new DeploymentWorkflowEngine(job.id);
    engine.execute().catch((err) => {
      console.error(`Execution error for job ${job.id}:`, err);
    });

    return NextResponse.json({
      success: true,
      deployment: {
        id: job.id,
        uuid: job.uuid,
        status: job.status,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
