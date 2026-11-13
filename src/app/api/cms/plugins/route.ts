import { NextResponse } from 'next/server';
import { CmsReleaseService } from '@/services/cms/release-service';
import fs from 'fs';
import path from 'path';

const service = new CmsReleaseService();

export async function GET() {
  if (!process.env.DATABASE_URL) {
    const pluginsDir = path.join(process.cwd(), 'existing-cms', 'plugins');
    if (fs.existsSync(pluginsDir)) {
      const folders = fs.readdirSync(pluginsDir, { withFileTypes: true }).filter((d) => d.isDirectory());
      const plugins = folders.map((f, idx) => {
        const jsonPath = path.join(pluginsDir, f.name, 'plugin.json');
        if (fs.existsSync(jsonPath)) {
          const p = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
          return {
            id: idx + 1,
            name: p.name,
            slug: f.name,
            version: p.version,
            description: p.description,
            category: p.category || 'Editorial',
            icon: p.icon || 'puzzle',
            isApproved: true,
          };
        }
        return null;
      }).filter(Boolean);
      return NextResponse.json({ plugins });
    }
  }

  try {
    const plugins = await service.listPlugins();
    return NextResponse.json({ plugins });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
