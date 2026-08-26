const { exec, spawn } = require('child_process');
const os = require('os');
const http = require('http');
const https = require('https');
const { URL } = require('url');

/**
 * Cross-platform notification service for MailMind Agent.
 * Sends native desktop notifications to the user's device across Linux, macOS, and Windows,
 * with fallbacks for terminal bell, desktop tools, and webhook/push notifications (ntfy / pushover / slack).
 */

/**
 * Escape string for safe shell execution in double quotes
 */
function escapeShellArg(str) {
  if (str == null) return '';
  return String(str).replace(/(["`\\$!])/g, '\\$1');
}

/**
 * Escape string for AppleScript
 */
function escapeAppleScript(str) {
  if (str == null) return '';
  return String(str).replace(/[\\"]/g, '\\$&').replace(/\r?\n/g, ' ');
}

/**
 * Escape string for PowerShell
 */
function escapePowerShell(str) {
  if (str == null) return '';
  return String(str).replace(/[`"'$]/g, '`$&').replace(/\r?\n/g, ' ');
}

/**
 * Send an HTTP/HTTPS POST webhook notification (supports ntfy.sh, Pushover, Slack, Discord, custom webhooks)
 */
function sendWebhookPush(urlStr, payload) {
  return new Promise((resolve) => {
    try {
      if (!urlStr || typeof urlStr !== 'string') return resolve({ success: false, error: 'No URL provided' });
      const parsedUrl = new URL(urlStr);
      const isHttps = parsedUrl.protocol === 'https:';
      const client = isHttps ? https : http;

      const bodyData = JSON.stringify(payload);
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyData),
          'User-Agent': 'MailMind-Agent/1.0'
        },
        timeout: 5000
      };

      const req = client.request(options, (res) => {
        let resData = '';
        res.on('data', (chunk) => { resData += chunk; });
        res.on('end', () => {
          resolve({ success: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode });
        });
      });

      req.on('error', (err) => {
        resolve({ success: false, error: err.message });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ success: false, error: 'Webhook timeout' });
      });

      req.write(bodyData);
      req.end();
    } catch (e) {
      resolve({ success: false, error: e.message });
    }
  });
}

/**
 * Ring the terminal bell and print an OSC notification sequence
 */
function triggerTerminalAlert(title, message) {
  try {
    if (process.stdout && process.stdout.isTTY) {
      // Standard terminal bell
      process.stdout.write('\x07');
      // OSC 777 notification (supported by Kitty, WezTerm, Alacritty, iTerm2, Windows Terminal, etc.)
      process.stdout.write(`\x1b]777;notify;${title};${message}\x1b\\`);
      // OSC 9 notification (iTerm2, Terminal.app, Windows Terminal)
      process.stdout.write(`\x1b]9;${title}: ${message}\x1b\\`);
    }
  } catch (_) {}
}

/**
 * Send a native notification on Linux via notify-send, zenity, or kdialog
 */
function sendLinuxNotification({ title, message, urgency, appName, icon, timeout }) {
  return new Promise((resolve) => {
    let notifyUrgency = 'normal';
    if (urgency === 'high' || urgency === 'critical') notifyUrgency = 'critical';
    else if (urgency === 'low') notifyUrgency = 'low';

    const safeTitle = escapeShellArg(title || 'MailMind');
    const safeMsg = escapeShellArg(message || '');
    const safeApp = escapeShellArg(appName || 'MailMind Agent');
    const expireTime = timeout ? parseInt(timeout, 10) : 6000;

    // Build notify-send command
    let iconArg = '';
    if (icon) {
      iconArg = `-i "${escapeShellArg(icon)}"`;
    } else {
      iconArg = `-i "mail-unread"`;
    }

    const cmd = `notify-send -a "${safeApp}" -u "${notifyUrgency}" -t ${expireTime} ${iconArg} "${safeTitle}" "${safeMsg}"`;

    exec(cmd, { timeout: 4000 }, (error) => {
      if (!error) {
        return resolve({ success: true, method: 'notify-send' });
      }

      // Fallback 1: zenity --notification
      const zenityCmd = `zenity --notification --text="${safeTitle}: ${safeMsg}"`;
      exec(zenityCmd, { timeout: 4000 }, (zErr) => {
        if (!zErr) {
          return resolve({ success: true, method: 'zenity' });
        }

        // Fallback 2: kdialog
        const kdialogCmd = `kdialog --passivepopup "${safeTitle}: ${safeMsg}" 5`;
        exec(kdialogCmd, { timeout: 4000 }, (kErr) => {
          if (!kErr) {
            return resolve({ success: true, method: 'kdialog' });
          }

          // Fallback 3: terminal bell and OSC
          triggerTerminalAlert(title, message);
          resolve({
            success: true,
            method: 'terminal-bell',
            note: 'Desktop notification daemon not reachable; emitted terminal alert.'
          });
        });
      });
    });
  });
}

/**
 * Send a native notification on macOS via osascript
 */
function sendMacNotification({ title, message, sound, subtitle }) {
  return new Promise((resolve) => {
    const safeTitle = escapeAppleScript(title || 'MailMind');
    const safeMsg = escapeAppleScript(message || '');
    const safeSub = subtitle ? `subtitle "${escapeAppleScript(subtitle)}" ` : '';
    const soundClause = sound !== false ? 'sound name "Glass"' : '';

    const script = `display notification "${safeMsg}" with title "${safeTitle}" ${safeSub}${soundClause}`;
    const cmd = `osascript -e '${script}'`;

    exec(cmd, { timeout: 4000 }, (error) => {
      if (!error) {
        return resolve({ success: true, method: 'osascript' });
      }
      triggerTerminalAlert(title, message);
      resolve({ success: false, method: 'osascript', error: error.message });
    });
  });
}

/**
 * Send a native notification on Windows via PowerShell
 */
function sendWindowsNotification({ title, message, sound, appName }) {
  return new Promise((resolve) => {
    const safeTitle = escapePowerShell(title || 'MailMind');
    const safeMsg = escapePowerShell(message || '');
    const safeApp = escapePowerShell(appName || 'MailMind');

    // PowerShell script using Windows 10/11 Toast Notifications or Balloon Tip
    const psScript = `
      [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null
      $template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
      $textNodes = $template.GetElementsByTagName("text")
      $textNodes.Item(0).AppendChild($template.CreateTextNode("${safeTitle}")) > $null
      $textNodes.Item(1).AppendChild($template.CreateTextNode("${safeMsg}")) > $null
      $toast = [Windows.UI.Notifications.ToastNotification]::new($template)
      [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("${safeApp}").Show($toast)
    `.replace(/\r?\n/g, ' ');

    const cmd = `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "${psScript}"`;

    exec(cmd, { timeout: 5000 }, (error) => {
      if (!error) {
        return resolve({ success: true, method: 'powershell-toast' });
      }

      // Fallback: msg or balloon
      const msgCmd = `powershell -NoProfile -Command "[System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms'); $notify = New-Object System.Windows.Forms.NotifyIcon; $notify.Icon = [System.Drawing.SystemIcons]::Information; $notify.Visible = $True; $notify.ShowBalloonTip(5000, '${safeTitle}', '${safeMsg}', [System.Windows.Forms.ToolTipIcon]::Info)"`;
      exec(msgCmd, { timeout: 5000 }, (err2) => {
        if (!err2) {
          return resolve({ success: true, method: 'powershell-balloon' });
        }
        triggerTerminalAlert(title, message);
        resolve({ success: false, method: 'powershell', error: error.message });
      });
    });
  });
}

/**
 * Main dispatcher to send notifications to the user's device
 *
 * @param {Object} options
 * @param {string} options.title - Notification title
 * @param {string} [options.message] - Notification body/message
 * @param {string} [options.body] - Alias for message
 * @param {string} [options.urgency] - 'low' | 'normal' | 'medium' | 'high' | 'critical'
 * @param {string} [options.category] - 'email' | 'reply' | 'draft' | 'urgent' | 'system'
 * @param {boolean} [options.sound] - Play sound / ring bell (default: true)
 * @param {string} [options.appName] - Application name (default: 'MailMind Agent')
 * @param {string} [options.icon] - Icon name/path
 * @param {number} [options.timeout] - Display duration in ms (default: 6000)
 * @param {string} [options.webhookUrl] - Optional push webhook URL
 * @returns {Promise<{ success: boolean, platform: string, method: string, error?: string }>}
 */
async function sendDeviceNotification(options = {}) {
  const title = options.title || '📧 MailMind Alert';
  const message = options.message || options.body || '';
  const urgency = options.urgency || 'normal';
  const sound = options.sound !== false;
  const appName = options.appName || 'MailMind Agent';
  const icon = options.icon || null;
  const timeout = options.timeout || 6000;
  const platform = os.platform();

  if (sound) {
    triggerTerminalAlert(title, message);
  }

  let result = { success: false, platform, method: 'none' };

  try {
    if (platform === 'linux') {
      result = await sendLinuxNotification({ title, message, urgency, appName, icon, timeout });
    } else if (platform === 'darwin') {
      result = await sendMacNotification({ title, message, sound, subtitle: options.subtitle || appName });
    } else if (platform === 'win32') {
      result = await sendWindowsNotification({ title, message, sound, appName });
    } else {
      triggerTerminalAlert(title, message);
      result = { success: true, platform, method: 'terminal-bell' };
    }
  } catch (err) {
    result = { success: false, platform, method: 'error', error: err.message };
  }

  // If a webhook or push URL is configured, also dispatch to external device/push service
  if (options.webhookUrl) {
    try {
      await sendWebhookPush(options.webhookUrl, {
        title,
        message,
        urgency,
        appName,
        timestamp: new Date().toISOString(),
        category: options.category || 'email'
      });
    } catch (_) {}
  }

  return {
    ...result,
    platform,
    title,
    timestamp: new Date().toISOString()
  };
}

/**
 * Formats an incoming or analyzed email into a clean, human-readable notification payload
 *
 * @param {Object} email - Email object
 * @param {Object} [options] - Options (e.g. agentMode)
 * @returns {Object} Notification payload ready for sendDeviceNotification
 */
function formatEmailNotification(email, options = {}) {
  if (!email) {
    return {
      title: '📧 MailMind Alert',
      message: 'New inbox update received.',
      urgency: 'normal',
      category: 'email'
    };
  }

  const sender = email.sender || email.sender_name || (email.senderEmail ? email.senderEmail.split('@')[0] : 'Unknown');
  const subject = email.subject || 'No Subject';
  const summary = email.summary || email.ai_summary || email.snippet || '';
  const urgency = (email.urgency || 'normal').toLowerCase();
  const needsReply = email.needsReply || email.needs_reply || false;
  const draft = email.draftBody || email.draft?.body;
  const isAuto = options.agentMode === 'auto_reply' || options.agentMode === 'without_permission';

  let title = `📨 New Email from ${sender}`;
  let category = 'email';
  let notificationUrgency = 'normal';

  if (urgency === 'high' || urgency === 'urgent') {
    title = `🚨 Urgent: ${sender}`;
    notificationUrgency = 'critical';
    category = 'urgent';
  } else if (needsReply) {
    if (isAuto) {
      title = `⚡ Auto-Replied to ${sender}`;
      category = 'reply';
    } else {
      title = `💬 Action Needed: ${sender}`;
      notificationUrgency = 'normal';
      category = 'draft';
    }
  }

  let message = `"${subject}"`;
  if (summary) {
    message += `\n• Summary: ${summary.length > 120 ? summary.slice(0, 117) + '...' : summary}`;
  }
  if (draft && !isAuto) {
    message += `\n• Suggested reply draft is ready for review.`;
  }

  return {
    title,
    message,
    urgency: notificationUrgency,
    category,
    sound: true,
    emailId: email.id,
    sender,
    subject
  };
}

/**
 * Diagnostic test for device notification delivery
 */
async function testDeviceNotification(options = {}) {
  const payload = {
    title: options.title || '🔔 MailMind Agent Active',
    message: options.message || `Device notifications are working on ${os.type()} (${os.hostname()}).`,
    urgency: options.urgency || 'normal',
    sound: true,
    category: 'system'
  };

  const result = await sendDeviceNotification(payload);
  return {
    ...result,
    diagnostics: {
      platform: os.platform(),
      osType: os.type(),
      osRelease: os.release(),
      hostname: os.hostname(),
      testedAt: new Date().toISOString()
    }
  };
}

/**
 * Return supported notification capabilities on current host
 */
function getNotificationCapabilities() {
  return {
    platform: os.platform(),
    osType: os.type(),
    supported: ['linux', 'darwin', 'win32'].includes(os.platform()),
    desktopNotifications: true,
    soundAlerts: true,
    webhookPush: true,
    terminalBell: true
  };
}

module.exports = {
  sendDeviceNotification,
  formatEmailNotification,
  testDeviceNotification,
  getNotificationCapabilities,
  sendWebhookPush,
  triggerTerminalAlert
};
