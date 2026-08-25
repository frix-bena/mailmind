const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(process.cwd(), '.mailmind-config.json');

/**
 * Automatically load environment variables from .env and .env.local if present
 */
function loadEnvFiles() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      } catch (_) {}
    }
  }
}
loadEnvFiles();

/**
 * Safe string search helper
 */
function safeSearch(field, pattern) {
  const str = field != null ? String(field) : '';
  if (!pattern) return 0;
  if (typeof str.search === 'function') {
    return str.search(pattern);
  }
  return -1;
}

/**
 * Safe string includes helper
 */
function safeIncludes(field, query) {
  const str = field != null ? String(field) : '';
  if (!query) return true;
  if (typeof str.includes === 'function') {
    return str.toLowerCase().includes(String(query).toLowerCase());
  }
  return false;
}

/**
 * Safe regex match helper
 */
function safeMatch(field, regex) {
  const str = field != null ? String(field) : '';
  if (!regex) return null;
  if (typeof str.match === 'function') {
    return str.match(regex);
  }
  return null;
}

/**
 * Clean password - for App Passwords, automatically strip all whitespace
 */
function sanitizePassword(password, email, provider) {
  if (!password) return '';
  const rawPass = typeof password === 'string' ? password : String(password);
  return rawPass.replace(/\s+/g, '');
}

/**
 * Resolve client credentials from params, local config, or environment variables
 */
function resolveClientCredentials(credentials) {
  loadEnvFiles();
  const localConfig = loadLocalConfig() || {};
  const creds = (credentials && typeof credentials === 'object') ? credentials : {};

  const emailUser = (
    creds.email ||
    creds.user ||
    creds.username ||
    localConfig.email ||
    process.env.EMAIL_USER ||
    process.env.GMAIL_USER ||
    process.env.MAILMIND_EMAIL ||
    ''
  ).trim();

  const rawPass = (
    creds.password ||
    creds.pass ||
    creds.appPassword ||
    localConfig.password ||
    process.env.EMAIL_PASS ||
    process.env.GMAIL_APP_PASSWORD ||
    process.env.MAILMIND_PASSWORD ||
    ''
  );

  const emailPass = (typeof rawPass === 'string' ? rawPass : String(rawPass || '')).replace(/\s+/g, '');

  if (!emailUser || !emailPass) {
    console.error('ERROR: Missing EMAIL_USER or EMAIL_PASS environment variables.');
  }

  const provider = (creds.provider || localConfig.provider || process.env.EMAIL_PROVIDER || 'gmail').toLowerCase();
  const host = creds.host || localConfig.host || process.env.EMAIL_HOST || null;
  const port = creds.port || localConfig.port || process.env.EMAIL_PORT || 993;
  const tone = creds.tone || localConfig.tone || 'professional';
  const monitoringMode = creds.monitoringMode || localConfig.monitoringMode || process.env.MAILMIND_MONITORING_MODE || 'ask_permission';

  return { emailUser, emailPass, provider, host, port: parseInt(port, 10) || 993, tone, monitoringMode };
}

/**
 * Resolve IMAP server settings
 */
function getImapConfig(credentials = {}) {
  const { emailUser, emailPass, provider, host, port } = resolveClientCredentials(credentials);
  let imapHost = host;
  let imapPort = port || 993;

  const domain = (emailUser && emailUser.includes('@') ? emailUser.split('@')[1] || '' : '').toLowerCase();
  const isGmail = provider === 'gmail' || provider === 'google' || domain.includes('gmail') || domain.includes('googlemail') || (!imapHost && !provider && !domain);

  if (isGmail) {
    imapHost = 'imap.gmail.com';
    imapPort = 993;
  } else if (!imapHost) {
    if (provider === 'microsoft' || provider === 'outlook' || provider === 'office365' || domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live')) {
      imapHost = 'outlook.office365.com';
      imapPort = 993;
    } else if (provider === 'yahoo' || provider === 'aol' || domain.includes('yahoo') || domain.includes('aol')) {
      imapHost = 'imap.mail.yahoo.com';
      imapPort = 993;
    } else if (provider === 'icloud' || domain.includes('icloud') || domain.includes('me.com') || domain.includes('mac.com')) {
      imapHost = 'imap.mail.me.com';
      imapPort = 993;
    } else if (provider === 'zoho' || domain.includes('zoho')) {
      imapHost = 'imap.zoho.com';
      imapPort = 993;
    } else if (provider === 'fastmail' || domain.includes('fastmail')) {
      imapHost = 'imap.fastmail.com';
      imapPort = 993;
    } else {
      imapHost = 'imap.gmail.com';
      imapPort = 993;
    }
  }

  return {
    host: imapHost,
    port: imapPort,
    secure: true,
    auth: {
      user: emailUser,
      pass: emailPass
    }
  };
}

/**
 * Resolve SMTP server settings for sending replies
 */
function getSmtpConfig(credentials = {}) {
  const { emailUser, emailPass, provider, host: customHost } = resolveClientCredentials(credentials);
  let host = credentials.smtpHost || customHost;
  let port = credentials.smtpPort ? parseInt(credentials.smtpPort, 10) : 587;
  let secure = port === 465;

  if (!host) {
    const prov = (provider ? String(provider) : '').toLowerCase();
    const domain = (emailUser.includes('@') ? emailUser.split('@')[1] || '' : '').toLowerCase();

    if (prov === 'microsoft' || provider === 'outlook' || domain.includes('outlook') || domain.includes('hotmail')) {
      host = 'smtp.office365.com';
      port = 587;
      secure = false;
    } else if (prov === 'yahoo' || prov === 'aol' || domain.includes('yahoo') || domain.includes('aol')) {
      host = 'smtp.mail.yahoo.com';
      port = 465;
      secure = true;
    } else if (prov === 'icloud' || domain.includes('icloud') || domain.includes('me.com') || domain.includes('mac.com')) {
      host = 'smtp.mail.me.com';
      port = 587;
      secure = false;
    } else if (prov === 'zoho' || domain.includes('zoho')) {
      host = 'smtp.zoho.com';
      port = 465;
      secure = true;
    } else if (prov === 'fastmail' || domain.includes('fastmail')) {
      host = 'smtp.fastmail.com';
      port = 465;
      secure = true;
    } else {
      host = 'smtp.gmail.com';
      port = 465;
      secure = true;
    }
  }

  return {
    host,
    port,
    secure,
    auth: {
      user: emailUser,
      pass: emailPass
    },
    tls: {
      rejectUnauthorized: false
    }
  };
}

/**
 * Robust IMAP Connect-on-Demand (Lazy Connection) with Full Error Capture
 */
async function getMailClient(credentials = {}) {
  loadEnvFiles();
  const { emailUser, emailPass, provider, host: customHost, port: customPort } = resolveClientCredentials(credentials);

  if (!emailUser || !emailPass) {
    console.error('ERROR: Missing EMAIL_USER or EMAIL_PASS environment variables.');
    throw new Error('Mail client is not connected or initialized. Missing EMAIL_USER or EMAIL_PASS environment variables.');
  }

  let host = customHost;
  let port = customPort || 993;
  const domain = (emailUser.includes('@') ? emailUser.split('@')[1] || '' : '').toLowerCase();
  const isGmail = provider === 'gmail' || provider === 'google' || domain.includes('gmail') || domain.includes('googlemail') || (!host && !provider);

  if (isGmail || !host) {
    if (provider === 'microsoft' || provider === 'outlook' || provider === 'office365' || domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live')) {
      host = 'outlook.office365.com';
      port = 993;
    } else if (provider === 'yahoo' || provider === 'aol' || domain.includes('yahoo') || domain.includes('aol')) {
      host = 'imap.mail.yahoo.com';
      port = 993;
    } else if (provider === 'icloud' || domain.includes('icloud') || domain.includes('me.com') || domain.includes('mac.com')) {
      host = 'imap.mail.me.com';
      port = 993;
    } else if (provider === 'zoho' || domain.includes('zoho')) {
      host = 'imap.zoho.com';
      port = 993;
    } else if (provider === 'fastmail' || domain.includes('fastmail')) {
      host = 'imap.fastmail.com';
      port = 993;
    } else {
      host = 'imap.gmail.com';
      port = 993;
    }
  }

  const client = new ImapFlow({
    host: host || 'imap.gmail.com',
    port: port || 993,
    secure: true,
    auth: {
      user: emailUser,
      pass: emailPass
    },
    logger: false,
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Successfully authenticated with Gmail IMAP.');
    return client;
  } catch (err) {
    const errorDetail = err.message || (Array.isArray(err.errors) && err.errors[0] ? err.errors[0].message : '') || err.code || String(err);
    console.error('CRITICAL GMAIL AUTH/CONNECTION FAILURE:', errorDetail);
    throw new Error(`IMAP Connection Failed: ${errorDetail}`);
  }
}

/**
 * Backward-compatible alias for getMailClient
 */
async function connectImap(credentials) {
  return getMailClient(credentials);
}

/**
 * Generate human-styled draft reply according to tone
 */
function generateDraft(senderName, subject, bodyText, userEmail, tone = 'professional') {
  const safeSender = typeof senderName === 'string' && senderName.trim() ? senderName : 'there';
  const firstName = safeSender.split(' ')[0] || 'there';
  const safeUserEmail = typeof userEmail === 'string' && userEmail.includes('@') ? userEmail : '';
  const myName = (safeUserEmail ? safeUserEmail.split('@')[0] : 'Me').replace(/[._]/g, ' ');
  const safeSubject = typeof subject === 'string' ? subject : (subject != null ? String(subject) : '');
  const cleanSubject = safeSubject.replace(/^(re:\s*|fwd:\s*)+/i, '').trim();

  if (tone === 'brief') {
    return `Hi ${firstName},\n\nThanks for following up on "${cleanSubject}". I've received your note and will review it shortly.\n\nBest,\n${myName}`;
  } else if (tone === 'casual') {
    return `Hey ${firstName},\n\nThanks for reaching out! Got your email about "${cleanSubject}". I'm on it and will send over my feedback soon.\n\nCheers,\n${myName}`;
  } else {
    // Professional
    return `Hi ${firstName},\n\nThank you for reaching out regarding "${cleanSubject}". I have received your message and will review the details carefully before getting back to you with next steps.\n\nBest regards,\n${myName}`;
  }
}

/**
 * Smart categorization of email
 */
function categorizeEmail(subject, text, tone = 'professional', userEmail = '') {
  const subjStr = typeof subject === 'string' ? subject : (subject != null ? String(subject) : '');
  const textStr = typeof text === 'string' ? text : (text != null ? String(text) : '');
  const content = (subjStr + ' ' + textStr).toLowerCase();
  
  if (content.includes('invoice') || content.includes('receipt') || content.includes('payment') || content.includes('order confirmation') || content.includes('subscription renewed') || content.includes('paid')) {
    return {
      category: 'receipt',
      needsReply: false,
      urgency: 'low',
      summary: 'Billing or transaction receipt. No action required.'
    };
  }

  if (content.includes('newsletter') || content.includes('unsubscribe') || content.includes('digest') || content.includes('weekly edition') || content.includes('view in browser')) {
    return {
      category: 'newsletter',
      needsReply: false,
      urgency: 'low',
      summary: 'Automated newsletter or broadcast update.'
    };
  }

  if (content.includes('security alert') || content.includes('new sign-in') || content.includes('password reset') || content.includes('verify your account') || content.includes('2-step verification')) {
    return {
      category: 'notification',
      needsReply: false,
      urgency: 'high',
      summary: 'Automated security alert or authentication notice.'
    };
  }

  if (content.includes('review') || content.includes('feedback') || content.includes('sign off') || content.includes('deadline') || content.includes('approve') || content.includes('action required')) {
    const isUrgent = content.includes('urgent') || content.includes('asap') || content.includes('today') || content.includes('immediate');
    return {
      category: 'action_request',
      needsReply: true,
      urgency: isUrgent ? 'high' : 'medium',
      summary: 'Action requested: Needs your review, feedback, or approval.'
    };
  }

  if (content.includes('?') || content.includes('could you') || content.includes('can you') || content.includes('what do you think') || content.includes('question')) {
    const isUrgent = content.includes('urgent') || content.includes('asap') || content.includes('today');
    return {
      category: 'direct_question',
      needsReply: true,
      urgency: isUrgent ? 'high' : 'medium',
      summary: 'Direct question received requiring your response.'
    };
  }

  const isUrgent = content.includes('urgent') || content.includes('asap') || content.includes('critical') || content.includes('today');
  return {
    category: 'direct_message',
    needsReply: true,
    urgency: isUrgent ? 'high' : 'medium',
    summary: 'Direct personal email requiring your attention.'
  };
}

/**
 * Parse an ImapFlow message or raw mail item safely
 */
async function parseEmailItem(item, credentialsOrUser = '', tone = 'professional') {
  if (!item) return null;

  const userEmail = typeof credentialsOrUser === 'string'
    ? credentialsOrUser
    : (credentialsOrUser?.email || credentialsOrUser?.user || '');

  // If item is already parsed or from ImapFlow
  const id = item.uid || item.attributes?.uid || item.seq || item.seqno || Math.random().toString(36).slice(2);
  let parsed = { subject: 'No Subject', text: '', html: '' };

  if (item.source) {
    try {
      parsed = await simpleParser(item.source);
    } catch (pErr) {
      parsed = {
        subject: item.envelope?.subject || 'Subject parse error',
        text: String(item.source || '')
      };
    }
  } else if (item.parts && Array.isArray(item.parts)) {
    const allParts = item.parts.find(part => part && part.which === '') || item.parts[0];
    if (allParts && allParts.body) {
      try {
        parsed = await simpleParser(allParts.body);
      } catch (pErr) {
        parsed = { subject: 'Subject parse error', text: String(allParts.body || '') };
      }
    }
  }

  const rawSubject = parsed?.subject || item.envelope?.subject || item.subject || 'No Subject';
  const subject = typeof rawSubject === 'string' && rawSubject.trim() ? rawSubject : 'No Subject';

  let sender = 'Unknown';
  let senderEmail = 'unknown@domain.com';

  if (parsed?.from?.value && Array.isArray(parsed.from.value) && parsed.from.value[0]) {
    const fromObj = parsed.from.value[0];
    sender = fromObj.name || fromObj.address || 'Unknown';
    senderEmail = fromObj.address || 'unknown@domain.com';
  } else if (item.envelope?.from && Array.isArray(item.envelope.from) && item.envelope.from[0]) {
    const fromObj = item.envelope.from[0];
    sender = fromObj.name || fromObj.address || 'Unknown';
    senderEmail = fromObj.address || 'unknown@domain.com';
  } else if (item.sender || item.sender_name) {
    sender = item.sender || item.sender_name;
    senderEmail = item.senderEmail || item.sender_email || 'unknown@domain.com';
  }

  const parsedDate = parsed?.date
    ? new Date(parsed.date)
    : (item.internalDate ? new Date(item.internalDate) : (item.receivedAt || item.received_at ? new Date(item.receivedAt || item.received_at) : new Date()));
  const dateStr = isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
  const bodyText = parsed?.text || item.body_plain || item.body || '';
  const bodyHtml = parsed?.html || parsed?.textAsHtml || parsed?.text || item.body || bodyText;

  const { category, needsReply, urgency, summary } = categorizeEmail(subject, bodyText, tone, userEmail);
  const draft = needsReply ? generateDraft(sender, subject, bodyText, userEmail, tone) : null;

  return {
    id: id.toString(),
    seqno: item.seq || item.seqno,
    uid: item.uid,
    sender,
    sender_name: sender,
    sender_email: senderEmail,
    senderEmail,
    subject,
    received_at: dateStr,
    receivedAt: dateStr,
    body_plain: bodyText,
    body: bodyHtml || bodyText,
    category,
    needs_reply: needsReply,
    needsReply,
    urgency,
    ai_summary: summary,
    summary,
    draft: draft ? { id: `dr_${id}`, status: 'pending_approval', body: draft } : null,
    draftBody: draft,
    draftStatus: needsReply ? 'pending' : null
  };
}

/**
 * Detect sender name from Sent mailbox if available
 */
async function detectSenderName(client, userEmail) {
  if (!client || !userEmail) return null;
  const sentMailboxNames = ['[Gmail]/Sent Mail', 'Sent', 'Sent Messages', 'INBOX'];
  for (const box of sentMailboxNames) {
    try {
      const lock = await client.getMailboxLock(box);
      try {
        const total = client.mailbox ? client.mailbox.exists : 0;
        if (total > 0) {
          const fetchRange = `${Math.max(1, total - 5)}:*`;
          for await (let msg of client.fetch(fetchRange, { envelope: true })) {
            if (msg.envelope && Array.isArray(msg.envelope.from)) {
              for (const fromObj of msg.envelope.from) {
                if (fromObj.address && fromObj.address.toLowerCase() === userEmail.toLowerCase() && fromObj.name) {
                  return fromObj.name.trim();
                }
              }
            }
          }
        }
      } finally {
        lock.release();
      }
    } catch (_) {}
  }
  return null;
}

/**
 * Test credentials and verify IMAP connection on-demand
 */
async function testConnection(credentials) {
  let client;
  try {
    const creds = resolveClientCredentials(credentials);
    if (!creds.emailUser || !creds.emailPass) {
      return { success: false, error: 'Email and password/App Password are required.' };
    }

    client = await getMailClient(credentials);
    const lock = await client.getMailboxLock('INBOX');
    let total = 0;
    let unread = 0;
    try {
      total = client.mailbox ? client.mailbox.exists || 0 : 0;
      try {
        const unreadList = await client.search({ seen: false });
        unread = Array.isArray(unreadList) ? unreadList.length : 0;
      } catch {
        unread = 0;
      }
    } finally {
      lock.release();
    }

    let detectedName = null;
    try {
      detectedName = await detectSenderName(client, creds.emailUser);
    } catch (_) {}

    return { success: true, totalMessages: total, unreadMessages: unread, detectedName };
  } catch (err) {
    console.error('[testConnection] Verification error:', err.message || err);
    return { success: false, error: err.message || 'Failed to authenticate with IMAP server. Verify your credentials.' };
  } finally {
    if (client) {
      try {
        await client.logout();
      } catch (_) {}
    }
  }
}

/**
 * Fetch emails from IMAP inbox or specified folder using connect-on-demand
 */
async function fetchEmails(credentials, options = {}) {
  const opts = options || {};
  const limit = opts.limit ? parseInt(opts.limit, 10) : 15;
  const folder = opts.folder || 'INBOX';
  const creds = resolveClientCredentials(credentials);
  const tone = opts.tone || creds.tone || 'professional';

  if (!creds.emailUser || !creds.emailPass) {
    return { success: false, error: 'Mail client credentials are not configured.', emails: [], total: 0 };
  }

  let client;
  try {
    client = await getMailClient(credentials);
    const lock = await client.getMailboxLock(folder);
    const emails = [];
    let total = 0;

    try {
      total = client.mailbox ? client.mailbox.exists || 0 : 0;
      if (total > 0) {
        const fetchCount = Math.min(total, limit);
        const fromSeq = Math.max(1, total - fetchCount + 1);
        const range = `${fromSeq}:*`;

        for await (let msg of client.fetch(range, { source: true, flags: true, envelope: true, uid: true, internalDate: true })) {
          try {
            const parsed = await parseEmailItem(msg, creds.emailUser, tone);
            if (parsed) emails.push(parsed);
          } catch (itemErr) {
            console.warn('[fetchEmails] Skipping unparseable email item:', itemErr.message);
          }
        }
      }
    } finally {
      lock.release();
    }

    emails.sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));
    return { success: true, emails, total };
  } catch (err) {
    console.error('[fetchEmails] Error:', err.message || err);
    return {
      success: false,
      error: err.message || 'Failed to fetch emails from mail server.',
      emails: [],
      total: 0
    };
  } finally {
    if (client) {
      try {
        await client.logout();
      } catch (_) {}
    }
  }
}

/**
 * Fetch extended email history with pagination / date filters using connect-on-demand
 */
async function fetchEmailHistory(credentials, options = {}) {
  const opts = options || {};
  const limit = opts.limit ? parseInt(opts.limit, 10) : 50;
  const offset = opts.offset ? parseInt(opts.offset, 10) : 0;
  const folder = opts.folder || 'INBOX';
  const creds = resolveClientCredentials(credentials);
  const tone = opts.tone || creds.tone || 'professional';

  if (!creds.emailUser || !creds.emailPass) {
    return { success: false, error: 'Mail client credentials are required.', emails: [], total: 0, hasMore: false };
  }

  let client;
  try {
    client = await getMailClient(credentials);
    const lock = await client.getMailboxLock(folder);
    const emails = [];
    let total = 0;
    let fromSeq = 1;

    try {
      total = client.mailbox ? client.mailbox.exists || 0 : 0;
      if (total > 0) {
        const fetchCount = Math.min(total - offset, limit);
        if (fetchCount > 0) {
          const toSeq = Math.max(1, total - offset);
          fromSeq = Math.max(1, toSeq - fetchCount + 1);
          const range = `${fromSeq}:${toSeq}`;

          for await (let msg of client.fetch(range, { source: true, flags: true, envelope: true, uid: true, internalDate: true })) {
            try {
              const parsed = await parseEmailItem(msg, creds.emailUser, tone);
              if (parsed) emails.push(parsed);
            } catch (itemErr) {
              console.warn('[fetchEmailHistory] Skipping unparseable history email item:', itemErr.message);
            }
          }
        }
      }
    } finally {
      lock.release();
    }

    emails.sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));
    return {
      success: true,
      emails,
      total,
      offset,
      limit,
      hasMore: fromSeq > 1
    };
  } catch (err) {
    console.error('[fetchEmailHistory] Error:', err.message || err);
    return {
      success: false,
      error: err.message || 'Failed to retrieve email history.',
      emails: [],
      total: 0,
      hasMore: false
    };
  } finally {
    if (client) {
      try {
        await client.logout();
      } catch (_) {}
    }
  }
}

/**
 * Synchronization function with connect-on-demand & complete connection lifecycle
 */
async function syncInbox(credentialsOrOptions = {}, maybeOptions = {}) {
  let credentials;
  let options;

  if (credentialsOrOptions && (credentialsOrOptions.email || credentialsOrOptions.user)) {
    credentials = credentialsOrOptions;
    options = maybeOptions || {};
  } else {
    options = credentialsOrOptions || {};
    credentials = options.credentials || resolveClientCredentials();
  }

  const { emailUser, emailPass, tone } = resolveClientCredentials(credentials);
  if (!emailUser || !emailPass) {
    return {
      success: false,
      error: 'Mail client is not connected or initialized. Missing EMAIL_USER or EMAIL_PASS environment variables.',
      emails: [],
      total: 0
    };
  }

  const searchCriteria = options.search || options.searchCriteria || ['UNSEEN'];
  const folder = options.folder || 'INBOX';
  const limit = options.limit ? parseInt(options.limit, 10) : 25;
  const replyTone = options.tone || tone || 'professional';

  let client;
  try {
    client = await getMailClient(credentials);
    let lock = await client.getMailboxLock(folder);
    const emails = [];

    try {
      const totalMessages = client.mailbox ? client.mailbox.exists || 0 : 0;
      if (totalMessages > 0) {
        let searchQuery = { seen: false };
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

        if ((!messageUids || messageUids.length === 0) && !options.strictUnseen) {
          const fetchCount = Math.min(totalMessages, limit);
          const fromSeq = Math.max(1, totalMessages - fetchCount + 1);
          for await (let msg of client.fetch(`${fromSeq}:*`, { source: true, flags: true, envelope: true, uid: true, internalDate: true })) {
            try {
              const parsed = await parseEmailItem(msg, emailUser, replyTone);
              if (parsed) emails.push(parsed);
            } catch (pErr) {
              console.warn('[syncInbox] Error parsing message:', pErr.message);
            }
          }
        } else if (Array.isArray(messageUids) && messageUids.length > 0) {
          const uidsToFetch = messageUids.slice(-limit);
          for await (let msg of client.fetch(uidsToFetch.join(','), { source: true, flags: true, envelope: true, uid: true, internalDate: true }, { uid: true })) {
            try {
              const parsed = await parseEmailItem(msg, emailUser, replyTone);
              if (parsed) emails.push(parsed);
            } catch (pErr) {
              console.warn('[syncInbox] Error parsing message:', pErr.message);
            }
          }
        }
      }
    } finally {
      lock.release();
    }

    emails.sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));

    return {
      success: true,
      emails,
      total: emails.length,
      searchCriteria
    };
  } catch (error) {
    console.error('Sync failed:', error.message);
    return {
      success: false,
      message: error.message,
      error: error.message || 'Sync failed: Mail client is not connected or initialized.',
      emails: [],
      total: 0
    };
  } finally {
    if (client) {
      try {
        await client.logout();
      } catch (_) {}
    }
  }
}

/**
 * Search email history across subjects, bodies, and senders
 */
async function searchEmailHistory(credentials, options = {}) {
  const opts = options || {};
  const { query = '', sender = '', subject = '', limit = 50 } = opts;
  const historyRes = await fetchEmailHistory(credentials, { limit, folder: 'INBOX' });
  
  if (!historyRes.success) return historyRes;

  const q = typeof query === 'string' ? query.toLowerCase().trim() : '';
  const sSender = typeof sender === 'string' ? sender.toLowerCase().trim() : '';
  const sSubj = typeof subject === 'string' ? subject.toLowerCase().trim() : '';

  let matched = Array.isArray(historyRes.emails) ? historyRes.emails : [];

  if (sSender) {
    matched = matched.filter(e => {
      const senderName = e?.sender ?? e?.sender_name ?? '';
      const senderEmail = e?.senderEmail ?? e?.sender_email ?? '';
      const matchName = typeof senderName === 'string' && senderName.toLowerCase().includes(sSender);
      const matchEmail = typeof senderEmail === 'string' && senderEmail.toLowerCase().includes(sSender);
      return matchName || matchEmail;
    });
  }
  if (sSubj) {
    matched = matched.filter(e => {
      const subj = e?.subject ?? '';
      return typeof subj === 'string' && subj.toLowerCase().includes(sSubj);
    });
  }
  if (q) {
    matched = matched.filter(e => {
      const subj = e?.subject ?? '';
      const senderName = e?.sender ?? e?.sender_name ?? '';
      const senderEmail = e?.senderEmail ?? e?.sender_email ?? '';
      const summ = e?.summary ?? e?.ai_summary ?? '';
      const body = e?.body_plain ?? e?.body ?? '';
      const snip = e?.snippet ?? '';

      const matchSubj = typeof subj === 'string' && subj.toLowerCase().includes(q);
      const matchName = typeof senderName === 'string' && senderName.toLowerCase().includes(q);
      const matchEmail = typeof senderEmail === 'string' && senderEmail.toLowerCase().includes(q);
      const matchSumm = typeof summ === 'string' && summ.toLowerCase().includes(q);
      const matchBody = typeof body === 'string' && body.toLowerCase().includes(q);
      const matchSnip = typeof snip === 'string' && snip.toLowerCase().includes(q);

      return matchSubj || matchName || matchEmail || matchSumm || matchBody || matchSnip;
    });
  }

  return {
    success: true,
    query,
    count: matched.length,
    emails: matched
  };
}

/**
 * AI Lookback / Natural Language Question answering over real email history
 */
function askEmailHistory(question, emails = []) {
  const q = typeof question === 'string' ? question.toLowerCase() : '';
  const emailList = Array.isArray(emails) ? emails : [];

  if (emailList.length === 0) {
    return "No emails found in history to analyze. Make sure your email account is connected.";
  }

  if (q.includes('week') || q.includes('miss') || q.includes('recent') || q.includes('summary') || q.includes('overview')) {
    const total = emailList.length;
    const needsReply = emailList.filter(e => e?.needsReply || e?.needs_reply);
    const receipts = emailList.filter(e => e?.category === 'receipt');
    const newsletters = emailList.filter(e => e?.category === 'newsletter');

    let answer = `Here is your email history overview across **${total} emails** analyzed:\n\n`;
    if (needsReply.length > 0) {
      answer += `### ⚡ Emails Needing Attention (${needsReply.length}):\n`;
      needsReply.slice(0, 5).forEach(e => {
        const sender = e?.sender || e?.sender_name || 'Unknown';
        const subj = e?.subject ?? 'No Subject';
        const sum = e?.summary || e?.ai_summary || '';
        answer += `• **${sender}** — "${subj}": ${sum}\n`;
      });
      if (needsReply.length > 5) {
        answer += `• ...and ${needsReply.length - 5} more.\n`;
      }
      answer += '\n';
    } else {
      answer += `✅ **All clear:** No urgent emails currently pending a reply.\n\n`;
    }

    answer += `### 📊 Activity Breakdown:\n`;
    answer += `• **${receipts.length}** invoices / receipts processed.\n`;
    answer += `• **${newsletters.length}** newsletters & automated digests.\n`;
    answer += `• **${Math.max(0, total - needsReply.length - receipts.length - newsletters.length)}** direct or FYI messages.`;

    return answer;
  }

  if (q.includes('urgent') || q.includes('reply') || q.includes('action')) {
    const urgent = emailList.filter(e => (e?.needsReply || e?.needs_reply) && (e?.draftStatus === 'pending' || e?.draft?.status === 'pending_approval'));
    if (!urgent.length) {
      return '✅ You have no urgent unanswered emails in your current email history window.';
    }
    return `Found **${urgent.length} email(s) awaiting your action/reply**:\n\n` +
      urgent.map(e => {
        const sender = e?.sender || e?.sender_name || 'Unknown';
        const urgency = e?.urgency || 'medium';
        const subj = e?.subject ?? 'No Subject';
        const sum = e?.summary || e?.ai_summary || '';
        return `• **${sender}** (${urgency} urgency)\n  Subject: *${subj}*\n  Summary: ${sum}`;
      }).join('\n\n');
  }

  if (q.includes('receipt') || q.includes('invoice') || q.includes('billing') || q.includes('paid') || q.includes('payment')) {
    const receipts = emailList.filter(e => {
      const cat = e?.category ?? '';
      const subj = e?.subject ?? '';
      const body = e?.body_plain ?? e?.body ?? '';
      const full = (subj + ' ' + body).toLowerCase();
      return cat === 'receipt' || full.includes('invoice') || full.includes('receipt');
    });
    if (!receipts.length) {
      return 'No receipts or invoices were found in your recent email history.';
    }
    return `Found **${receipts.length} receipt/invoice email(s)**:\n\n` +
      receipts.map(e => {
        const sender = e?.sender || e?.sender_name || 'Unknown';
        const subj = e?.subject ?? 'No Subject';
        const sum = e?.summary || e?.ai_summary || '';
        return `• **${sender}**: *${subj}* (${sum})`;
      }).join('\n');
  }

  if (q.includes('who') && (q.includes('most') || q.includes('frequent'))) {
    const counts = {};
    emailList.forEach(e => {
      const s = e?.sender || e?.sender_name || 'Unknown';
      counts[s] = (counts[s] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return `Top senders in your email history:\n\n` +
      sorted.slice(0, 5).map(([sender, count]) => `• **${sender}**: ${count} email(s)`).join('\n');
  }

  // General keyword search
  const keywords = q.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').filter(w => w.length > 2 && !['find', 'what', 'show', 'emails', 'about', 'from', 'with', 'have'].includes(w));
  
  const matches = emailList.filter(e => {
    const subj = e?.subject ?? '';
    const sender = e?.sender ?? e?.sender_name ?? '';
    const sum = e?.summary ?? e?.ai_summary ?? '';
    const body = e?.body_plain ?? e?.body ?? '';
    const blob = (subj + ' ' + sender + ' ' + sum + ' ' + body).toLowerCase();
    return keywords.some(k => blob.includes(k));
  });

  if (matches.length > 0) {
    return `Found **${matches.length} matching email(s)** regarding "${question}":\n\n` +
      matches.slice(0, 6).map(e => {
        const sender = e?.sender || e?.sender_name || 'Unknown';
        const subj = e?.subject ?? 'No Subject';
        const rawDate = e?.receivedAt || e?.received_at;
        const dateStr = rawDate ? new Date(rawDate).toLocaleDateString() : 'Recent';
        const sum = e?.summary || e?.ai_summary || '';
        return `• **${sender}** — *${subj}*\n  Date: ${dateStr}\n  Summary: ${sum}`;
      }).join('\n\n');
  }

  return `Searched ${emailList.length} emails in history, but found no exact matches for "${question}". Try asking with specific names, subjects, or keywords like "invoices", "urgent", or "summarize this week".`;
}

/**
 * Send an email reply using SMTP
 */
async function sendEmailReply(credentials, emailData) {
  const { to, subject, body, inReplyTo, references } = emailData || {};
  const { emailUser, emailPass } = resolveClientCredentials(credentials);
  if (!emailUser || !emailPass) {
    throw new Error('Sender credentials (EMAIL_USER / EMAIL_PASS) are required.');
  }
  const smtpConfig = getSmtpConfig(credentials);
  const transporter = nodemailer.createTransport(smtpConfig);

  const safeSubject = typeof subject === 'string' ? subject : '';
  const mailOptions = {
    from: emailUser,
    to,
    subject: safeSubject.startsWith('Re:') ? safeSubject : `Re: ${safeSubject}`,
    text: body || '',
    inReplyTo,
    references
  };

  const info = await transporter.sendMail(mailOptions);
  return { success: true, messageId: info.messageId, response: info.response };
}

/**
 * Local Config Management for Terminal Agent & Web Bridge
 */
function loadLocalConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    // ignore
  }

  loadEnvFiles();
  // Fallback to environment variables
  if ((process.env.EMAIL_USER || process.env.GMAIL_USER || process.env.MAILMIND_EMAIL) &&
      (process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD || process.env.MAILMIND_PASSWORD)) {
    return {
      email: process.env.EMAIL_USER || process.env.GMAIL_USER || process.env.MAILMIND_EMAIL,
      password: (process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD || process.env.MAILMIND_PASSWORD || '').replace(/\s+/g, ''),
      provider: process.env.EMAIL_PROVIDER || process.env.MAILMIND_PROVIDER || 'gmail',
      tone: process.env.MAILMIND_TONE || 'professional',
      monitoringMode: process.env.MAILMIND_MONITORING_MODE || 'ask_permission',
      connected: true
    };
  }

  return null;
}

function saveLocalConfig(config) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (err) {
    return false;
  }
}

function clearLocalConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      fs.unlinkSync(CONFIG_PATH);
    }
    return true;
  } catch (err) {
    return false;
  }
}

module.exports = {
  getMailClient,
  connectImap,
  sanitizePassword,
  getImapConfig,
  getSmtpConfig,
  generateDraft,
  categorizeEmail,
  parseEmailItem,
  testConnection,
  fetchEmails,
  fetchEmailHistory,
  syncInbox,
  searchEmailHistory,
  askEmailHistory,
  sendEmailReply,
  loadLocalConfig,
  saveLocalConfig,
  clearLocalConfig,
  detectSenderName,
  safeSearch,
  safeIncludes,
  safeMatch
};
