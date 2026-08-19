import { NextResponse } from 'next/server';
import { sendEmailReply, loadLocalConfig } from '@/lib/email-service';

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

    const { to, subject, body: emailBody, inReplyTo, references } = body;
    if (!to || !emailBody) {
      return NextResponse.json(
        { error: 'Recipient "to" and message "body" are required.' },
        { status: 400 }
      );
    }

    const result = await sendEmailReply(credentials, {
      to,
      subject,
      body: emailBody,
      inReplyTo,
      references
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('Send email route error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to send email via SMTP.' },
      { status: 500 }
    );
  }
}
