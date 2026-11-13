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
  backupRecords,
  databaseCredentials,
} from '@/db';
import { eq, desc } from 'drizzle-orm';
import { getSessionUser, checkPermission, logAudit } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const websiteId = parseInt(id, 10);
  if (isNaN(websiteId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const websiteRows = await db
      .select({
        id: websites.id,
        uuid: websites.uuid,
        name: websites.name,
        title: websites.title,
        tagline: websites.tagline,
        description: websites.description,
        primaryDomain: websites.primaryDomain,
        subdomain: websites.subdomain,
        documentRoot: websites.documentRoot,
        language: websites.language,
        country: websites.country,
        state: websites.state,
        city: websites.city,
        contactEmail: websites.contactEmail,
        contactPhone: websites.contactPhone,
        address: websites.address,
        status: websites.status,
        sslStatus: websites.sslStatus,
        healthStatus: websites.healthStatus,
        selectedThemeSlug: websites.selectedThemeSlug,
        lastDeployedAt: websites.lastDeployedAt,
        createdAt: websites.createdAt,
        updatedAt: websites.updatedAt,
        hostingConnectionId: websites.hostingConnectionId,
        hostingName: hostingConnections.name,
        hostingServerUrl: hostingConnections.serverUrl,
        hostingUsername: hostingConnections.username,
      })
      .from(websites)
      .leftJoin(hostingConnections, eq(websites.hostingConnectionId, hostingConnections.id))
      .where(eq(websites.id, websiteId))
      .limit(1);

    if (websiteRows.length === 0) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    const website = websiteRows[0];

    // Fetch branding
    const branding = (await db.select().from(websiteBranding).where(eq(websiteBranding.websiteId, websiteId)).limit(1))[0] || null;

    // Fetch domains
    const domains = await db.select().from(websiteDomains).where(eq(websiteDomains.websiteId, websiteId));

    // Fetch administrators
    const administrators = await db.select().from(websiteAdministrators).where(eq(websiteAdministrators.websiteId, websiteId));

    // Fetch plugins
    const plugins = await db
      .select({
        id: websitePlugins.id,
        cmsPluginId: websitePlugins.cmsPluginId,
        slug: cmsPlugins.slug,
        name: cmsPlugins.name,
        version: cmsPlugins.version,
        category: cmsPlugins.category,
        isActive: websitePlugins.isActive,
      })
      .from(websitePlugins)
      .innerJoin(cmsPlugins, eq(websitePlugins.cmsPluginId, cmsPlugins.id))
      .where(eq(websitePlugins.websiteId, websiteId));

    // Fetch recent deployments
    const deployments = await db
      .select()
      .from(deploymentJobs)
      .where(eq(deploymentJobs.websiteId, websiteId))
      .orderBy(desc(deploymentJobs.createdAt))
      .limit(10);

    // Fetch backups
    const backups = await db
      .select()
      .from(backupRecords)
      .where(eq(backupRecords.websiteId, websiteId))
      .orderBy(desc(backupRecords.createdAt))
      .limit(5);

    // Check DB credentials status (never expose password in GET)
    const dbCreds = (await db.select({ id: databaseCredentials.id, dbName: databaseCredentials.dbName, dbUser: databaseCredentials.dbUser }).from(databaseCredentials).where(eq(databaseCredentials.websiteId, websiteId)).limit(1))[0];

    return NextResponse.json({
      website,
      branding,
      domains,
      administrators,
      plugins,
      deployments,
      backups,
      hasDatabase: !!dbCreds,
      databaseName: dbCreds?.dbName || null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || !checkPermission(user, 'websites.edit')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const websiteId = parseInt(id, 10);
  if (isNaN(websiteId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const body = await req.json();

    await db
      .update(websites)
      .set({
        name: body.name,
        title: body.title,
        tagline: body.tagline,
        description: body.description,
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone,
        address: body.address,
        status: body.status,
        updatedAt: new Date(),
      })
      .where(eq(websites.id, websiteId));

    if (body.branding) {
      await db
        .update(websiteBranding)
        .set({
          mainLogoUrl: body.branding.mainLogoUrl,
          headerLogoUrl: body.branding.headerLogoUrl,
          footerLogoUrl: body.branding.footerLogoUrl,
          faviconUrl: body.branding.faviconUrl,
          primaryColor: body.branding.primaryColor,
          secondaryColor: body.branding.secondaryColor,
          headerStyle: body.branding.headerStyle,
          footerStyle: body.branding.footerStyle,
          updatedAt: new Date(),
        })
        .where(eq(websiteBranding.websiteId, websiteId));
    }

    await logAudit(user.id, 'website.updated', 'website', String(websiteId), body);

    return NextResponse.json({ success: true, message: 'Website updated successfully.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || !checkPermission(user, 'websites.delete')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const websiteId = parseInt(id, 10);
  if (isNaN(websiteId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    await db.delete(websites).where(eq(websites.id, websiteId));
    await logAudit(user.id, 'website.deleted', 'website', String(websiteId));
    return NextResponse.json({ success: true, message: 'Website deleted successfully.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
