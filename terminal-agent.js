#!/usr/bin/env node
const readline = require('readline');
const { exec } = require('child_process');
const {
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
} = require('./lib/email-service');
const {
  sendDeviceNotification,
  formatEmailNotification,
  testDeviceNotification,
  getNotificationCapabilities
} = require('./lib/notification-service');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

// Colors for terminal output
const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m'
};

function printBanner() {
  console.log(`\n${c.cyan}======================================================${c.reset}`);
  console.log(`${c.bright}${c.magenta}   📧 MailMind Terminal Agent & Inbox Assistant   ${c.reset}`);
  console.log(`${c.dim}   Permission-Based Email, History Lookback & CLI Agent${c.reset}`);
  console.log(`${c.cyan}======================================================${c.reset}\n`);
}

async function promptForCredentials() {
  console.log(`${c.bright}${c.yellow}🔑 Setup Real Email Account Access${c.reset}`);
  console.log(`${c.dim}MailMind connects via secure IMAP/SMTP to monitor your inbox & draft replies with permission.${c.reset}`);
  console.log(`${c.dim}(Enter your email address and password to sign in)\n${c.reset}`);

  const email = (await askQuestion(`${c.bright}Email address: ${c.reset}`)).trim();
  if (!email || !email.includes('@')) {
    console.log(`${c.red}❌ Invalid email address.${c.reset}`);
    return null;
  }

  // Auto-detect provider default from email domain
  const domain = (email.split('@')[1] || '').toLowerCase();
  let defaultChoice = '1';
  if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live') || domain.includes('office365')) {
    defaultChoice = '2';
  } else if (domain.includes('yahoo') || domain.includes('aol')) {
    defaultChoice = '3';
  } else if (domain.includes('icloud') || domain.includes('me.com') || domain.includes('mac.com')) {
    defaultChoice = '4';
  } else if (!domain.includes('gmail') && !domain.includes('googlemail')) {
    defaultChoice = '5';
  }

  console.log(`\nSelect email provider:`);
  console.log(` 1) Google / Gmail`);
  console.log(` 2) Microsoft Outlook / Office 365`);
  console.log(` 3) Yahoo Mail`);
  console.log(` 4) Apple iCloud`);
  console.log(` 5) Custom IMAP / Other Provider`);
  const provChoice = (await askQuestion(`Choice [1-5, default: ${defaultChoice}]: `)).trim() || defaultChoice;

  let provider = 'gmail';
  let host = undefined;
  let port = undefined;

  if (provChoice === '2') provider = 'microsoft';
  else if (provChoice === '3') provider = 'yahoo';
  else if (provChoice === '4') provider = 'icloud';
  else if (provChoice === '5') {
    provider = 'custom';
    host = (await askQuestion(`IMAP Host (e.g. imap.${domain} or mail.example.com): `)).trim();
    port = (await askQuestion(`IMAP Port [default: 993]: `)).trim() || '993';
  }

  console.log(`\n${c.dim}Enter your email account password:${c.reset}`);

  const password = (await askQuestion(`${c.bright}Password: ${c.reset}`)).trim();
  if (!password) {
    console.log(`${c.red}❌ Password cannot be empty.${c.reset}`);
    return null;
  }

  console.log(`\nPreferred AI reply tone:`);
  console.log(` 1) 💼 Professional (Default)`);
  console.log(` 2) 😊 Casual`);
  console.log(` 3) ⚡ Brief`);
  const toneChoice = (await askQuestion(`Choice [1-3, default: 1]: `)).trim() || '1';
  let tone = 'professional';
  if (toneChoice === '2') tone = 'casual';
  if (toneChoice === '3') tone = 'brief';

  console.log(`\nSelect monitoring mode:`);
  console.log(` 1) 🛡️ Ask Permission (Permission-First, human reviews drafts before sending) [Default]`);
  console.log(` 2) ⚡ Reply Without Permission (Autonomous, replies sent automatically)`);
  const modeChoice = (await askQuestion(`Choice [1-2, default: 1]: `)).trim() || '1';
  const monitoringMode = modeChoice === '2' ? 'auto_reply' : 'ask_permission';

  const config = {
    email,
    password,
    provider,
    host,
    port,
    tone,
    monitoringMode,
    connected: true,
    savedAt: new Date().toISOString()
  };

  process.stdout.write(`\n${c.yellow}⏳ Testing connection to ${email}... ${c.reset}`);
  const testRes = await testConnection(config);

  if (testRes.success) {
    console.log(`${c.green}Connected successfully!${c.reset}`);
    console.log(`${c.dim}Inbox contains ${testRes.totalMessages} total messages (${testRes.unreadMessages} unread).${c.reset}\n`);
    saveLocalConfig(config);
    console.log(`${c.green}✔ Account ${email} logged in & saved to .mailmind-config.json${c.reset}\n`);
    return config;
  } else {
    console.log(`${c.red}Connection failed!${c.reset}`);
    console.log(`${c.red}Error: ${testRes.error}${c.reset}`);
    console.log(`${c.yellow}\nTroubleshooting tips:\n• Check that IMAP access is enabled in your webmail settings.\n• Verify email address, password, server host & port.${c.reset}\n`);
    const retry = (await askQuestion(`Would you like to try again? (y/n): `)).toLowerCase();
    if (retry.startsWith('y')) {
      return promptForCredentials();
    }
    return null;
  }
}

async function viewLiveInbox(config) {
  console.log(`\n${c.cyan}--- 📥 Live Inbox (Recent Emails) ---${c.reset}`);
  console.log(`${c.dim}Fetching latest messages from ${config?.email}...${c.reset}`);
  
  try {
    const res = await fetchEmails(config, { limit: 10, tone: config?.tone || 'professional' });
    if (!res || !res.success || !Array.isArray(res.emails) || res.emails.length === 0) {
      console.log(`${c.yellow}${res?.error || 'No messages found in INBOX.'}${c.reset}`);
      return;
    }

    console.log(`\n${c.green}Found ${res.emails.length} recent messages (Total in inbox: ${res.total || res.emails.length}):${c.reset}\n`);

    res.emails.forEach((e, idx) => {
      const num = idx + 1;
      const urgency = e?.urgency || 'low';
      const urgencyTag = urgency === 'high' ? `${c.red}[HIGH]${c.reset}` : urgency === 'medium' ? `${c.yellow}[MED]${c.reset}` : `${c.dim}[LOW]${c.reset}`;
      const needsReply = e?.needsReply || e?.needs_reply;
      const replyTag = needsReply ? `${c.magenta}💬 Needs Reply${c.reset}` : `${c.dim}FYI${c.reset}`;
      const subject = e?.subject ?? 'No Subject';
      const sender = e?.sender || e?.sender_name || 'Unknown';
      const senderEmail = e?.senderEmail || e?.sender_email || 'unknown';
      const dateStr = e?.receivedAt || e?.received_at ? new Date(e.receivedAt || e.received_at).toLocaleString() : 'Recent';
      const summary = e?.summary || e?.ai_summary || '';
      const draft = e?.draftBody || e?.draft?.body;

      console.log(`${c.bright}${num}. ${subject}${c.reset} ${urgencyTag} ${replyTag}`);
      console.log(`   ${c.dim}From: ${sender} <${senderEmail}> | Date: ${dateStr}${c.reset}`);
      console.log(`   ${c.cyan}AI Summary:${c.reset} ${summary}`);
      if (draft) {
        console.log(`   ${c.yellow}Suggested Reply Draft:${c.reset} "${draft.replace(/\n/g, ' ')}"`);
      }
      console.log('');
    });

    const action = await askQuestion(`${c.bright}Enter email number to read full details/reply, or press Enter to return: ${c.reset}`);
    const selectedIdx = parseInt(action, 10) - 1;
    if (!isNaN(selectedIdx) && res.emails[selectedIdx]) {
      await handleEmailDetail(config, res.emails[selectedIdx]);
    }
  } catch (err) {
    console.log(`${c.red}Error fetching inbox: ${err.message}${c.reset}`);
  }
}

async function viewEmailHistory(config) {
  console.log(`\n${c.cyan}--- 📜 Email History Browser ---${c.reset}`);
  const limitStr = (await askQuestion(`How many historical emails to fetch? [default: 30, max: 100]: `)).trim() || '30';
  const limit = Math.min(100, Math.max(5, parseInt(limitStr, 10) || 30));

  console.log(`${c.dim}Accessing past ${limit} emails from history...${c.reset}`);
  try {
    const res = await fetchEmailHistory(config, { limit, tone: config?.tone || 'professional' });
    if (!res || !res.success || !Array.isArray(res.emails) || res.emails.length === 0) {
      console.log(`${c.yellow}${res?.error || 'No history found.'}${c.reset}`);
      return;
    }

    console.log(`\n${c.green}Retrieved ${res.emails.length} historical emails (Total: ${res.total || res.emails.length}):${c.reset}\n`);

    res.emails.forEach((e, idx) => {
      const subject = e?.subject ?? 'No Subject';
      const sender = e?.sender || e?.sender_name || 'Unknown';
      const senderEmail = e?.senderEmail || e?.sender_email || 'unknown';
      const dateStr = e?.receivedAt || e?.received_at ? new Date(e.receivedAt || e.received_at).toLocaleDateString() : 'Recent';
      const category = e?.category || 'general';
      const summary = e?.summary || e?.ai_summary || '';

      console.log(`${c.bright}[${idx + 1}] ${subject}${c.reset}`);
      console.log(`    ${c.dim}From: ${sender} <${senderEmail}> | ${dateStr}${c.reset}`);
      console.log(`    ${c.dim}Category: ${category} | ${summary}${c.reset}\n`);
    });

    const action = await askQuestion(`${c.bright}Enter email number to view full body, or Enter to return: ${c.reset}`);
    const selectedIdx = parseInt(action, 10) - 1;
    if (!isNaN(selectedIdx) && res.emails[selectedIdx]) {
      await handleEmailDetail(config, res.emails[selectedIdx]);
    }
  } catch (err) {
    console.log(`${c.red}Error loading history: ${err.message}${c.reset}`);
  }
}

async function searchHistory(config) {
  console.log(`\n${c.cyan}--- 🔍 Search Email History ---${c.reset}`);
  const query = (await askQuestion(`Search query (subject, sender, or keyword): `)).trim();
  if (!query) return;

  console.log(`${c.dim}Searching history for "${query}"...${c.reset}`);
  try {
    const res = await searchEmailHistory(config, { query, limit: 50 });
    if (!res || !res.success || !Array.isArray(res.emails) || res.emails.length === 0) {
      console.log(`${c.yellow}No emails matched "${query}".${c.reset}`);
      return;
    }

    console.log(`\n${c.green}Found ${res.emails.length} matching emails:${c.reset}\n`);
    res.emails.forEach((e, idx) => {
      const subject = e?.subject ?? 'No Subject';
      const sender = e?.sender || e?.sender_name || 'Unknown';
      const senderEmail = e?.senderEmail || e?.sender_email || 'unknown';
      const dateStr = e?.receivedAt || e?.received_at ? new Date(e.receivedAt || e.received_at).toLocaleDateString() : 'Recent';
      const summary = e?.summary || e?.ai_summary || '';

      console.log(`${c.bright}[${idx + 1}] ${subject}${c.reset}`);
      console.log(`    ${c.dim}From: ${sender} <${senderEmail}> | Date: ${dateStr}${c.reset}`);
      console.log(`    ${c.dim}Summary: ${summary}${c.reset}\n`);
    });

    const action = await askQuestion(`${c.bright}Enter email number to inspect, or Enter to return: ${c.reset}`);
    const selectedIdx = parseInt(action, 10) - 1;
    if (!isNaN(selectedIdx) && res.emails[selectedIdx]) {
      await handleEmailDetail(config, res.emails[selectedIdx]);
    }
  } catch (err) {
    console.log(`${c.red}Search error: ${err.message}${c.reset}`);
  }
}

async function askAgentLookback(config) {
  console.log(`\n${c.cyan}--- 🤖 Ask AI Agent About Email History ---${c.reset}`);
  console.log(`${c.dim}Ask natural language questions like:
  • "Summarize what I missed this week"
  • "Find all invoices and receipts"
  • "Any urgent emails from Sarah?"
  • "Who emailed me the most?"${c.reset}\n`);

  const question = (await askQuestion(`${c.bright}Your question: ${c.reset}`)).trim();
  if (!question) return;

  console.log(`\n${c.yellow}⏳ Analyzing email history...${c.reset}`);
  try {
    const res = await fetchEmailHistory(config, { limit: 60, tone: config?.tone || 'professional' });
    const answer = askEmailHistory(question, res?.emails || []);
    console.log(`\n${c.magenta}=== AI Analysis Response ===${c.reset}\n`);
    console.log(answer);
    console.log(`\n${c.magenta}============================${c.reset}\n`);
  } catch (err) {
    console.log(`${c.red}Analysis failed: ${err.message}${c.reset}`);
  }
}

async function handleEmailDetail(config, email) {
  if (!email) return;
  const subject = email?.subject ?? 'No Subject';
  const sender = email?.sender || email?.sender_name || 'Unknown';
  const senderEmail = email?.senderEmail || email?.sender_email || 'unknown';
  const dateStr = email?.receivedAt || email?.received_at ? new Date(email.receivedAt || email.received_at).toLocaleString() : 'Recent';
  const urgency = email?.urgency || 'low';
  const category = email?.category || 'general';
  const summary = email?.summary || email?.ai_summary || '';
  const bodyText = email?.body_plain || email?.body || '(No plain text body)';
  const draftBody = email?.draftBody || email?.draft?.body;

  console.log(`\n${c.cyan}======================================================${c.reset}`);
  console.log(`${c.bright}Subject:${c.reset} ${subject}`);
  console.log(`${c.bright}From:${c.reset}    ${sender} <${senderEmail}>`);
  console.log(`${c.bright}Date:${c.reset}    ${dateStr}`);
  console.log(`${c.bright}Urgency:${c.reset} ${urgency} | ${c.bright}Category:${c.reset} ${category}`);
  console.log(`${c.cyan}------------------------------------------------------${c.reset}`);
  console.log(`${c.bright}AI Summary:${c.reset}\n${summary}`);
  console.log(`${c.cyan}------------------------------------------------------${c.reset}`);
  console.log(`${c.bright}Message Body:${c.reset}\n${bodyText}`);
  console.log(`${c.cyan}======================================================${c.reset}\n`);

  if (draftBody) {
    console.log(`${c.yellow}🤖 Suggested Reply Draft (${config?.tone || 'professional'} tone):${c.reset}`);
    console.log(`${c.dim}------------------------------------------------------${c.reset}`);
    console.log(draftBody);
    console.log(`${c.dim}------------------------------------------------------${c.reset}\n`);

    console.log(`Actions:`);
    console.log(` 1) ✅ Send suggested reply as-is`);
    console.log(` 2) ✏️ Edit reply before sending`);
    console.log(` 3) ❌ Decline / Don't send`);
    console.log(` 4) 🔙 Back to menu`);
    const choice = (await askQuestion(`Choice [1-4]: `)).trim();

    if (choice === '1') {
      await executeSendEmail(config, email, draftBody);
    } else if (choice === '2') {
      console.log(`\n${c.dim}Enter your custom message body (press Enter when done):${c.reset}`);
      const customBody = await askQuestion(`> `);
      if (customBody.trim()) {
        await executeSendEmail(config, email, customBody.trim());
      } else {
        console.log(`${c.yellow}Reply cancelled.${c.reset}`);
      }
    }
  } else {
    console.log(`Actions:`);
    console.log(` 1) ✍️ Write and send a reply`);
    console.log(` 2) 🔙 Back to menu`);
    const choice = (await askQuestion(`Choice [1-2]: `)).trim();
    if (choice === '1') {
      const customBody = await askQuestion(`Enter reply body: `);
      if (customBody.trim()) {
        await executeSendEmail(config, email, customBody.trim());
      }
    }
  }
}

async function executeSendEmail(config, originalEmail, replyBody) {
  const targetEmail = originalEmail?.senderEmail || originalEmail?.sender_email;
  const subject = originalEmail?.subject ?? 'No Subject';
  console.log(`\n${c.yellow}Sending reply to ${targetEmail}...${c.reset}`);
  try {
    const res = await sendEmailReply(config, {
      to: targetEmail,
      subject: subject,
      body: replyBody,
      inReplyTo: originalEmail?.id
    });
    console.log(`${c.green}✔ Reply sent successfully! (Message-ID: ${res.messageId})${c.reset}\n`);
    
    // Dispatch confirmation notification to user's device
    await sendDeviceNotification({
      title: `✅ MailMind: Reply Sent`,
      message: `Successfully replied to ${targetEmail} regarding "${subject}"`,
      urgency: 'normal',
      category: 'reply',
      sound: false
    });
  } catch (err) {
    console.log(`${c.red}❌ Failed to send reply: ${err.message}${c.reset}`);
  }
}

async function runTerminalExecution() {
  console.log(`\n${c.cyan}--- 💻 Terminal Shell Mode ---${c.reset}`);
  console.log(`${c.dim}Execute shell / bash commands directly within the agent session.${c.reset}`);
  console.log(`${c.dim}Commands: 'test-notify', 'notify <msg>', 'git status', 'ls -la', or 'exit':${c.reset}\n`);

  while (true) {
    const cmd = (await askQuestion(`${c.green}terminal-agent$ ${c.reset}`)).trim();
    if (!cmd || cmd === 'exit' || cmd === 'back' || cmd === 'q') break;

    if (cmd === 'test-notify' || cmd === 'notify-test') {
      console.log(`${c.yellow}⏳ Sending test notification to device...${c.reset}`);
      const res = await testDeviceNotification();
      console.log(`${c.green}✔ Notification sent via ${res.method} (${res.platform})${c.reset}`);
      continue;
    }

    if (cmd.startsWith('notify ')) {
      const msg = cmd.slice(7).trim();
      if (msg) {
        await sendDeviceNotification({ title: '🔔 MailMind Agent', message: msg, urgency: 'normal' });
        console.log(`${c.green}✔ Notification sent to device.${c.reset}`);
      }
      continue;
    }

    await new Promise((resolve) => {
      exec(cmd, { cwd: process.cwd() }, (error, stdout, stderr) => {
        if (stdout) console.log(stdout);
        if (stderr) console.error(`${c.red}${stderr}${c.reset}`);
        if (error) console.error(`${c.red}Command failed with code ${error.code}${c.reset}`);
        resolve();
      });
    });
  }
}

async function watchInboxLive(config) {
  console.log(`\n${c.cyan}--- 🔄 Live Watch / Polling Mode ---${c.reset}`);
  console.log(`${c.dim}Monitoring ${config?.email} every 30 seconds. Device alerts active. Press Enter to stop.${c.reset}\n`);

  let lastChecked = new Date();

  // Robust monitoring interval with error recovery
  const pollInterval = setInterval(async () => {
    try {
      process.stdout.write(`\r${c.dim}[${new Date().toLocaleTimeString()}] Checking for new emails...${c.reset}  `);
      const res = await fetchEmails(config, { limit: 5, tone: config?.tone || 'professional' });
      if (res && res.success && Array.isArray(res.emails) && res.emails.length > 0) {
        const newEmails = res.emails.filter(e => {
          const rawDate = e?.receivedAt || e?.received_at;
          return rawDate && new Date(rawDate) > lastChecked;
        });
        if (newEmails.length > 0) {
          console.log(`\n\n${c.bright}${c.magenta}🔔 ${newEmails.length} NEW EMAIL(S) ARRIVED!${c.reset}`);
          for (const e of newEmails) {
            const subj = e?.subject ?? 'No Subject';
            const sender = e?.sender || e?.sender_name || 'Unknown';
            const sum = e?.summary || e?.ai_summary || '';
            console.log(`  • ${c.bright}${subj}${c.reset} from ${sender}`);
            if (sum) console.log(`    Summary: ${sum}`);

            // Send native device desktop notification to user's OS
            try {
              const notifPayload = formatEmailNotification(e, { agentMode: config?.monitoringMode });
              await sendDeviceNotification(notifPayload);
            } catch (nErr) {
              console.log(`${c.dim}Notification delivery note: ${nErr.message}${c.reset}`);
            }
          }
          lastChecked = new Date();
        }
      }
    } catch (e) {
      // Gracefully handle transient connection issues in polling loop
      process.stdout.write(`\r${c.yellow}[${new Date().toLocaleTimeString()}] Notice: ${e.message || 'Transient sync pause, retrying...'}${c.reset}  `);
    }
  }, 30000);

  await askQuestion(`\nPress Enter at any time to return to main menu...\n`);
  clearInterval(pollInterval);
  console.log(`Stopped monitoring.`);
}

async function main() {
  printBanner();

  // Parse CLI argument flags if provided
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`Usage:
  node terminal-agent.js               # Interactive Agent Menu
  node terminal-agent.js --login       # Connect / Log in real email
  node terminal-agent.js --logout      # Disconnect active email
  node terminal-agent.js --status      # Check current connection status
  node terminal-agent.js --inbox       # Fetch live inbox directly
  node terminal-agent.js --history 50  # Fetch history (N emails)
  node terminal-agent.js --search "q"  # Search email history
  node terminal-agent.js --ask "q"     # AI question over email history
  node terminal-agent.js --test-notify # Send test notification to user's device
  node terminal-agent.js --notify "T" "M" # Send custom notification to device
  node terminal-agent.js --exec "cmd"  # Execute terminal command
`);
    process.exit(0);
  }

  if (args.includes('--test-notify') || args.includes('--test-notification')) {
    console.log(`${c.yellow}⏳ Sending test notification to user's device...${c.reset}`);
    const result = await testDeviceNotification();
    console.log(`${c.green}✔ Notification result: ${JSON.stringify(result, null, 2)}${c.reset}`);
    process.exit(0);
  }

  if (args.includes('--notify')) {
    const nIdx = args.indexOf('--notify');
    const title = args[nIdx + 1] || '🔔 MailMind Agent';
    const message = args[nIdx + 2] || 'Notification from terminal agent';
    console.log(`${c.yellow}⏳ Sending device notification: "${title}: ${message}"...${c.reset}`);
    const result = await sendDeviceNotification({ title, message, urgency: 'normal' });
    console.log(`${c.green}✔ Sent via ${result.method} (${result.platform})${c.reset}`);
    process.exit(0);
  }

  if (args.includes('--logout')) {
    clearLocalConfig();
    console.log(`${c.green}✔ Successfully logged out. Credentials removed.${c.reset}`);
    process.exit(0);
  }

  let config = loadLocalConfig();

  if (args.includes('--status')) {
    if (config && config.email) {
      const isAuto = config.monitoringMode === 'auto_reply' || config.monitoringMode === 'without_permission';
      const caps = getNotificationCapabilities();
      console.log(`${c.green}● Connected Account:${c.reset} ${config.email}`);
      console.log(`  Provider: ${config.provider || 'gmail'}`);
      console.log(`  Tone: ${config.tone || 'professional'}`);
      console.log(`  Monitoring Mode: ${isAuto ? '⚡ Reply Without Permission (Autonomous)' : '🛡️ Ask Permission (Permission-First)'}`);
      console.log(`  Device Alerts: ${caps.desktopNotifications ? '🟢 Active (OS Native Desktop & Bell)' : '⚪ Terminal Bell'}`);
      console.log(`  Saved At: ${config.savedAt || 'N/A'}`);
    } else {
      console.log(`${c.yellow}○ No email account connected. Run 'node terminal-agent.js --login' to connect.${c.reset}`);
    }
    process.exit(0);
  }

  // Support direct CLI credential pass: --email <email> --password <pass> [--provider <p>]
  if (args.includes('--email')) {
    const eIdx = args.indexOf('--email');
    const pIdx = args.indexOf('--password');
    const email = args[eIdx + 1];
    const password = pIdx !== -1 ? args[pIdx + 1] : '';
    if (email && password) {
      const provIdx = args.indexOf('--provider');
      const provider = provIdx !== -1 ? args[provIdx + 1] : 'gmail';
      const toneIdx = args.indexOf('--tone');
      const tone = toneIdx !== -1 ? args[toneIdx + 1] : 'professional';
      const modeIdx = args.indexOf('--mode');
      const monitoringMode = modeIdx !== -1 ? args[modeIdx + 1] : 'ask_permission';
      const cliConfig = { email, password, provider, tone, monitoringMode, connected: true, savedAt: new Date().toISOString() };
      const testRes = await testConnection(cliConfig);
      if (testRes.success) {
        saveLocalConfig(cliConfig);
        config = cliConfig;
        console.log(`${c.green}✔ Logged in as ${email}${c.reset}`);
      } else {
        console.log(`${c.red}❌ Login failed: ${testRes.error}${c.reset}`);
        process.exit(1);
      }
    }
  }

  if (args.includes('--login') || !config) {
    if (!config) {
      console.log(`${c.yellow}No configured email account found. Let's log you in with your real email.${c.reset}\n`);
    }
    config = await promptForCredentials();
    if (!config) {
      console.log(`${c.red}Setup cancelled. Exiting.${c.reset}`);
      process.exit(1);
    }
  }

  // Handle direct flag calls
  if (args.includes('--inbox')) {
    await viewLiveInbox(config);
    process.exit(0);
  }
  if (args.includes('--history')) {
    const idx = args.indexOf('--history');
    const lim = parseInt(args[idx + 1], 10) || 30;
    const res = await fetchEmailHistory(config, { limit: lim });
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
  }
  if (args.includes('--search')) {
    const idx = args.indexOf('--search');
    const query = args[idx + 1] || '';
    const res = await searchEmailHistory(config, { query });
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
  }
  if (args.includes('--ask')) {
    const idx = args.indexOf('--ask');
    const q = args[idx + 1] || '';
    const res = await fetchEmailHistory(config, { limit: 50 });
    const answer = askEmailHistory(q, res?.emails || []);
    console.log(answer);
    process.exit(0);
  }
  if (args.includes('--exec')) {
    const idx = args.indexOf('--exec');
    const cmd = args[idx + 1] || '';
    exec(cmd, (err, stdout, stderr) => {
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
      process.exit(err ? 1 : 0);
    });
    return;
  }

  // Main interactive loop
  while (true) {
    const isAuto = config.monitoringMode === 'auto_reply' || config.monitoringMode === 'without_permission';
    console.log(`\n${c.cyan}======================================================${c.reset}`);
    console.log(`${c.bright}Active Account:${c.reset} ${c.green}${config.email}${c.reset} (${config.provider}) | ${c.dim}Tone: ${config.tone}${c.reset} | ${isAuto ? `${c.magenta}⚡ Auto-Reply (No Permission)${c.reset}` : `${c.green}🛡️ Ask Permission${c.reset}`}`);
    console.log(`${c.cyan}------------------------------------------------------${c.reset}`);
    console.log(` ${c.bright}[1]${c.reset} 📥 Live Inbox (Recent Emails & AI Drafts)`);
    console.log(` ${c.bright}[2]${c.reset} 📜 Browse Email History (Deep Lookback)`);
    console.log(` ${c.bright}[3]${c.reset} 🔍 Search Email History`);
    console.log(` ${c.bright}[4]${c.reset} 🤖 Ask AI Agent (Natural Language Lookback)`);
    console.log(` ${c.bright}[5]${c.reset} 💻 Terminal Shell Execution (Run System Commands)`);
    console.log(` ${c.bright}[6]${c.reset} 🔄 Live Watch / Polling Mode (With Device Alerts)`);
    console.log(` ${c.bright}[7]${c.reset} 🛡️ Toggle Monitoring Mode (Current: ${isAuto ? '⚡ Reply Without Permission' : '🛡️ Ask Permission'})`);
    console.log(` ${c.bright}[8]${c.reset} 🔔 Send Test Device Notification (Verify OS Alerts)`);
    console.log(` ${c.bright}[9]${c.reset} ⚙️ Reconfigure / Switch Account`);
    console.log(` ${c.bright}[10]${c.reset} 🚪 Log out / Disconnect Account`);
    console.log(` ${c.bright}[0]${c.reset} 🚪 Exit`);
    console.log(`${c.cyan}======================================================${c.reset}`);

    const choice = (await askQuestion(`${c.bright}Select option [0-10]: ${c.reset}`)).trim();

    if (choice === '1') {
      await viewLiveInbox(config);
    } else if (choice === '2') {
      await viewEmailHistory(config);
    } else if (choice === '3') {
      await searchHistory(config);
    } else if (choice === '4') {
      await askAgentLookback(config);
    } else if (choice === '5') {
      await runTerminalExecution();
    } else if (choice === '6') {
      await watchInboxLive(config);
    } else if (choice === '7') {
      const nextMode = isAuto ? 'ask_permission' : 'auto_reply';
      config.monitoringMode = nextMode;
      saveLocalConfig(config);
      console.log(`\n${c.green}✔ Monitoring mode switched to: ${nextMode === 'auto_reply' ? '⚡ Reply Without Permission (Autonomous)' : '🛡️ Ask Permission (Permission-First)'}${c.reset}`);
    } else if (choice === '8') {
      console.log(`\n${c.yellow}⏳ Sending test notification to user's device...${c.reset}`);
      const testRes = await testDeviceNotification({
        title: '🔔 MailMind Agent Active',
        message: `Desktop notifications verified for ${config.email}.`
      });
      console.log(`${c.green}✔ Device notification sent via ${testRes.method} on ${testRes.platform}!${c.reset}`);
    } else if (choice === '9') {
      const newConfig = await promptForCredentials();
      if (newConfig) config = newConfig;
    } else if (choice === '10') {
      clearLocalConfig();
      console.log(`\n${c.yellow}Logged out of ${config.email}.${c.reset}`);
      const reLogin = (await askQuestion(`Log in with a new email account now? (y/n): `)).toLowerCase();
      if (reLogin.startsWith('y')) {
        const newConfig = await promptForCredentials();
        if (newConfig) config = newConfig;
      } else {
        console.log(`${c.green}Goodbye!${c.reset}\n`);
        break;
      }
    } else if (choice === '0' || choice.toLowerCase() === 'exit' || choice.toLowerCase() === 'q') {
      console.log(`\n${c.green}Goodbye! MailMind Agent session ended.${c.reset}\n`);
      break;
    } else {
      console.log(`${c.red}Invalid option. Please choose from 0 to 10.${c.reset}`);
    }
  }

  rl.close();
}

main().catch(err => {
  console.error(`Fatal error:`, err);
  process.exit(1);
});
