import { NextResponse } from 'next/server';
import { CmsReleaseService } from '@/services/cms/release-service';

const service = new CmsReleaseService();

export async function GET() {
  try {
    const themes = await service.listThemes();
    return NextResponse.json({ themes });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
