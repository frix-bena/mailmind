import { NextResponse } from 'next/server';
import { loadLocalConfig, saveLocalConfig } from '@/lib/email-service';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name,
      avatar,
      picture,
      avatarColor,
      color,
      tone,
      monitoringMode,
      inApp,
      deviceNotifications,
      notifSound,
      highUrgencyOnly,
      webhookUrl,
      digest,
      pollInterval,
      signature,
      password
    } = body || {};

    const existing = loadLocalConfig() || {};
    const updated = {
      ...existing,
      name: name !== undefined ? name : existing.name,
      avatar: avatar !== undefined ? avatar : existing.avatar,
      picture: picture !== undefined ? picture : (avatar !== undefined ? avatar : existing.picture),
      avatarColor: avatarColor !== undefined ? avatarColor : existing.avatarColor,
      color: color !== undefined ? color : (avatarColor !== undefined ? avatarColor : existing.color),
      tone: tone !== undefined ? tone : existing.tone,
      password: password !== undefined ? String(password) : existing.password,
      monitoringMode: monitoringMode !== undefined ? monitoringMode : (existing.monitoringMode || 'ask_permission'),
      inApp: inApp !== undefined ? inApp : existing.inApp,
      deviceNotifications: deviceNotifications !== undefined ? deviceNotifications : existing.deviceNotifications,
      notifSound: notifSound !== undefined ? notifSound : existing.notifSound,
      highUrgencyOnly: highUrgencyOnly !== undefined ? highUrgencyOnly : existing.highUrgencyOnly,
      webhookUrl: webhookUrl !== undefined ? webhookUrl : existing.webhookUrl,
      digest: digest !== undefined ? digest : existing.digest,
      pollInterval: pollInterval !== undefined ? pollInterval : existing.pollInterval,
      signature: signature !== undefined ? signature : existing.signature,
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
      monitoringMode: updated.monitoringMode,
      inApp: updated.inApp,
      deviceNotifications: updated.deviceNotifications,
      notifSound: updated.notifSound,
      highUrgencyOnly: updated.highUrgencyOnly,
      webhookUrl: updated.webhookUrl,
      digest: updated.digest,
      pollInterval: updated.pollInterval,
      signature: updated.signature
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Failed to update profile.' },
      { status: 500 }
    );
  }
}
