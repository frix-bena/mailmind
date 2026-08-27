import { NextResponse } from 'next/server';
import {
  testConnection,
  saveLocalConfig
} from '@/lib/email-service';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, provider, host, port, tone, monitoringMode } = body || {};

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
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
      monitoringMode: monitoringMode || 'ask_permission',
      connected: true,
      savedAt: new Date().toISOString()
    };

    const testResult = await testConnection(credentials);
    if (!testResult.success) {
      return NextResponse.json(
        {
          error: testResult.error || 'Failed to authenticate with email server.',
          hint: 'Make sure your email address and password are correct, and IMAP access is enabled in your email provider settings.'
        },
        { status: 401 }
      );
    }

    const detectedName = testResult.detectedName || (email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
    credentials.name = detectedName;

    saveLocalConfig(credentials);

    return NextResponse.json({
      success: true,
      connected: true,
      email: credentials.email,
      name: credentials.name,
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
