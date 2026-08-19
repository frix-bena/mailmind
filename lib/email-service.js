const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(process.cwd(), '.mailmind-config.json');

/**
 * Resolve IMAP server settings based on provider or custom config
 */
function getImapConfig(credentials) {
  const { email, password, provider, host, port } = credentials;
  let imapHost = host;
  let imapPort = port ? parseInt(port, 10) : 993;

  if (!imapHost) {
    const prov = (provider || '').toLowerCase();
    const domain = (email.split('@')[1] || '').toLowerCase();

    if (prov === 'microsoft' || prov === 'outlook' || prov === 'office365' || domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live')) {
      imapHost = 'outlook.office365.com';
    } else if (prov === 'yahoo' || domain.includes('yahoo')) {
      imapHost = 'imap.mail.yahoo.com';
    } else if (prov === 'icloud' || domain.includes('icloud') || domain.includes('me.com')) {
      imapHost = 'imap.mail.me.com';
    } else {
      // Default to Gmail
      imapHost = 'imap.gmail.com';
    }
  }

  return {
    imap: {
      user: email,
      password: password,
      host: imapHost,
      port: imapPort,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 12000
    }
  };
}

/**
 * Resolve SMTP server settings for sending replies
 */
function getSmtpConfig(credentials) {
  const { email, password, provider, smtpHost, smtpPort } = credentials;
  let host = smtpHost;
  let port = smtpPort ? parseInt(smtpPort, 10) : 587;
  let secure = port === 465;

  if (!host) {
    const prov = (provider || '').toLowerCase();
    const domain = (email.split('@')[1] || '').toLowerCase();

    if (prov === 'microsoft' || prov === 'outlook' || domain.includes('outlook') || domain.includes('hotmail')) {
      host = 'smtp.office365.com';
      port = 587;
      secure = false;
    } else if (prov === 'yahoo' || domain.includes('yahoo')) {
      host = 'smtp.mail.yahoo.com';
      port = 465;
      secure = true;
    } else if (prov === 'icloud' || domain.includes('icloud') || domain.includes('me.com')) {
      host = 'smtp.mail.me.com';
      port = 587;
      secure = false;
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
      pass: password
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
  const firstName = senderName.split(' ')[0] || 'there';
  const myName = (userEmail ? userEmail.split('@')[0] : 'Me').replace(/[._]/g, ' ');
  const cleanSubject = subject.replace(/^(re:\s*|fwd:\s*)+/i, '').trim();

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
  const content = ((subject || '') + ' ' + (text || '')).toLowerCase();
  
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
  try {
    const config = getImapConfig(credentials);
    const connection = await imaps.connect(config);
    const box = await connection.openBox('INBOX');
    const total = box.messages.total;
    const unread = box.messages.new;
    connection.end();
    return { success: true, totalMessages: total, unreadMessages: unread };
  } catch (err) {
    return { success: false, error: err.message || 'Failed to authenticate with IMAP server.' };
  }
}

/**
 * Fetch emails from IMAP inbox or specified folder
 */
async function fetchEmails(credentials, options = {}) {
  const { limit = 15, folder = 'INBOX', tone = 'professional' } = options;
  const config = getImapConfig(credentials);

  const connection = await imaps.connect(config);
  const box = await connection.openBox(folder);
  const total = box.messages.total;

  if (total === 0) {
    connection.end();
    return { success: true, emails: [], total: 0 };
  }

  const fetchCount = Math.min(total, limit);
  const fromSeq = Math.max(1, total - fetchCount + 1);

  const fetchOptions = {
    bodies: ['HEADER', 'TEXT', ''],
    struct: true,
    markSeen: false
  };

  const results = await connection.seq.search([`${fromSeq}:*`], fetchOptions);
  const emails = [];

  for (const item of results) {
    const allParts = item.parts.find(part => part.which === '') || item.parts[0];
    const id = item.attributes.uid || item.seqno;

    let parsed = { subject: 'No Subject', text: '', html: '' };
    if (allParts && allParts.body) {
      try {
        parsed = await simpleParser(allParts.body);
      } catch (pErr) {
        parsed = { subject: 'Unreadable subject', text: String(allParts.body) };
      }
    }

    const subject = parsed.subject || 'No Subject';
    const sender = parsed.from && parsed.from.value && parsed.from.value[0] 
      ? (parsed.from.value[0].name || parsed.from.value[0].address) 
      : 'Unknown';
    const senderEmail = parsed.from && parsed.from.value && parsed.from.value[0] 
      ? parsed.from.value[0].address 
      : 'unknown@domain.com';
    const date = parsed.date || new Date();
    const bodyText = parsed.text || '';
    const bodyHtml = parsed.html || parsed.textAsHtml || parsed.text || '';

    const { category, needsReply, urgency, summary } = categorizeEmail(subject, bodyText, tone, credentials.email);
    const draft = needsReply ? generateDraft(sender, subject, bodyText, credentials.email, tone) : null;

    emails.push({
      id: id.toString(),
      seqno: item.seqno,
      sender,
      sender_name: sender,
      sender_email: senderEmail,
      senderEmail,
      subject,
      received_at: date.toISOString(),
      receivedAt: date.toISOString(),
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
    });
  }

  connection.end();
  emails.sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));

  return { success: true, emails, total };
}

/**
 * Fetch extended email history with pagination / date filters
 */
async function fetchEmailHistory(credentials, options = {}) {
  const { limit = 50, offset = 0, folder = 'INBOX', since = null, before = null, tone = 'professional' } = options;
  const config = getImapConfig(credentials);

  const connection = await imaps.connect(config);
  const box = await connection.openBox(folder);
  const total = box.messages.total;

  if (total === 0) {
    connection.end();
    return { success: true, emails: [], total: 0, hasMore: false };
  }

  const fetchCount = Math.min(total - offset, limit);
  if (fetchCount <= 0) {
    connection.end();
    return { success: true, emails: [], total, hasMore: false };
  }

  const toSeq = Math.max(1, total - offset);
  const fromSeq = Math.max(1, toSeq - fetchCount + 1);

  const fetchOptions = {
    bodies: ['HEADER', 'TEXT', ''],
    struct: true,
    markSeen: false
  };

  const results = await connection.seq.search([`${fromSeq}:${toSeq}`], fetchOptions);
  const emails = [];

  for (const item of results) {
    const allParts = item.parts.find(part => part.which === '') || item.parts[0];
    const id = item.attributes.uid || item.seqno;

    let parsed = { subject: 'No Subject', text: '', html: '' };
    if (allParts && allParts.body) {
      try {
        parsed = await simpleParser(allParts.body);
      } catch (pErr) {
        parsed = { subject: 'Subject parse error', text: String(allParts.body) };
      }
    }

    const subject = parsed.subject || 'No Subject';
    const sender = parsed.from && parsed.from.value && parsed.from.value[0] 
      ? (parsed.from.value[0].name || parsed.from.value[0].address) 
      : 'Unknown';
    const senderEmail = parsed.from && parsed.from.value && parsed.from.value[0] 
      ? parsed.from.value[0].address 
      : 'unknown@domain.com';
    const date = parsed.date || new Date();
    const bodyText = parsed.text || '';
    const bodyHtml = parsed.html || parsed.textAsHtml || parsed.text || '';

    const { category, needsReply, urgency, summary } = categorizeEmail(subject, bodyText, tone, credentials.email);
    const draft = needsReply ? generateDraft(sender, subject, bodyText, credentials.email, tone) : null;

    emails.push({
      id: id.toString(),
      seqno: item.seqno,
      sender,
      sender_name: sender,
      sender_email: senderEmail,
      senderEmail,
      subject,
      received_at: date.toISOString(),
      receivedAt: date.toISOString(),
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
    });
  }

  connection.end();
  emails.sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));

  return {
    success: true,
    emails,
    total,
    offset,
    limit,
    hasMore: fromSeq > 1
  };
}

/**
 * Search email history across subjects, bodies, and senders
 */
async function searchEmailHistory(credentials, options = {}) {
  const { query = '', sender = '', subject = '', limit = 50 } = options;
  const historyRes = await fetchEmailHistory(credentials, { limit, folder: 'INBOX' });
  
  if (!historyRes.success) return historyRes;

  const q = (query || '').toLowerCase().trim();
  const sSender = (sender || '').toLowerCase().trim();
  const sSubj = (subject || '').toLowerCase().trim();

  let matched = historyRes.emails;

  if (sSender) {
    matched = matched.filter(e => (e.sender && e.sender.toLowerCase().includes(sSender)) || (e.senderEmail && e.senderEmail.toLowerCase().includes(sSender)));
  }
  if (sSubj) {
    matched = matched.filter(e => e.subject && e.subject.toLowerCase().includes(sSubj));
  }
  if (q) {
    matched = matched.filter(e => 
      (e.subject && e.subject.toLowerCase().includes(q)) ||
      (e.sender && e.sender.toLowerCase().includes(q)) ||
      (e.senderEmail && e.senderEmail.toLowerCase().includes(q)) ||
      (e.summary && e.summary.toLowerCase().includes(q)) ||
      (e.body_plain && e.body_plain.toLowerCase().includes(q))
    );
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
  const q = (question || '').toLowerCase();

  if (!emails || emails.length === 0) {
    return "No emails found in history to analyze. Make sure your email account is connected.";
  }

  if (q.includes('week') || q.includes('miss') || q.includes('recent') || q.includes('summary') || q.includes('overview')) {
    const total = emails.length;
    const needsReply = emails.filter(e => e.needsReply || e.needs_reply);
    const receipts = emails.filter(e => e.category === 'receipt');
    const newsletters = emails.filter(e => e.category === 'newsletter');

    let answer = `Here is your email history overview across **${total} emails** analyzed:\n\n`;
    if (needsReply.length > 0) {
      answer += `### ⚡ Emails Needing Attention (${needsReply.length}):\n`;
      needsReply.slice(0, 5).forEach(e => {
        answer += `• **${e.sender || e.sender_name}** — "${e.subject}": ${e.summary || e.ai_summary}\n`;
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
    answer += `• **${total - needsReply.length - receipts.length - newsletters.length}** direct or FYI messages.`;

    return answer;
  }

  if (q.includes('urgent') || q.includes('reply') || q.includes('action')) {
    const urgent = emails.filter(e => (e.needsReply || e.needs_reply) && (e.draftStatus === 'pending' || e.draft?.status === 'pending_approval'));
    if (!urgent.length) {
      return '✅ You have no urgent unanswered emails in your current email history window.';
    }
    return `Found **${urgent.length} email(s) awaiting your action/reply**:\n\n` +
      urgent.map(e => `• **${e.sender || e.sender_name}** (${e.urgency || 'medium'} urgency)\n  Subject: *${e.subject}*\n  Summary: ${e.summary || e.ai_summary}`).join('\n\n');
  }

  if (q.includes('receipt') || q.includes('invoice') || q.includes('billing') || q.includes('paid') || q.includes('payment')) {
    const receipts = emails.filter(e => e.category === 'receipt' || (e.subject + ' ' + (e.body_plain || '')).toLowerCase().includes('invoice') || (e.subject + ' ' + (e.body_plain || '')).toLowerCase().includes('receipt'));
    if (!receipts.length) {
      return 'No receipts or invoices were found in your recent email history.';
    }
    return `Found **${receipts.length} receipt/invoice email(s)**:\n\n` +
      receipts.map(e => `• **${e.sender || e.sender_name}**: *${e.subject}* (${e.summary || e.ai_summary})`).join('\n');
  }

  if (q.includes('who') && (q.includes('most') || q.includes('frequent'))) {
    const counts = {};
    emails.forEach(e => {
      const s = e.sender || e.sender_name || 'Unknown';
      counts[s] = (counts[s] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return `Top senders in your email history:\n\n` +
      sorted.slice(0, 5).map(([sender, count]) => `• **${sender}**: ${count} email(s)`).join('\n');
  }

  // General keyword search
  const keywords = q.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').filter(w => w.length > 2 && !['find', 'what', 'show', 'emails', 'about', 'from', 'with', 'have'].includes(w));
  
  const matches = emails.filter(e => {
    const blob = ((e.subject || '') + ' ' + (e.sender || '') + ' ' + (e.summary || '') + ' ' + (e.body_plain || '')).toLowerCase();
    return keywords.some(k => blob.includes(k));
  });

  if (matches.length > 0) {
    return `Found **${matches.length} matching email(s)** regarding "${question}":\n\n` +
      matches.slice(0, 6).map(e => `• **${e.sender || e.sender_name}** — *${e.subject}*\n  Date: ${new Date(e.receivedAt || e.received_at).toLocaleDateString()}\n  Summary: ${e.summary || e.ai_summary}`).join('\n\n');
  }

  return `Searched ${emails.length} emails in history, but found no exact matches for "${question}". Try asking with specific names, subjects, or keywords like "invoices", "urgent", or "summarize this week".`;
}

/**
 * Send an email reply using SMTP
 */
async function sendEmailReply(credentials, emailData) {
  const { to, subject, body, inReplyTo, references } = emailData;
  const smtpConfig = getSmtpConfig(credentials);
  const transporter = nodemailer.createTransport(smtpConfig);

  const mailOptions = {
    from: credentials.email,
    to,
    subject: subject.startsWith('Re:') ? subject : `Re: ${subject}`,
    text: body,
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
  getImapConfig,
  getSmtpConfig,
  generateDraft,
  categorizeEmail,
  testConnection,
  fetchEmails,
  fetchEmailHistory,
  searchEmailHistory,
  askEmailHistory,
  sendEmailReply,
  loadLocalConfig,
  saveLocalConfig,
  clearLocalConfig
};
