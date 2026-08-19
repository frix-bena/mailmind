import { NextResponse } from 'next/server';
import { searchEmailHistory, loadLocalConfig } from '@/lib/email-service';

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

    const { query, sender, subject, limit } = body;
    const result = await searchEmailHistory(credentials, {
      query,
      sender,
      subject,
      limit: limit ? parseInt(limit, 10) : 50
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('Search history route error:', err);
    return NextResponse.json(
      { error: err.message || 'Search in email history failed.' },
      { status: 500 }
    );
  }
}
