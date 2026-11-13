import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'branding';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check size limit: 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit.' }, { status: 400 });
    }

    // Validate MIME types
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/x-icon', 'application/zip'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.ico')) {
      return NextResponse.json({ error: `Unsupported file type: ${file.type}` }, { status: 400 });
    }

    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const pathname = `${folder}/${filename}`;

    // Upload to Vercel Blob if token available
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(pathname, file, {
        access: 'public',
      });
      return NextResponse.json({ url: blob.url });
    } else {
      // Local fallback representation for dev without Blob token
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const dataUri = `data:${file.type};base64,${base64}`;
      return NextResponse.json({ url: dataUri });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
  }
}

