import { NextResponse } from 'next/server';
import {
  testConnection,
  saveLocalConfig
} from '@/lib/email-service';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, provider, host, port, tone } = body || {};

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password/App Password are required.' },
        { status: 400 }
      );
    }

    const credentials = {
      email,
      password,
      provider: provider || 'gmail',
      host,
      port,
      tone: tone || 'professional',
      connected: true,
      savedAt: new Date().toISOString()
    };

    const testResult = await testConnection(credentials);
    if (!testResult.success) {
      return NextResponse.json(
        {
          error: testResult.error || 'Failed to authenticate with email server.',
          hint: 'For Gmail, make sure 2-Step Verification is active and you are using a 16-character App Password.'
        },
        { status: 401 }
      );
    }

    saveLocalConfig(credentials);

    return NextResponse.json({
      success: true,
      connected: true,
      email: credentials.email,
      provider: credentials.provider,
      totalMessages: testResult.totalMessages,
      unreadMessages: testResult.unreadMessages
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Authentication error.' },
      { status: 500 }
    );
  }
}
