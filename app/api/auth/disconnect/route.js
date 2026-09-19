import { NextResponse } from 'next/server';
import { clearLocalConfig, removeSavedAccount } from '@/lib/email-service';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (body?.email) {
      removeSavedAccount(body.email);
    } else {
      clearLocalConfig();
    }
    return NextResponse.json({ success: true, connected: false });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
