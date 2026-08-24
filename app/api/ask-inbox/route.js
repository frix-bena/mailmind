import { NextResponse } from 'next/server';
import { askEmailHistory, fetchEmailHistory, loadLocalConfig } from '@/lib/email-service';

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
    const { question, emails } = body;

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required.' },
        { status: 400 }
      );
    }

    let emailData = emails;
    if (!emailData || emailData.length === 0) {
      if (credentials) {
        try {
          const hist = await fetchEmailHistory(credentials, { limit: 50 });
          emailData = hist?.emails || [];
        } catch (_) {
          emailData = [];
        }
      } else {
        emailData = [];
      }
    }

    if (!emailData || emailData.length === 0) {
      return NextResponse.json({
        success: true,
        question,
        answer: `No emails found in history for ${credentials?.email || 'your account'} to answer this question.`
      });
    }

    const answer = askEmailHistory(question, emailData);
    return NextResponse.json({ success: true, question, answer });
  } catch (err) {
    console.error('Ask inbox route error:', err);
    return NextResponse.json(
      { error: err.message || 'AI analysis over history failed.' },
      { status: 500 }
    );
  }
}

