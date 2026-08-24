import { NextResponse } from 'next/server';
import { fetchEmailHistory, loadLocalConfig } from '@/lib/email-service';

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

    if (!credentials) {
      return NextResponse.json({
        success: false,
        error: 'No email credentials provided.'
      }, { status: 400 });
    }

    const folder = body.folder || 'INBOX';
    const since = body.since || null;
    const tone = body.tone || credentials.tone || 'professional';

    const result = await fetchEmailHistory(credentials, { limit, offset, folder, since, tone });
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to fetch email history.'
      }, { status: 500 });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error('Fetch history route error:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to fetch email history.'
    }, { status: 500 });
  }
}

