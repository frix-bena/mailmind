import { NextResponse } from 'next/server';
import {
  sendDeviceNotification,
  testDeviceNotification,
  getNotificationCapabilities
} from '@/lib/notification-service';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const isTest = searchParams.get('test') === 'true' || searchParams.get('action') === 'test';

    if (isTest) {
      const result = await testDeviceNotification({
        title: searchParams.get('title') || '🔔 MailMind Device Notification Test',
        message: searchParams.get('message') || 'Device notifications are active and verified.'
      });
      return NextResponse.json(result);
    }

    const capabilities = getNotificationCapabilities();
    return NextResponse.json({
      success: true,
      status: 'ready',
      capabilities
    });
  } catch (err) {
    console.error('Notification GET route error:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Notification check failed.'
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { title, message, body: altBody, urgency, category, sound, appName, icon, timeout, webhookUrl, isTest } = body;

    if (isTest) {
      const testResult = await testDeviceNotification({
        title: title || '🔔 MailMind Agent Active',
        message: message || altBody || 'Device notifications are working correctly.'
      });
      return NextResponse.json(testResult);
    }

    const result = await sendDeviceNotification({
      title: title || '📧 MailMind Alert',
      message: message || altBody || 'New message update.',
      urgency: urgency || 'normal',
      category: category || 'email',
      sound: sound !== false,
      appName: appName || 'MailMind Agent',
      icon,
      timeout,
      webhookUrl
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('Notification POST route error:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to send device notification.'
    }, { status: 500 });
  }
}
