import { NextResponse } from 'next/server';
import { loadLocalAccounts } from '@/lib/email-service';

export async function GET() {
  try {
    const accounts = loadLocalAccounts();
    return NextResponse.json({
      success: true,
      accounts: accounts.map(a => ({
        email: a.email,
        name: a.name || null,
        provider: a.provider || 'gmail',
        tone: a.tone || 'professional',
        monitoringMode: a.monitoringMode || 'ask_permission',
        savedAt: a.savedAt
      }))
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
