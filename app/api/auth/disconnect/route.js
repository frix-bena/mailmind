import { NextResponse } from 'next/server';
import { clearLocalConfig } from '@/lib/email-service';

export async function POST() {
  try {
    clearLocalConfig();
    return NextResponse.json({ success: true, connected: false });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
