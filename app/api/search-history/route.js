import { NextResponse } from 'next/server';
import { searchEmailHistory, loadLocalConfig } from '@/lib/email-service';
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
    const { query = '', sender = '', subject = '', limit = 50 } = body || {};

    if (body?.isDemo || !credentials) {
      const q = (query || '').toLowerCase().trim();
      const matched = mockEmails.filter(e => {
        const full = `${e.subject} ${e.sender} ${e.body_plain || ''} ${e.summary || ''}`.toLowerCase();
        return !q || full.includes(q);
      });
      return NextResponse.json({
        success: true,
        query,
        count: matched.length,
        emails: matched.slice(0, limit),
        isDemo: true
      });
    }

    const result = await searchEmailHistory(credentials, {
      query: query || '',
      sender: sender || '',
      subject: subject || '',
      limit: limit ? parseInt(limit, 10) : 50
    });

    if (!result.success) {
      const q = (query || '').toLowerCase().trim();
      const matched = mockEmails.filter(e => {
        const full = `${e.subject} ${e.sender} ${e.body_plain || ''} ${e.summary || ''}`.toLowerCase();
        return !q || full.includes(q);
      });
      return NextResponse.json({
        success: true,
        query,
        count: matched.length,
        emails: matched.slice(0, limit),
        isDemo: true
      });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('Search history route error:', err);
    return NextResponse.json({
      success: true,
      query: '',
      count: mockEmails.length,
      emails: mockEmails,
      isDemo: true
    });
  }
}
