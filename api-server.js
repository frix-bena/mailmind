const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const {
  getMailClient,
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
  safeSearch,
  safeIncludes,
  safeMatch
} = require('./lib/email-service');
const {
  sendDeviceNotification,
  formatEmailNotification,
  testDeviceNotification,
  getNotificationCapabilities
} = require('./lib/notification-service');

const app = express();
app.use(cors());
app.use(express.json());

// Helper to get credentials from request body or fallback to local config
function resolveCredentials(req) {
  const { email, password, provider, host, port, tone } = req.body || {};
  if (email && password) {
    return { email, password, provider: provider || 'gmail', host, port, tone: tone || 'professional' };
  }
  const saved = loadLocalConfig();
  if (saved && saved.email && saved.password) {
    return {
      ...saved,
      tone: tone || saved.tone || 'professional'
    };
  }
  return null;
}

// ── Auth & Status Endpoints ──────────────────────────────────────────

app.get('/api/auth/status', (req, res) => {
  try {
    const config = loadLocalConfig();
    if (config && config.email) {
      return res.json({
        connected: true,
        email: config.email,
        name: config.name || null,
        avatar: config.avatar || config.picture || config.photoUrl || null,
        picture: config.picture || config.avatar || config.photoUrl || null,
        avatarColor: config.avatarColor || config.color || null,
        color: config.color || config.avatarColor || null,
        provider: config.provider || 'gmail',
        tone: config.tone || 'professional',
        monitoringMode: config.monitoringMode || 'ask_permission',
        savedAt: config.savedAt
      });
    }
    res.json({ connected: false });
  } catch (err) {
    res.status(500).json({ connected: false, error: err.message || 'Status check failed.' });
  }
});

app.post('/api/auth/profile', (req, res) => {
  try {
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
      signature
    } = req.body || {};
    const existing = loadLocalConfig() || {};
    const updated = {
      ...existing,
      name: name !== undefined ? name : existing.name,
      avatar: avatar !== undefined ? avatar : existing.avatar,
      picture: picture !== undefined ? picture : (avatar !== undefined ? avatar : existing.picture),
      avatarColor: avatarColor !== undefined ? avatarColor : existing.avatarColor,
      color: color !== undefined ? color : (avatarColor !== undefined ? avatarColor : existing.color),
      tone: tone !== undefined ? tone : existing.tone,
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
    res.json({
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
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/auth/switch', (req, res) => {
  try {
    const { email, name, avatar, picture, avatarColor, color, password, provider, host, port, tone, monitoringMode, isDemo } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'Email address is required to switch account.' });
    }

    const existing = loadLocalConfig() || {};
    const updated = {
      ...existing,
      email: email.trim(),
      name: name !== undefined ? name : existing.name,
      avatar: avatar !== undefined ? avatar : existing.avatar,
      picture: picture !== undefined ? picture : existing.picture,
      avatarColor: avatarColor !== undefined ? avatarColor : existing.avatarColor,
      color: color !== undefined ? color : existing.color,
      provider: provider || existing.provider || 'google',
      tone: tone || existing.tone || 'professional',
      monitoringMode: monitoringMode !== undefined ? monitoringMode : (existing.monitoringMode || 'ask_permission'),
      connected: true,
      isDemo: isDemo !== undefined ? isDemo : existing.isDemo,
      updatedAt: new Date().toISOString()
    };

    if (password) updated.password = password;
    if (host !== undefined) updated.host = host;
    if (port !== undefined) updated.port = port;

    saveLocalConfig(updated);
    res.json({
      success: true,
      switched: true,
      email: updated.email,
      name: updated.name,
      provider: updated.provider,
      avatar: updated.avatar,
      picture: updated.picture,
      avatarColor: updated.avatarColor,
      color: updated.color,
      tone: updated.tone,
      monitoringMode: updated.monitoringMode
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/auth/connect', async (req, res) => {
  try {
    const { email, password, provider, host, port, tone, monitoringMode } = req.body || {};
    if (!email || !password || !String(password).trim()) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const credentials = {
      email,
      password,
      provider: provider || 'gmail',
      host,
      port,
      tone: tone || 'professional',
      monitoringMode: monitoringMode || 'ask_permission',
      connected: true,
      savedAt: new Date().toISOString()
    };

    const testResult = await testConnection(credentials);
    if (!testResult.success) {
      return res.status(401).json({
        error: testResult.error || 'Failed to authenticate with email server.',
        hint: 'Make sure your email address and password are correct, and IMAP access is enabled in your email provider settings.'
      });
    }

    const detectedName = testResult.detectedName || (email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
    credentials.name = detectedName;

    saveLocalConfig(credentials);
    res.json({
      success: true,
      connected: true,
      email: credentials.email,
      name: credentials.name,
      provider: credentials.provider,
      totalMessages: testResult.totalMessages,
      unreadMessages: testResult.unreadMessages
    });
  } catch (err) {
    res.status(500).json({
      error: err.message || 'Authentication error.',
      hint: 'Verify your email settings.'
    });
  }
});

app.post('/api/auth/disconnect', (req, res) => {
  try {
    clearLocalConfig();
    res.json({ success: true, connected: false });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Email Fetch, Sync & History Endpoints ─────────────────────────────

app.post('/api/fetch-emails', async (req, res) => {
  const credentials = resolveCredentials(req);
  if (!credentials) {
    return res.status(400).json({ error: 'No email credentials provided or saved.' });
  }

  const limit = req.body?.limit ? parseInt(req.body.limit, 10) : 15;
  const tone = req.body?.tone || credentials.tone || 'professional';
  const folder = req.body?.folder || 'INBOX';

  try {
    const result = await fetchEmails(credentials, { limit, tone, folder });
    if (!result.success) {
      return res.status(500).json({
        error: result.error || 'Failed to connect to email server.',
        hint: 'Check your email credentials and IMAP settings.'
      });
    }
    res.json(result);
  } catch (error) {
    console.error('Fetch emails error:', error);
    res.status(500).json({
      error: error.message || 'Failed to connect to email server.',
      hint: 'Check your email credentials and IMAP settings.'
    });
  }
});

app.post('/api/sync-inbox', async (req, res) => {
  let client;
  try {
    const credentials = resolveCredentials(req) || loadLocalConfig() || {};
    client = await getMailClient(credentials);
    const folder = req.body?.folder || 'INBOX';
    const limit = req.body?.limit ? parseInt(req.body.limit, 10) : 25;
    const tone = req.body?.tone || credentials.tone || 'professional';
    const userEmail = credentials.email || credentials.user || process.env.EMAIL_USER || process.env.GMAIL_USER || '';

    let lock = await client.getMailboxLock(folder);
    const emails = [];
    try {
      const totalMessages = client.mailbox ? client.mailbox.exists || 0 : 0;
      if (totalMessages > 0) {
        let searchQuery = { seen: false };
        const searchCriteria = req.body?.search || req.body?.searchCriteria || ['UNSEEN'];
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

        if ((!messageUids || messageUids.length === 0) && !req.body?.strictUnseen) {
          const fetchCount = Math.min(totalMessages, limit);
          const fromSeq = Math.max(1, totalMessages - fetchCount + 1);
          for await (let msg of client.fetch(`${fromSeq}:*`, { source: true, flags: true, envelope: true, uid: true, internalDate: true })) {
            try {
              const parsed = await parseEmailItem(msg, userEmail, tone);
              if (parsed) emails.push(parsed);
            } catch (pErr) {
              console.warn('[sync-inbox] Error parsing message:', pErr.message);
            }
          }
        } else if (Array.isArray(messageUids) && messageUids.length > 0) {
          const uidsToFetch = messageUids.slice(-limit);
          for await (let msg of client.fetch(uidsToFetch.join(','), { source: true, flags: true, envelope: true, uid: true, internalDate: true }, { uid: true })) {
            try {
              const parsed = await parseEmailItem(msg, userEmail, tone);
              if (parsed) emails.push(parsed);
            } catch (pErr) {
              console.warn('[sync-inbox] Error parsing message:', pErr.message);
            }
          }
        }
      }
    } finally {
      lock.release();
    }

    emails.sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));

    return res.json({
      success: true,
      emails,
      total: emails.length
    });
  } catch (error) {
    console.error('Sync failed:', error.message);
    return res.status(500).json({ success: false, message: error.message, error: error.message });
  } finally {
    if (client) {
      try {
        await client.logout();
      } catch (_) {}
    }
  }
});

app.post('/api/fetch-history', async (req, res) => {
  const credentials = resolveCredentials(req);
  if (!credentials) {
    return res.status(400).json({ error: 'No email credentials provided or saved.' });
  }

  const limit = req.body?.limit ? parseInt(req.body.limit, 10) : 50;
  const offset = req.body?.offset ? parseInt(req.body.offset, 10) : 0;
  const folder = req.body?.folder || 'INBOX';
  const since = req.body?.since || null;
  const tone = req.body?.tone || credentials.tone || 'professional';

  try {
    const result = await fetchEmailHistory(credentials, { limit, offset, folder, since, tone });
    if (!result.success) {
      return res.status(500).json({ error: result.error || 'Failed to retrieve email history.' });
    }
    res.json(result);
  } catch (error) {
    console.error('Fetch history error:', error);
    res.status(500).json({ error: error.message || 'Failed to retrieve email history.' });
  }
});

app.post('/api/search-history', async (req, res) => {
  const credentials = resolveCredentials(req);
  if (!credentials) {
    return res.status(400).json({ error: 'No email credentials provided or saved.' });
  }

  const { query, sender, subject, limit } = req.body || {};

  try {
    const result = await searchEmailHistory(credentials, {
      query: query || '',
      sender: sender || '',
      subject: subject || '',
      limit: limit ? parseInt(limit, 10) : 50
    });
    if (!result.success) {
      return res.status(500).json({ error: result.error || 'Search in email history failed.' });
    }
    res.json(result);
  } catch (error) {
    console.error('Search history error:', error);
    res.status(500).json({ error: error.message || 'Search in email history failed.' });
  }
});

app.post('/api/ask-inbox', async (req, res) => {
  const credentials = resolveCredentials(req);
  const { question, emails } = req.body || {};

  if (!question) {
    return res.status(400).json({ error: 'Question is required.' });
  }

  try {
    let emailData = emails;
    if (!emailData || emailData.length === 0) {
      if (credentials) {
        const hist = await fetchEmailHistory(credentials, { limit: 50 });
        emailData = hist?.emails || [];
      }
    }

    const answer = askEmailHistory(question, emailData || []);
    res.json({ success: true, question, answer });
  } catch (error) {
    console.error('Ask inbox error:', error);
    res.status(500).json({ error: error.message || 'AI analysis over history failed.' });
  }
});

app.post('/api/send-email', async (req, res) => {
  const credentials = resolveCredentials(req);
  if (!credentials) {
    return res.status(400).json({ error: 'No email credentials provided or saved.' });
  }

  const { to, subject, body, inReplyTo, references } = req.body || {};
  if (!to || !body) {
    return res.status(400).json({ error: 'Recipient "to" and message "body" are required.' });
  }

  try {
    const result = await sendEmailReply(credentials, { to, subject: subject || 'No Subject', body, inReplyTo, references });
    res.json(result);
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({ error: error.message || 'Failed to send email via SMTP.' });
  }
});

// ── Terminal Execution Endpoint ─────────────────────────────────────

app.post('/api/terminal/exec', (req, res) => {
  const { command } = req.body || {};
  if (!command) {
    return res.status(400).json({ error: 'Command string is required.' });
  }

  exec(command, { cwd: process.cwd(), maxBuffer: 1024 * 1024 * 5 }, (error, stdout, stderr) => {
    res.json({
      success: !error,
      exitCode: error ? error.code || 1 : 0,
      stdout: stdout || '',
      stderr: stderr || '',
      error: error ? error.message : null
    });
  });
});

// ── Device Notification Endpoints ─────────────────────────────────

app.get('/api/notifications', (req, res) => {
  try {
    const isTest = req.query.test === 'true' || req.query.action === 'test';
    if (isTest) {
      testDeviceNotification({
        title: req.query.title || '🔔 MailMind Device Notification Test',
        message: req.query.message || 'Device notifications are active and connected.'
      }).then(result => res.json(result))
        .catch(err => res.status(500).json({ success: false, error: err.message }));
      return;
    }
    const capabilities = getNotificationCapabilities();
    res.json({ success: true, status: 'ready', capabilities });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/notifications/test', async (req, res) => {
  try {
    const result = await testDeviceNotification({
      title: req.query.title || '🔔 MailMind Device Notification Test',
      message: req.query.message || 'Device notifications are working on your machine.'
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post(['/api/notifications', '/api/notifications/send'], async (req, res) => {
  try {
    const { title, message, body: altBody, urgency, category, sound, appName, icon, timeout, webhookUrl, isTest } = req.body || {};
    
    if (isTest) {
      const testResult = await testDeviceNotification({
        title: title || '🔔 MailMind Agent Active',
        message: message || altBody || 'Device notifications are working correctly.'
      });
      return res.json(testResult);
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

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Failed to send device notification.' });
  }
});

app.post('/api/notifications/test', async (req, res) => {
  try {
    const { title, message } = req.body || {};
    const result = await testDeviceNotification({
      title: title || '🔔 MailMind Device Notification Test',
      message: message || 'Device notifications verified successfully.'
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`\n📧 MailMind Email & Terminal Bridge API running on http://localhost:${PORT}`);
});
