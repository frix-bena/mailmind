import { NextResponse } from 'next/server';
import {
  generateAppPassword,
  cleanAppPassword,
  formatAppPassword,
  PROVIDER_GUIDES,
  getProviderAppPasswordGuide
} from '@/lib/app-password-generator';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider') || 'google';
    const email = searchParams.get('email') || '';
    const shouldGenerate = searchParams.get('generate') === 'true' || searchParams.get('generate') === '1';
    const format = searchParams.get('format') || 'spaced';
    const guide = getProviderAppPasswordGuide(email || provider);
    const generatedPassword = shouldGenerate ? generateAppPassword({ format, length: 16 }) : null;

    return NextResponse.json({
      success: true,
      provider: guide.id,
      providerName: guide.name,
      appPasswordUrl: guide.appPasswordUrl,
      securityUrl: guide.securityUrl,
      recoveryUrl: guide.recoveryUrl,
      generatedPassword,
      cleanGeneratedPassword: generatedPassword ? cleanAppPassword(generatedPassword) : null,
      guide,
      allGuides: PROVIDER_GUIDES
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch app password guide' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { provider = 'google', email = '', password = '', generate = false, format = 'spaced' } = body;
    const guide = getProviderAppPasswordGuide(email || provider);
    const generatedPassword = generate ? generateAppPassword({ format, length: 16 }) : null;
    const rawPassword = generatedPassword || password;

    return NextResponse.json({
      success: true,
      provider: guide.id,
      cleanPassword: cleanAppPassword(rawPassword),
      generatedPassword,
      appPasswordUrl: guide.appPasswordUrl,
      guide
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to process app password' },
      { status: 500 }
    );
  }
}
