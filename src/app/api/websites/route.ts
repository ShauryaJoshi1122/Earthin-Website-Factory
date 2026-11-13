import { NextRequest, NextResponse } from 'next/server';
import {
  db,
  websites,
  websiteDomains,
  websiteBranding,
  websiteAdministrators,
  websitePlugins,
  cmsPlugins,
  hostingConnections,
  deploymentJobs,
  cmsReleases,
} from '@/db';
import { eq, desc, sql } from 'drizzle-orm';
import { getSessionUser, checkPermission, logAudit } from '@/lib/auth';
import { DeploymentWorkflowEngine } from '@/services/workflow/deployment-workflow';
import { generateUuid } from '@/lib/crypto';
import { z } from 'zod';

const createWebsiteSchema = z.object({
  name: z.string().min(2),
  title: z.string().min(2),
  tagline: z.string().optional(),
  description: z.string().optional(),
  language: z.string().default('hi'),
  country: z.string().default('India'),
  state: z.string().optional(),
  city: z.string().optional(),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),

  // Branding
  mainLogoUrl: z.string().optional(),
  headerLogoUrl: z.string().optional(),
  footerLogoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
  primaryColor: z.string().default('#d60000'),
  secondaryColor: z.string().default('#0b1120'),
  headerStyle: z.string().default('aajtak_broadcast'),
  footerStyle: z.string().default('standard'),

  // Hosting & Domain
  hostingConnectionId: z.number().int(),
  primaryDomain: z.string().min(3),
  subdomain: z.string().optional(),
  documentRoot: z.string().default('/public_html'),

  // Theme & Plugins
  selectedThemeSlug: z.string().default('earthin-samachar'),
  selectedPluginSlugs: z.array(z.string()).default([]),

  // Administrator
  adminName: z.string().min(2),
  adminEmail: z.string().email(),
});

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const search = url.searchParams.get('q') || '';

  try {
    const list = await db
      .select({
        id: websites.id,
        uuid: websites.uuid,
        name: websites.name,
        title: websites.title,
        primaryDomain: websites.primaryDomain,
        status: websites.status,
        sslStatus: websites.sslStatus,
        selectedThemeSlug: websites.selectedThemeSlug,
        lastDeployedAt: websites.lastDeployedAt,
        createdAt: websites.createdAt,
        hostingName: hostingConnections.name,
        hostingType: hostingConnections.type,
        mainLogoUrl: websiteBranding.mainLogoUrl,
      })
      .from(websites)
      .leftJoin(hostingConnections, eq(websites.hostingConnectionId, hostingConnections.id))
      .leftJoin(websiteBranding, eq(websites.id, websiteBranding.websiteId))
      .orderBy(desc(websites.createdAt));

    return NextResponse.json({ websites: list });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !checkPermission(user, 'websites.create')) {
    return NextResponse.json({ error: 'Forbidden: Insufficient permissions to create website.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = createWebsiteSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Validation error: ' + result.error.message }, { status: 400 });
    }

    const data = result.data;

    // Check duplicate domain
    const existing = await db.select().from(websites).where(eq(websites.primaryDomain, data.primaryDomain.toLowerCase())).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: `Domain ${data.primaryDomain} is already registered to website '${existing[0].name}'.` }, { status: 409 });
    }

    // Default CMS release
    const defaultRelease = (await db.select().from(cmsReleases).where(eq(cmsReleases.isDefault, true)).limit(1))[0];

    // 1. Create Website
    const websiteUuid = generateUuid();
    const insertedWebsites = await db
      .insert(websites)
      .values({
        uuid: websiteUuid,
        name: data.name,
        title: data.title,
        tagline: data.tagline,
        description: data.description,
        primaryDomain: data.primaryDomain.toLowerCase(),
        subdomain: data.subdomain,
        documentRoot: data.documentRoot || '/public_html',
        language: data.language,
        country: data.country,
        state: data.state,
        city: data.city,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        address: data.address,
        hostingConnectionId: data.hostingConnectionId,
        cmsReleaseId: defaultRelease?.id || null,
        selectedThemeSlug: data.selectedThemeSlug,
        status: 'provisioning',
        createdByUserId: user.id,
      })
      .returning();

    const website = insertedWebsites[0];

    // 2. Create Domain record
    await db.insert(websiteDomains).values({
      websiteId: website.id,
      domain: data.primaryDomain.toLowerCase(),
      isPrimary: true,
      dnsVerified: false,
      sslVerified: false,
    });

    // 3. Create Branding record
    await db.insert(websiteBranding).values({
      websiteId: website.id,
      mainLogoUrl: data.mainLogoUrl,
      headerLogoUrl: data.headerLogoUrl,
      footerLogoUrl: data.footerLogoUrl,
      faviconUrl: data.faviconUrl,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      headerStyle: data.headerStyle,
      footerStyle: data.footerStyle,
    });

    // 4. Create Initial Administrator record
    await db.insert(websiteAdministrators).values({
      websiteId: website.id,
      name: data.adminName,
      email: data.adminEmail,
      invitationStatus: 'pending',
    });

    // 5. Connect approved plugins
    if (data.selectedPluginSlugs.length > 0) {
      for (const slug of data.selectedPluginSlugs) {
        const pluginRow = (await db.select().from(cmsPlugins).where(eq(cmsPlugins.slug, slug)).limit(1))[0];
        if (pluginRow) {
          await db.insert(websitePlugins).values({
            websiteId: website.id,
            cmsPluginId: pluginRow.id,
            isActive: true,
          });
        }
      }
    }

    // 6. Create Deployment Job
    const jobUuid = generateUuid();
    const insertedJobs = await db
      .insert(deploymentJobs)
      .values({
        uuid: jobUuid,
        websiteId: website.id,
        hostingConnectionId: data.hostingConnectionId,
        cmsReleaseId: defaultRelease?.id || null,
        jobType: 'initial_install',
        status: 'running',
        currentStepNumber: 1,
        totalSteps: 28,
        progressPercentage: 0,
        startedAt: new Date(),
        triggeredByUserId: user.id,
      })
      .returning();

    const job = insertedJobs[0];

    await logAudit(user.id, 'website.created', 'website', String(website.id), {
      name: website.name,
      domain: website.primaryDomain,
      jobId: job.id,
    });

    // 7. Trigger the Durable Deployment Workflow asynchronously in background
    const engine = new DeploymentWorkflowEngine(job.id);
    engine.execute().catch((err) => {
      console.error(`Workflow execution error for job ${job.id}:`, err);
    });

    return NextResponse.json({
      success: true,
      website: {
        id: website.id,
        uuid: website.uuid,
        name: website.name,
        domain: website.primaryDomain,
        status: website.status,
      },
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
