const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(process.cwd(), '.mailmind-config.json');

/**
 * Safe string search helper
 * Returns the index of match, or -1 if not found or invalid
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
 * Clean password - for Gmail App Passwords, automatically strip spaces from "xxxx xxxx xxxx xxxx" format
 */
function sanitizePassword(password, email, provider) {
  if (!password) return '';
  const rawPass = typeof password === 'string' ? password : String(password);
  const trimmed = rawPass.trim();
  const prov = (provider ? String(provider) : '').toLowerCase();
  const domain = (email && typeof email === 'string' && email.includes('@') ? email.split('@')[1] || '' : '').toLowerCase();
  if (prov === 'gmail' || prov === 'google' || domain.includes('gmail') || domain.includes('googlemail')) {
    // If it looks like a 16-char app password with spaces (length 19), strip spaces
    if (trimmed.length === 19 && trimmed.split(' ').length === 4) {
      return trimmed.replace(/\s+/g, '');
    }
  }
  return trimmed;
}

/**
 * Resolve IMAP server settings based on provider or custom config
 */
function getImapConfig(credentials = {}) {
  const { email = '', password = '', provider = '', host, port } = credentials || {};
  const cleanPass = sanitizePassword(password, email, provider);
  let imapHost = host;
  let imapPort = port ? parseInt(port, 10) : 993;

  if (!imapHost) {
    const prov = (provider ? String(provider) : '').toLowerCase();
    const domain = (email && typeof email === 'string' && email.includes('@') ? email.split('@')[1] || '' : '').toLowerCase();

    if (prov === 'microsoft' || prov === 'outlook' || prov === 'office365' || domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live')) {
      imapHost = 'outlook.office365.com';
    } else if (prov === 'yahoo' || prov === 'aol' || domain.includes('yahoo') || domain.includes('aol')) {
      imapHost = 'imap.mail.yahoo.com';
    } else if (prov === 'icloud' || domain.includes('icloud') || domain.includes('me.com') || domain.includes('mac.com')) {
      imapHost = 'imap.mail.me.com';
    } else if (prov === 'zoho' || domain.includes('zoho')) {
      imapHost = 'imap.zoho.com';
    } else if (prov === 'fastmail' || domain.includes('fastmail')) {
      imapHost = 'imap.fastmail.com';
    } else {
      // Default to Gmail
      imapHost = 'imap.gmail.com';
    }
  }

  return {
    imap: {
      user: email,
      password: cleanPass,
      host: imapHost,
      port: imapPort,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 15000
    }
  };
}

/**
 * Resolve SMTP server settings for sending replies
 */
function getSmtpConfig(credentials = {}) {
  const { email = '', password = '', provider = '', smtpHost, smtpPort } = credentials || {};
  const cleanPass = sanitizePassword(password, email, provider);
  let host = smtpHost;
  let port = smtpPort ? parseInt(smtpPort, 10) : 587;
  let secure = port === 465;

  if (!host) {
    const prov = (provider ? String(provider) : '').toLowerCase();
    const domain = (email && typeof email === 'string' && email.includes('@') ? email.split('@')[1] || '' : '').toLowerCase();

    if (prov === 'microsoft' || prov === 'outlook' || domain.includes('outlook') || domain.includes('hotmail')) {
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
      user: email,
      pass: cleanPass
    },
    tls: {
      rejectUnauthorized: false
    }
  };
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
 * Test credentials and verify IMAP connection
 */
async function testConnection(credentials) {
  let connection;
  try {
    if (!credentials || !credentials.email || !credentials.password) {
      return { success: false, error: 'Email and password are required.' };
    }
    const config = getImapConfig(credentials);
    connection = await imaps.connect(config);

    if (!connection || (typeof connection.usable !== 'undefined' && !connection.usable)) {
      throw new Error('Mail client is not connected or initialized.');
    }

    const box = await connection.openBox('INBOX');
    if (!box) {
      throw new Error('Could not open mailbox INBOX.');
    }

    const total = box?.messages?.total ?? 0;
    const unread = box?.messages?.new ?? 0;
    
    if (connection?.end) {
      connection.end();
    }
    return { success: true, totalMessages: total, unreadMessages: unread };
  } catch (err) {
    if (connection?.end) {
      try { connection.end(); } catch (_) {}
    }
    return { success: false, error: err.message || 'Failed to authenticate with IMAP server.' };
  }
}

/**
 * Parse a raw mail item safely
 */
async function parseEmailItem(item, credentials, tone = 'professional') {
  if (!item) return null;
  const allParts = (item.parts && Array.isArray(item.parts))
    ? (item.parts.find(part => part && part.which === '') || item.parts[0])
    : null;
  const id = item.attributes?.uid || item.seqno || Math.random().toString(36).slice(2);

  let parsed = { subject: 'No Subject', text: '', html: '' };
  if (allParts && allParts.body) {
    try {
      parsed = await simpleParser(allParts.body);
    } catch (pErr) {
      parsed = { subject: 'Subject parse error', text: String(allParts.body || '') };
    }
  }

  const rawSubject = parsed?.subject ?? '';
  const subject = typeof rawSubject === 'string' && rawSubject.trim() ? rawSubject : 'No Subject';
  
  let sender = 'Unknown';
  let senderEmail = 'unknown@domain.com';
  if (parsed?.from?.value && Array.isArray(parsed.from.value) && parsed.from.value[0]) {
    const fromObj = parsed.from.value[0];
    sender = fromObj.name || fromObj.address || 'Unknown';
    senderEmail = fromObj.address || 'unknown@domain.com';
  }

  const parsedDate = parsed?.date ? new Date(parsed.date) : new Date();
  const dateStr = isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
  const bodyText = parsed?.text ?? '';
  const bodyHtml = parsed?.html || parsed?.textAsHtml || parsed?.text || '';

  const { category, needsReply, urgency, summary } = categorizeEmail(subject, bodyText, tone, credentials?.email ?? '');
  const draft = needsReply ? generateDraft(sender, subject, bodyText, credentials?.email ?? '', tone) : null;

  return {
    id: id.toString(),
    seqno: item.seqno,
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
 * Fetch emails from IMAP inbox or specified folder
 */
async function fetchEmails(credentials, options = {}) {
  const opts = options || {};
  const limit = opts.limit ? parseInt(opts.limit, 10) : 15;
  const folder = opts.folder || 'INBOX';
  const tone = opts.tone || credentials?.tone || 'professional';

  if (!credentials || !credentials.email || !credentials.password) {
    return { success: false, error: 'Mail client credentials are not configured.', emails: [], total: 0 };
  }

  let connection;
  try {
    const config = getImapConfig(credentials);
    connection = await imaps.connect(config);

    // Audit IMAP Connection
    if (!connection || (typeof connection.usable !== 'undefined' && !connection.usable)) {
      throw new Error('Mail client is not connected or initialized.');
    }

    const box = await connection.openBox(folder);
    if (!box || !box.messages) {
      throw new Error(`Mailbox "${folder}" is not accessible.`);
    }

    const total = box.messages.total ?? 0;
    if (total === 0) {
      if (connection?.end) connection.end();
      return { success: true, emails: [], total: 0 };
    }

    const fetchCount = Math.min(total, limit);
    const fromSeq = Math.max(1, total - fetchCount + 1);

    const fetchOptions = opts.fetchOptions || {
      bodies: ['HEADER', 'TEXT', ''],
      struct: true,
      markSeen: opts.markSeen ?? false
    };

    // Ensure search method is available before executing query
    if (!connection.seq || typeof connection.seq.search !== 'function') {
      throw new Error('Mail client is not connected or initialized.');
    }

    const results = await connection.seq.search([`${fromSeq}:*`], fetchOptions);
    const emails = [];

    if (Array.isArray(results)) {
      for (const item of results) {
        try {
          const parsed = await parseEmailItem(item, credentials, tone);
          if (parsed) {
            emails.push(parsed);
          }
        } catch (itemErr) {
          console.warn('[fetchEmails] Skipping unparseable email item:', itemErr.message);
        }
      }
    }

    if (connection?.end) connection.end();
    emails.sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));

    return { success: true, emails, total };
  } catch (err) {
    if (connection?.end) {
      try { connection.end(); } catch (_) {}
    }
    return {
      success: false,
      error: err.message || 'Failed to fetch emails from mail server.',
      emails: [],
      total: 0
    };
  }
}

/**
 * Fetch extended email history with pagination / date filters
 */
async function fetchEmailHistory(credentials, options = {}) {
  const opts = options || {};
  const limit = opts.limit ? parseInt(opts.limit, 10) : 50;
  const offset = opts.offset ? parseInt(opts.offset, 10) : 0;
  const folder = opts.folder || 'INBOX';
  const tone = opts.tone || credentials?.tone || 'professional';

  if (!credentials || !credentials.email || !credentials.password) {
    return { success: false, error: 'Mail client credentials are required.', emails: [], total: 0, hasMore: false };
  }

  let connection;
  try {
    const config = getImapConfig(credentials);
    connection = await imaps.connect(config);

    // Audit IMAP Connection
    if (!connection || (typeof connection.usable !== 'undefined' && !connection.usable)) {
      throw new Error('Mail client is not connected or initialized.');
    }

    const box = await connection.openBox(folder);
    if (!box || !box.messages) {
      throw new Error(`Mailbox "${folder}" is not accessible.`);
    }

    const total = box.messages.total ?? 0;
    if (total === 0) {
      if (connection?.end) connection.end();
      return { success: true, emails: [], total: 0, hasMore: false };
    }

    const fetchCount = Math.min(total - offset, limit);
    if (fetchCount <= 0) {
      if (connection?.end) connection.end();
      return { success: true, emails: [], total, hasMore: false };
    }

    const toSeq = Math.max(1, total - offset);
    const fromSeq = Math.max(1, toSeq - fetchCount + 1);

    const fetchOptions = opts.fetchOptions || {
      bodies: ['HEADER', 'TEXT', ''],
      struct: true,
      markSeen: opts.markSeen ?? false
    };

    // Ensure search method is available before executing query
    if (!connection.seq || typeof connection.seq.search !== 'function') {
      throw new Error('Mail client is not connected or initialized.');
    }

    const results = await connection.seq.search([`${fromSeq}:${toSeq}`], fetchOptions);
    const emails = [];

    if (Array.isArray(results)) {
      for (const item of results) {
        try {
          const parsed = await parseEmailItem(item, credentials, tone);
          if (parsed) {
            emails.push(parsed);
          }
        } catch (itemErr) {
          console.warn('[fetchEmailHistory] Skipping unparseable history email item:', itemErr.message);
        }
      }
    }

    if (connection?.end) connection.end();
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
    if (connection?.end) {
      try { connection.end(); } catch (_) {}
    }
    return {
      success: false,
      error: err.message || 'Failed to retrieve email history.',
      emails: [],
      total: 0,
      hasMore: false
    };
  }
}

/**
 * Synchronization function with default search fallback and graceful error handling
 */
async function syncInbox(credentialsOrOptions = {}, maybeOptions = {}) {
  let credentials;
  let options;

  if (credentialsOrOptions && credentialsOrOptions.email) {
    credentials = credentialsOrOptions;
    options = maybeOptions || {};
  } else {
    options = credentialsOrOptions || {};
    credentials = options.credentials || loadLocalConfig();
  }

  // Ensure default search criteria fallback
  const searchCriteria = options.search || options.searchCriteria || ['UNSEEN'];
  const folder = options.folder || 'INBOX';
  const limit = options.limit ? parseInt(options.limit, 10) : 25;
  const tone = options.tone || credentials?.tone || 'professional';

  if (!credentials || !credentials.email || !credentials.password) {
    return {
      success: false,
      error: 'Mail client is not connected or initialized.',
      emails: [],
      total: 0
    };
  }

  let connection;
  try {
    const config = getImapConfig(credentials);
    connection = await imaps.connect(config);

    // Audit connection
    if (!connection || (typeof connection.usable !== 'undefined' && !connection.usable)) {
      throw new Error('Mail client is not connected or initialized.');
    }

    const box = await connection.openBox(folder);
    if (!box || !box.messages) {
      throw new Error(`Mailbox "${folder}" is not accessible.`);
    }

    const fetchOptions = options.fetchOptions || {
      bodies: ['HEADER', 'TEXT', ''],
      struct: true,
      markSeen: options.markSeen ?? false
    };

    let results = [];
    const safeCriteria = Array.isArray(searchCriteria) ? searchCriteria : [searchCriteria || 'UNSEEN'];

    // Verify search method before execution
    if (typeof connection.search === 'function') {
      results = await connection.search(safeCriteria, fetchOptions);
    } else if (connection.seq && typeof connection.seq.search === 'function') {
      const total = box.messages.total ?? 0;
      if (total > 0) {
        const fetchCount = Math.min(total, limit);
        const fromSeq = Math.max(1, total - fetchCount + 1);
        results = await connection.seq.search([`${fromSeq}:*`], fetchOptions);
      }
    } else {
      throw new Error('Mail client is not connected or initialized.');
    }

    const emails = [];
    if (Array.isArray(results)) {
      // Wrap loop in try/catch so failure on a single email doesn't crash sync
      for (const item of results) {
        try {
          const parsed = await parseEmailItem(item, credentials, tone);
          if (parsed) {
            emails.push(parsed);
          }
        } catch (itemErr) {
          console.warn('[syncInbox] Skipping error in email item:', itemErr.message);
        }
      }
    }

    if (connection?.end) connection.end();
    emails.sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));

    return {
      success: true,
      emails,
      total: emails.length,
      searchCriteria: safeCriteria
    };
  } catch (err) {
    if (connection?.end) {
      try { connection.end(); } catch (_) {}
    }
    return {
      success: false,
      error: err.message || 'Email inbox synchronization failed.',
      emails: [],
      total: 0
    };
  }
}

/**
 * Search email history across subjects, bodies, and senders with safe string checks
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
  if (!credentials || !credentials.email) {
    throw new Error('Sender credentials are required.');
  }
  const smtpConfig = getSmtpConfig(credentials);
  const transporter = nodemailer.createTransport(smtpConfig);

  const safeSubject = typeof subject === 'string' ? subject : '';
  const mailOptions = {
    from: credentials.email,
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

  // Fallback to environment variables
  if (process.env.MAILMIND_EMAIL && process.env.MAILMIND_PASSWORD) {
    return {
      email: process.env.MAILMIND_EMAIL,
      password: process.env.MAILMIND_PASSWORD,
      provider: process.env.MAILMIND_PROVIDER || 'gmail',
      tone: process.env.MAILMIND_TONE || 'professional',
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
  safeSearch,
  safeIncludes,
  safeMatch,
  getImapConfig,
  getSmtpConfig,
  generateDraft,
  categorizeEmail,
  testConnection,
  fetchEmails,
  fetchEmailHistory,
  syncInbox,
  searchEmailHistory,
  askEmailHistory,
  sendEmailReply,
  loadLocalConfig,
  saveLocalConfig,
  clearLocalConfig
};
