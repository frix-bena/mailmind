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

    if (!credentials) {
      return NextResponse.json(
        { error: 'No email credentials provided or saved.' },
        { status: 400 }
      );
    }

    const limit = body.limit ? parseInt(body.limit, 10) : 50;
    const offset = body.offset ? parseInt(body.offset, 10) : 0;
    const folder = body.folder || 'INBOX';
    const since = body.since || null;
    const tone = body.tone || credentials.tone || 'professional';

    const result = await fetchEmailHistory(credentials, { limit, offset, folder, since, tone });
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to retrieve email history.' },
        { status: 500 }
      );
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error('Fetch history route error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to retrieve email history.' },
      { status: 500 }
    );
  }
}
