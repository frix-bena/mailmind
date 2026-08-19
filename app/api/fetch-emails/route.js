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

    if (!credentials) {
      return NextResponse.json(
        { error: 'No email credentials provided or saved. Please log in with your email.' },
        { status: 400 }
      );
    }

    const limit = body.limit ? parseInt(body.limit, 10) : 15;
    const tone = body.tone || credentials.tone || 'professional';

    const result = await fetchEmails(credentials, { limit, tone });
    return NextResponse.json(result);
  } catch (err) {
    console.error('Fetch emails route error:', err);
    return NextResponse.json(
      {
        error: err.message || 'Failed to connect to email server.',
        hint: 'Check your App Password and IMAP settings.'
      },
      { status: 500 }
    );
  }
}
