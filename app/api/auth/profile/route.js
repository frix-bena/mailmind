import { NextResponse } from 'next/server';
import { loadLocalConfig, saveLocalConfig } from '@/lib/email-service';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, avatar, picture, avatarColor, color, tone, monitoringMode } = body || {};

    const existing = loadLocalConfig() || {};
    const updated = {
      ...existing,
      name: name !== undefined ? name : existing.name,
      avatar: avatar !== undefined ? avatar : existing.avatar,
      picture: picture !== undefined ? picture : existing.picture,
      avatarColor: avatarColor !== undefined ? avatarColor : existing.avatarColor,
      color: color !== undefined ? color : existing.color,
      tone: tone !== undefined ? tone : existing.tone,
      monitoringMode: monitoringMode !== undefined ? monitoringMode : (existing.monitoringMode || 'ask_permission'),
      updatedAt: new Date().toISOString()
    };

    saveLocalConfig(updated);

    return NextResponse.json({
      success: true,
      email: updated.email,
      name: updated.name,
      avatar: updated.avatar,
      picture: updated.picture,
      avatarColor: updated.avatarColor,
      color: updated.color,
      tone: updated.tone,
      monitoringMode: updated.monitoringMode
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Failed to update profile.' },
      { status: 500 }
    );
  }
}
