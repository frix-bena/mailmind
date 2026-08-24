import { NextResponse } from 'next/server';
import { fetchEmails, loadLocalConfig } from '@/lib/email-service';

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
    const limit = body.limit ? parseInt(body.limit, 10) : 15;

    if (!credentials) {
      return NextResponse.json({
        success: false,
        error: 'No email credentials provided or account not configured.'
      }, { status: 400 });
    }

    const tone = body.tone || credentials.tone || 'professional';
    const folder = body.folder || 'INBOX';

    const result = await fetchEmails(credentials, { limit, tone, folder });
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to connect to email server.'
      }, { status: 500 });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error('Fetch emails route error:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to connect to email server.'
    }, { status: 500 });
  }
}

