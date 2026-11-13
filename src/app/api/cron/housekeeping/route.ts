import { NextRequest, NextResponse } from 'next/server';
import { db, deploymentJobs, hostingConnections } from '@/db';
import { eq, and, lt } from 'drizzle-orm';
import { logAudit } from '@/lib/auth';

export async function GET(req: NextRequest) {
  // Check authorization header for Vercel Cron
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Reconcile stalled deployment jobs (running > 2 hours)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const stalledJobs = await db
      .update(deploymentJobs)
      .set({
        status: 'failed',
        errorMessage: 'Deployment timed out after 2 hours without step progression.',
        updatedAt: new Date(),
      })
      .where(and(eq(deploymentJobs.status, 'running'), lt(deploymentJobs.startedAt, twoHoursAgo)))
      .returning();

    await logAudit(null, 'cron.housekeeping', 'system', undefined, {
      reconciledStalledJobs: stalledJobs.length,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      reconciledJobs: stalledJobs.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

