import { NextResponse } from 'next/server';
import { syncInbox, loadLocalConfig } from '@/lib/email-service';

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
        { error: 'No email credentials provided or saved. Please log in with your email.' },
        { status: 400 }
      );
    }

    const searchCriteria = body.search || body.searchCriteria || ['UNSEEN'];
    const folder = body.folder || 'INBOX';
    const limit = body.limit ? parseInt(body.limit, 10) : 25;
    const tone = body.tone || credentials.tone || 'professional';
    const markSeen = body.markSeen ?? false;

    const result = await syncInbox(credentials, {
      search: searchCriteria,
      folder,
      limit,
      tone,
      markSeen
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'Failed to synchronize email inbox.',
          hint: 'Check your mail credentials and connection settings.'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('Sync inbox route error:', err);
    return NextResponse.json(
      {
        error: err.message || 'Email inbox synchronization failed.',
        hint: 'Check your App Password and IMAP settings.'
      },
      { status: 500 }
    );
  }
}
