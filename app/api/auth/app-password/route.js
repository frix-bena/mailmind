import { NextResponse } from 'next/server';
import {
  cleanAppPassword,
  formatAppPassword,
  PROVIDER_GUIDES,
  getProviderAppPasswordGuide
} from '@/lib/app-password-generator';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider') || 'google';
    const guide = getProviderAppPasswordGuide(provider);

    return NextResponse.json({
      success: true,
      provider: guide.id,
      providerName: guide.name,
      appPasswordUrl: guide.appPasswordUrl,
      securityUrl: guide.securityUrl,
      recoveryUrl: guide.recoveryUrl,
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
    const { provider = 'google', password = '' } = body;
    const guide = getProviderAppPasswordGuide(provider);

    return NextResponse.json({
      success: true,
      provider: guide.id,
      cleanPassword: cleanAppPassword(password),
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
