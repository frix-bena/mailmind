import { NextResponse } from 'next/server';
import { getMailClient, parseEmailItem, loadLocalConfig } from '@/lib/email-service';

export async function POST(request) {
  let client;
  try {
    const body = await request.json().catch(() => ({}));
    const credentials = (body && (body.email || body.user)) ? body : (loadLocalConfig() || {});

    client = await getMailClient(credentials);
    const folder = body?.folder || 'INBOX';
    const limit = body?.limit ? parseInt(body.limit, 10) : 25;
    const tone = body?.tone || credentials.tone || 'professional';
    const userEmail = credentials.email || credentials.user || process.env.EMAIL_USER || process.env.GMAIL_USER || '';

    let lock = await client.getMailboxLock(folder);
    const emails = [];
    try {
      const totalMessages = client.mailbox ? client.mailbox.exists || 0 : 0;
      if (totalMessages > 0) {
        let searchQuery = { seen: false };
        const searchCriteria = body?.search || body?.searchCriteria || ['UNSEEN'];
        if (Array.isArray(searchCriteria)) {
          if (searchCriteria.includes('UNSEEN') || searchCriteria.includes('unseen')) {
            searchQuery = { seen: false };
          } else if (searchCriteria.includes('ALL') || searchCriteria.includes('all')) {
            searchQuery = { all: true };
          }
        } else if (typeof searchCriteria === 'object' && searchCriteria !== null) {
          searchQuery = searchCriteria;
        }

        let messageUids = [];
        try {
          messageUids = await client.search(searchQuery, { uid: true });
        } catch (_) {
          messageUids = [];
        }

        if ((!messageUids || messageUids.length === 0) && !body?.strictUnseen) {
          const fetchCount = Math.min(totalMessages, limit);
          const fromSeq = Math.max(1, totalMessages - fetchCount + 1);
          for await (let msg of client.fetch(`${fromSeq}:*`, { source: true, flags: true, envelope: true, uid: true, internalDate: true })) {
            try {
              const parsed = await parseEmailItem(msg, userEmail, tone);
              if (parsed) emails.push(parsed);
            } catch (pErr) {
              console.warn('[sync-inbox route] Error parsing message:', pErr.message);
            }
          }
        } else if (Array.isArray(messageUids) && messageUids.length > 0) {
          const uidsToFetch = messageUids.slice(-limit);
          for await (let msg of client.fetch(uidsToFetch.join(','), { source: true, flags: true, envelope: true, uid: true, internalDate: true }, { uid: true })) {
            try {
              const parsed = await parseEmailItem(msg, userEmail, tone);
              if (parsed) emails.push(parsed);
            } catch (pErr) {
              console.warn('[sync-inbox route] Error parsing message:', pErr.message);
            }
          }
        }
      }
    } finally {
      lock.release();
    }

    emails.sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));

    return NextResponse.json({
      success: true,
      emails,
      total: emails.length
    });
  } catch (error) {
    console.error('Sync failed:', error.message);
    return NextResponse.json({ success: false, message: error.message, error: error.message }, { status: 500 });
  } finally {
    if (client) {
      try {
        await client.logout();
      } catch (_) {}
    }
  }
}
