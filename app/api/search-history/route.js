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
    const { query = '', sender = '', subject = '', limit = 50 } = body || {};

    if (!credentials) {
      return NextResponse.json({
        success: false,
        error: 'No email credentials provided.'
      }, { status: 400 });
    }

    const result = await searchEmailHistory(credentials, {
      query: query || '',
      sender: sender || '',
      subject: subject || '',
      limit: limit ? parseInt(limit, 10) : 50
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Search failed.'
      }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('Search history route error:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to search email history.'
    }, { status: 500 });
  }
}

