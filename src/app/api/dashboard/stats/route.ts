import { NextResponse } from 'next/server';
import { db, websites, hostingConnections, cmsReleases, deploymentJobs, auditLogs } from '@/db';
import { eq, sql, desc } from 'drizzle-orm';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Total websites
    const totalWebsitesRes = await db.select({ count: sql<number>`count(*)` }).from(websites);
    const totalWebsites = Number(totalWebsitesRes[0]?.count || 0);

    // 2. Active websites
    const activeWebsitesRes = await db.select({ count: sql<number>`count(*)` }).from(websites).where(eq(websites.status, 'active'));
    const activeWebsites = Number(activeWebsitesRes[0]?.count || 0);

    // 3. Websites being deployed
    const deployingRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(deploymentJobs)
      .where(eq(deploymentJobs.status, 'running'));
    const deployingCount = Number(deployingRes[0]?.count || 0);

    // 4. Failed deployments
    const failedRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(deploymentJobs)
      .where(eq(deploymentJobs.status, 'failed'));
    const failedCount = Number(failedRes[0]?.count || 0);

    // 5. Connected hosting accounts
    const hostingAccountsRes = await db.select({ count: sql<number>`count(*)` }).from(hostingConnections);
    const hostingCount = Number(hostingAccountsRes[0]?.count || 0);

    // 6. Available CMS releases
    const releasesRes = await db.select({ count: sql<number>`count(*)` }).from(cmsReleases);
    const releasesCount = Number(releasesRes[0]?.count || 0);

    // 7. Recent deployments
    const recentDeployments = await db
      .select({
        id: deploymentJobs.id,
        uuid: deploymentJobs.uuid,
        websiteId: deploymentJobs.websiteId,
        websiteName: websites.name,
        domain: websites.primaryDomain,
        status: deploymentJobs.status,
        progress: deploymentJobs.progressPercentage,
        currentStep: deploymentJobs.currentStepNumber,
        startedAt: deploymentJobs.startedAt,
        completedAt: deploymentJobs.completedAt,
      })
      .from(deploymentJobs)
      .innerJoin(websites, eq(deploymentJobs.websiteId, websites.id))
      .orderBy(desc(deploymentJobs.createdAt))
      .limit(5);

    // 8. Hosting capacity warnings (connections with status !== 'active')
    const degradedHosting = await db
      .select({
        id: hostingConnections.id,
        name: hostingConnections.name,
        serverUrl: hostingConnections.serverUrl,
        status: hostingConnections.status,
        lastError: hostingConnections.lastError,
      })
      .from(hostingConnections)
      .where(eq(hostingConnections.status, 'error'))
      .limit(5);

    return NextResponse.json({
      stats: {
        totalWebsites,
        activeWebsites,
        deployingCount,
        failedCount,
        hostingCount,
        releasesCount,
      },
      recentDeployments,
      degradedHosting,
    });
  } catch (err: any) {
    console.error('Dashboard stats error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch dashboard statistics' }, { status: 500 });
  }
}
