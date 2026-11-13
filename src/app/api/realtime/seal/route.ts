import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { sealLiveQuery } from '@/lib/realtime';

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { topic, entityId } = await req.json();

    let sql = '';
    let params: any[] = [];

    switch (topic) {
      case 'deployments':
        if (entityId) {
          sql = 'SELECT id, website_id, current_step, step_name, status, updated_at FROM deployments WHERE id = $1';
          params = [Number(entityId)];
        } else {
          sql = 'SELECT id, website_id, current_step, step_name, status, updated_at FROM deployments ORDER BY created_at DESC LIMIT 20';
        }
        break;

      case 'notifications':
        sql = 'SELECT id, title, message, type, read, created_at FROM notifications ORDER BY created_at DESC LIMIT 25';
        break;

      case 'websites':
        sql = 'SELECT id, name, primary_domain, status, created_at, updated_at FROM websites ORDER BY created_at DESC';
        break;

      case 'audit_logs':
        sql = 'SELECT id, action, entity_type, ip_address, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 25';
        break;

      default:
        return NextResponse.json({ error: `Unsupported realtime topic: ${topic}` }, { status: 400 });
    }

    const { sealedQuery, url } = await sealLiveQuery(sql, params);
    return NextResponse.json({ sealedQuery, url, topic });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to seal query' }, { status: 500 });
  }
}

