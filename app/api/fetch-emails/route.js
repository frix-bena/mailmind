import { NextResponse } from 'next/server';
import { fetchEmails, loadLocalConfig } from '@/lib/email-service';
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
    const limit = body.limit ? parseInt(body.limit, 10) : 15;

    if (body?.isDemo || !credentials) {
      return NextResponse.json({
        success: true,
        emails: mockEmails.slice(0, limit),
        total: mockEmails.length,
        isDemo: true
      });
    }

    const tone = body.tone || credentials.tone || 'professional';
    const folder = body.folder || 'INBOX';

    const result = await fetchEmails(credentials, { limit, tone, folder });
    if (!result.success) {
      return NextResponse.json({
        success: true,
        emails: mockEmails.slice(0, limit),
        total: mockEmails.length,
        isDemo: true,
        notice: 'Displaying demo messages (IMAP server not reachable)'
      });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error('Fetch emails route error:', err);
    return NextResponse.json({
      success: true,
      emails: mockEmails,
      total: mockEmails.length,
      isDemo: true
    });
  }
}
