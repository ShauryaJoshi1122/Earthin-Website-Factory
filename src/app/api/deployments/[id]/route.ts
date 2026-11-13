import { NextRequest, NextResponse } from 'next/server';
import { db, deploymentJobs, deploymentSteps, deploymentLogs, websites, hostingConnections, cmsReleases } from '@/db';
import { eq, asc, desc } from 'drizzle-orm';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const jobId = parseInt(id, 10);
  if (isNaN(jobId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const jobRows = await db
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
      .where(eq(deploymentJobs.id, jobId))
      .limit(1);

    if (jobRows.length === 0) {
      return NextResponse.json({ error: 'Deployment job not found' }, { status: 404 });
    }

    const job = jobRows[0];

    // Fetch all 28 steps
    const steps = await db
      .select()
      .from(deploymentSteps)
      .where(eq(deploymentSteps.deploymentJobId, jobId))
      .orderBy(asc(deploymentSteps.stepNumber));

    // Fetch logs (most recent 100)
    const logs = await db
      .select()
      .from(deploymentLogs)
      .where(eq(deploymentLogs.deploymentJobId, jobId))
      .orderBy(desc(deploymentLogs.createdAt))
      .limit(100);

    return NextResponse.json({
      deployment: job,
      steps,
      logs: logs.reverse(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
