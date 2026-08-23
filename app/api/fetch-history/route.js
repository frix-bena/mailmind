import { NextResponse } from 'next/server';
import { fetchEmailHistory, loadLocalConfig } from '@/lib/email-service';
import { mockEmails } from '@/lib/mockData';

function resolveCredentials(body) {
  const { email, password, provider, host, port, tone } = body || {};
  if (email && password) {
    return { email, password, provider: provider || 'gmail', host, port, tone: tone || 'professional' };
  }
  const saved = loadLocalConfig();
  if (saved && saved.email && saved.password) {
    return {
      ...saved,
      tone: tone || saved.tone || 'professional'
    };
  }
  return null;
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const credentials = resolveCredentials(body);
    const limit = body?.limit ? parseInt(body.limit, 10) : 50;
    const offset = body?.offset ? parseInt(body.offset, 10) : 0;

    if (body?.isDemo || !credentials) {
      return NextResponse.json({
        success: true,
        emails: mockEmails.slice(offset, offset + limit),
        total: mockEmails.length,
        offset,
        limit,
        hasMore: false,
        isDemo: true
      });
    }

    const folder = body.folder || 'INBOX';
    const since = body.since || null;
    const tone = body.tone || credentials.tone || 'professional';

    const result = await fetchEmailHistory(credentials, { limit, offset, folder, since, tone });
    if (!result.success) {
      return NextResponse.json({
        success: true,
        emails: mockEmails.slice(offset, offset + limit),
        total: mockEmails.length,
        offset,
        limit,
        hasMore: false,
        isDemo: true
      });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error('Fetch history route error:', err);
    return NextResponse.json({
      success: true,
      emails: mockEmails,
      total: mockEmails.length,
      offset: 0,
      limit: 50,
      hasMore: false,
      isDemo: true
    });
  }
}
