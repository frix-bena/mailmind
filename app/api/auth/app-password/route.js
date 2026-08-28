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
    const format = searchParams.get('format') || (provider === 'icloud' ? 'dashed' : 'spaced');

    const password = generateAppPassword({ format, length: 16 });
    const guide = getProviderAppPasswordGuide(provider);

    return NextResponse.json({
      success: true,
      appPassword: password,
      cleanPassword: cleanAppPassword(password),
      format,
      provider: guide.id,
      providerName: guide.name,
      appPasswordUrl: guide.appPasswordUrl,
      guide,
      allGuides: PROVIDER_GUIDES
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to generate app password' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { provider = 'google', format = 'spaced', length = 16 } = body;

    const password = generateAppPassword({
      format,
      length: Math.min(64, Math.max(8, parseInt(length, 10) || 16))
    });
    const guide = getProviderAppPasswordGuide(provider);

    return NextResponse.json({
      success: true,
      appPassword: password,
      cleanPassword: cleanAppPassword(password),
      format,
      provider: guide.id,
      guide
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to generate app password' },
      { status: 500 }
    );
  }
}
