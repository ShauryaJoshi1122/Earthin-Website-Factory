import { NextResponse } from 'next/server';
import { CmsReleaseService } from '@/services/cms/release-service';
import { CONFIG } from '@/lib/config';
import fs from 'fs';
import path from 'path';

const service = new CmsReleaseService();

export async function GET() {
  if (!CONFIG.DATABASE_URL) {
    // Read directly from filesystem
    const themesDir = path.join(process.cwd(), 'existing-cms', 'themes');
    if (fs.existsSync(themesDir)) {
      const folders = fs.readdirSync(themesDir, { withFileTypes: true }).filter((d) => d.isDirectory());
      const themes = folders.map((f) => {
        const jsonPath = path.join(themesDir, f.name, 'theme.json');
        if (fs.existsSync(jsonPath)) {
          const t = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
          return {
            id: f.name === 'earthin-samachar' ? 1 : 2,
            name: t.name,
            slug: f.name,
            version: t.version,
            description: t.description,
            author: t.author || 'Earthin News CMS',
            supportedFeatures: t.supported_features || [],
            isApproved: true,
          };
        }
        return null;
      }).filter(Boolean);
      return NextResponse.json({ themes });
    }
  }

  try {
    const themes = await service.listThemes();
    return NextResponse.json({ themes });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
