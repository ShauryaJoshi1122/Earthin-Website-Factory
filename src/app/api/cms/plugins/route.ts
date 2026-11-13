import { NextResponse } from 'next/server';
import { CmsReleaseService } from '@/services/cms/release-service';

const service = new CmsReleaseService();

export async function GET() {
  try {
    const plugins = await service.listPlugins();
    return NextResponse.json({ plugins });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
