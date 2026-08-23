import { NextResponse } from 'next/server';
import { loadLocalConfig } from '@/lib/email-service';

export async function GET() {
  try {
    const config = loadLocalConfig();
    if (config && config.email) {
      return NextResponse.json({
        connected: true,
        email: config.email,
        name: config.name || null,
        avatar: config.avatar || config.picture || config.photoUrl || null,
        picture: config.picture || config.avatar || config.photoUrl || null,
        avatarColor: config.avatarColor || config.color || null,
        color: config.color || config.avatarColor || null,
        provider: config.provider || 'gmail',
        tone: config.tone || 'professional',
        savedAt: config.savedAt
      });
    }
    return NextResponse.json({ connected: false });
  } catch (err) {
    return NextResponse.json({ connected: false, error: err.message });
  }
}
