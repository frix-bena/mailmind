import { NextResponse } from 'next/server';
import { loadLocalConfig, saveLocalConfig, testConnection } from '@/lib/email-service';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      email,
      name,
      avatar,
      picture,
      avatarColor,
      color,
      password,
      provider,
      host,
      port,
      tone,
      isDemo
    } = body || {};

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required to switch account.' },
        { status: 400 }
      );
    }

    const existing = loadLocalConfig() || {};
    const updated = {
      ...existing,
      email: email.trim(),
      name: name !== undefined ? name : existing.name,
      avatar: avatar !== undefined ? avatar : existing.avatar,
      picture: picture !== undefined ? picture : existing.picture,
      avatarColor: avatarColor !== undefined ? avatarColor : existing.avatarColor,
      color: color !== undefined ? color : existing.color,
      provider: provider || existing.provider || 'google',
      tone: tone || existing.tone || 'professional',
      connected: true,
      isDemo: isDemo !== undefined ? isDemo : existing.isDemo,
      updatedAt: new Date().toISOString()
    };

    if (password) {
      updated.password = password;
    }
    if (host !== undefined) updated.host = host;
    if (port !== undefined) updated.port = port;

    saveLocalConfig(updated);

    return NextResponse.json({
      success: true,
      switched: true,
      email: updated.email,
      name: updated.name,
      provider: updated.provider,
      avatar: updated.avatar,
      picture: updated.picture,
      avatarColor: updated.avatarColor,
      color: updated.color,
      tone: updated.tone
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Failed to switch account.' },
      { status: 500 }
    );
  }
}
