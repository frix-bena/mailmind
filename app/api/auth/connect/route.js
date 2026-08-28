import { NextResponse } from 'next/server';
import {
  testConnection,
  saveLocalConfig,
  isValidEmail
} from '@/lib/email-service';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password, provider, host, port, tone, monitoringMode } = body || {};

    if (!email || !String(email).trim()) {
      return NextResponse.json(
        { error: 'Email address is required.' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      return NextResponse.json(
        {
          error: 'Please enter a valid email address (e.g. yourname@domain.com).',
          hint: 'The email address format you entered is not recognized as a valid email address.'
        },
        { status: 400 }
      );
    }

    if (password == null || password === '') {
      return NextResponse.json(
        { error: 'Password is required. Please enter your email password to sign in.' },
        { status: 400 }
      );
    }

    const exactPassword = String(password);

    const credentials = {
      email: cleanEmail,
      password: exactPassword,
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
          error: testResult.error || 'Authentication failed: Incorrect email address or password.',
          hint: 'Please ensure you entered your exact email password and that your email address is spelled correctly.'
        },
        { status: 401 }
      );
    }

    const detectedName = testResult.detectedName || (cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
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
