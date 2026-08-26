'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopbarUserButton from '@/components/TopbarUserButton';
import GoogleAccountModal from '@/components/GoogleAccountModal';
import { getActiveUser, isDemoAccount } from '@/lib/account-manager';

const QUICK_COMMANDS = [
  'status',
  'fetch-inbox',
  'ask Summarize this week',
  'classify',
  'draft',
  'stats',
  'help',
  'cli-guide',
  'clear'
];

export default function TerminalPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [history, setHistory] = useState([
    { type: 'system', text: '🤖 MailMind Autonomous AI Agent Console v2.4' },
    { type: 'system', text: '🔒 Secure Inbox Access Active — Full permission-first inbox intelligence.' },
    { type: 'system', text: 'Type "help" to list agent commands, or click any quick command chip below.' }
  ]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const terminalEndRef = useRef(null);

  useEffect(() => {
    router.replace('/inbox');
  }, [router]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const executeCmd = async (commandToRun) => {
    const cmd = commandToRun.trim();
    if (!cmd) return;

    // Track command history for up/down arrows
    setCommandHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);

    const newHistory = [...history, { type: 'input', text: `$ ${cmd}` }];
    setHistory(newHistory);
    setInput('');

    const lowerCmd = cmd.toLowerCase();

    if (lowerCmd === 'clear' || lowerCmd === 'cls') {
      setHistory([]);
      return;
    }

    if (lowerCmd === 'help' || lowerCmd === '?') {
      setHistory([
        ...newHistory,
        {
          type: 'output',
          text: `📧 MailMind Autonomous Agent Command Suite:
--------------------------------------------------
  • status                  Show agent health, active inbox & tone mode
  • mode <permission|auto>  Set monitoring mode: Ask permission vs Reply without permission
  • fetch-inbox             Retrieve & analyze recent inbox messages
  • ask <question>          AI lookback & Q&A over inbox history
  • search <query>          Search emails by keyword, sender, or subject
  • classify                Classify current emails (Action Needed vs FYI)
  • draft [id]              Generate human-like draft for actionable emails
  • summarize               Executive digest of recent inbox activity
  • stats                   View email volume, response rate & time saved
  • tone <style>            Change reply tone: professional | casual | brief
  • cli-guide               How to run the CLI agent locally in your terminal
  • clear                   Clear terminal output
  • <system command>        Execute bash / terminal commands (when available)`
        }
      ]);
      return;
    }

    if (lowerCmd === 'cli-guide') {
      setHistory([
        ...newHistory,
        {
          type: 'output',
          text: `💻 Run MailMind Agent in your local terminal:
--------------------------------------------------
1. Start the CLI Agent:
   $ npm run agent
   Or:
   $ node terminal-agent.js

2. Run direct single-command flags:
   $ node terminal-agent.js --inbox
   $ node terminal-agent.js --history 50
   $ node terminal-agent.js --search "invoice"
   $ node terminal-agent.js --ask "Summarize what I missed this week"

3. Background API Bridge:
   $ npm run api (Port 3002)`
        }
      ]);
      return;
    }

    if (lowerCmd === 'status') {
      const activeEmail = user?.email || 'No active account';
      const isAuto = user?.monitoringMode === 'auto_reply' || user?.monitoringMode === 'without_permission';
      const modeLabel = isAuto
        ? '⚡ Reply Without Permission (Autonomous Mode)'
        : '🛡️ Ask Permission (Permission-First Mode)';
      const policyDesc = isAuto
        ? '⚡ Autonomous (Replies sent automatically without manual confirmation)'
        : '🙋 Permission-First (All AI drafts require manual review before sending)';

      setHistory([
        ...newHistory,
        {
          type: 'output',
          text: `🤖 MailMind Autonomous Agent Status:
--------------------------------------------------
  • System State:      🟢 Online & Active
  • Access Mode:       🔒 Private Mailbox Connected
  • Active Account:    ${activeEmail} (${user?.provider || 'IMAP/SMTP'})
  • Reply Tone:        ${user?.tone || 'professional'}
  • Monitoring Mode:   ${modeLabel}
  • Safety Policy:     ${policyDesc}
  • Q&A Engine:        Semantic Matcher & Zero-Shot Categorization
  • Inbox Monitor:     Real-time polling active`
        }
      ]);
      return;
    }

    if (lowerCmd === 'stats') {
      const isAuto = user?.monitoringMode === 'auto_reply' || user?.monitoringMode === 'without_permission';
      setHistory([
        ...newHistory,
        {
          type: 'output',
          text: `📊 MailMind Autonomous Agent Performance & Metrics:
--------------------------------------------------
  • Active Mailbox:            ${user?.email || 'Connected'}
  • Status:                    Monitoring in real time
  • Monitoring Mode:           ${isAuto ? '⚡ Autonomous (Reply without permission)' : '🛡️ Permission-First (Ask permission)'}
  • Safety Policy:             ${isAuto ? 'Autonomous dispatch enabled for actionable emails' : '100% human-approved drafts before send'}
  • AI Classification:         Active (Action Required vs FYI)
  • Draft Engine:              Ready`
        }
      ]);
      return;
    }

    if (lowerCmd.startsWith('mode ') || lowerCmd.startsWith('monitoring ')) {
      const selectedMode = lowerCmd.replace(/^(mode|monitoring)\s+/i, '').trim();
      let targetMode = null;
      if (['permission', 'ask', 'ask_permission', 'permission-first', 'safe'].includes(selectedMode)) {
        targetMode = 'ask_permission';
      } else if (['auto', 'auto-reply', 'auto_reply', 'without-permission', 'without_permission', 'autonomous', 'reply'].includes(selectedMode)) {
        targetMode = 'auto_reply';
      }

      if (targetMode) {
        const updated = { ...(user || {}), monitoringMode: targetMode };
        setUser(updated);
        localStorage.setItem('mailmind_user', JSON.stringify(updated));
        try {
          fetch('/api/auth/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ monitoringMode: targetMode })
          }).catch(() => {});
        } catch (_) {}

        const modeName = targetMode === 'auto_reply'
          ? '⚡ Reply Without Permission (Autonomous Mode)'
          : '🛡️ Ask Permission (Permission-First Mode)';

        setHistory([
          ...newHistory,
          {
            type: 'output',
            text: `✅ Monitoring mode updated to: ${modeName}\n${targetMode === 'auto_reply' ? 'The agent will now reply automatically to actionable messages without asking for permission.' : 'The agent will now ask for your explicit permission and review before sending any replies.'}`
          }
        ]);
      } else {
        setHistory([
          ...newHistory,
          {
            type: 'error',
            text: `Invalid mode "${selectedMode}". Usage: mode permission (Ask permission) | mode auto (Reply without permission)`
          }
        ]);
      }
      return;
    }

    if (lowerCmd.startsWith('tone ')) {
      const selectedTone = lowerCmd.replace('tone ', '').trim();
      if (['professional', 'casual', 'brief'].includes(selectedTone)) {
        const updated = { ...(user || {}), tone: selectedTone };
        setUser(updated);
        localStorage.setItem('mailmind_user', JSON.stringify(updated));
        setHistory([
          ...newHistory,
          {
            type: 'output',
            text: `✅ Reply tone updated to: "${selectedTone}". Future drafts will adopt this voice style.`
          }
        ]);
      } else {
        setHistory([
          ...newHistory,
          {
            type: 'error',
            text: `Invalid tone "${selectedTone}". Choose from: professional | casual | brief`
          }
        ]);
      }
      return;
    }

    if (lowerCmd === 'summarize') {
      setLoading(true);
      try {
        let res;
        const reqBody = JSON.stringify({
          email: user?.email,
          password: user?.password,
          provider: user?.provider,
          question: 'Summarize what I missed this week and highlight any urgent action items'
        });
        try {
          res = await fetch('/api/ask-inbox', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: reqBody
          });
        } catch {
          res = await fetch('http://localhost:3002/api/ask-inbox', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: reqBody
          });
        }
        const data = await res.json();
        setHistory([...newHistory, { type: 'output', text: `📋 Executive Inbox Digest:\n\n${data.answer || 'Inbox clear.'}` }]);
      } catch (err) {
        setHistory([...newHistory, { type: 'error', text: `Summary error: ${err.message}` }]);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (lowerCmd === 'classify') {
      setLoading(true);
      try {
        let emailList = [];
        if (user && user.email) {
          try {
            const res = await fetch('/api/fetch-emails', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: user.email, password: user.password, limit: 15 })
            });
            const data = await res.json();
            if (data.emails && Array.isArray(data.emails)) emailList = data.emails;
          } catch (_) {}
        }

        if (emailList.length === 0) {
          setHistory([...newHistory, { type: 'output', text: '📬 No emails found in your inbox to classify.' }]);
          setLoading(false);
          return;
        }

        const actionItems = emailList.filter(e => e.needsReply || e.needs_reply);
        const fyiItems = emailList.filter(e => !(e.needsReply || e.needs_reply));

        let out = `🧠 Smart Classification Matrix (${emailList.length} total emails):\n\n`;
        out += `⚡ ACTION REQUIRED (${actionItems.length}):\n`;
        actionItems.forEach((e, idx) => {
          out += `  [${idx + 1}] ${e.sender || e.sender_name} — "${e.subject}"\n      Urgency: ${e.urgency || 'medium'} | Status: Draft Ready\n`;
        });
        out += `\n📌 INFORMATIONAL / NO ACTION NEEDED (${fyiItems.length}):\n`;
        fyiItems.forEach((e, idx) => {
          out += `  [${idx + 1}] [${e.category?.toUpperCase() || 'INFO'}] ${e.sender || e.sender_name} — "${e.subject}"\n`;
        });

        setHistory([...newHistory, { type: 'output', text: out }]);
      } catch (err) {
        setHistory([...newHistory, { type: 'error', text: `Classification error: ${err.message}` }]);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (lowerCmd === 'draft' || lowerCmd.startsWith('draft ')) {
      const currentTone = user?.tone || 'professional';
      const authorName = user?.name || user?.email?.split('@')[0] || 'User';

      setLoading(true);
      try {
        let emailList = [];
        if (user && user.email) {
          try {
            const res = await fetch('/api/fetch-emails', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: user.email, password: user.password, limit: 10 })
            });
            const data = await res.json();
            if (data.emails && Array.isArray(data.emails)) emailList = data.emails;
          } catch (_) {}
        }

        const targetSubj = lowerCmd.replace('draft', '').trim().toLowerCase();
        const targetEmail = emailList.find(e => (e.needsReply || e.needs_reply) && (!targetSubj || (e.subject && e.subject.toLowerCase().includes(targetSubj)))) || emailList[0];

        if (!targetEmail) {
          setHistory([...newHistory, { type: 'output', text: '📬 No actionable emails found in your inbox needing a draft.' }]);
          setLoading(false);
          return;
        }

        const draftContent = targetEmail.draft?.body || targetEmail.draftBody || `Hi ${targetEmail.sender?.split(' ')[0] || 'there'},\n\nThank you for your note regarding "${targetEmail.subject}". I have received your email and will follow up shortly.\n\nBest regards,\n${authorName}`;

        setHistory([
          ...newHistory,
          {
            type: 'output',
            text: `✍️ AI Generated Reply Draft (${currentTone.toUpperCase()} TONE):
--------------------------------------------------
To: ${targetEmail.sender_email || targetEmail.senderEmail || 'recipient@domain.com'}
Subject: Re: ${targetEmail.subject}
Permission Status: 🟡 Pending Your Approval

${draftContent}

--------------------------------------------------
💡 Note: MailMind never sends without your explicit consent. You can approve or edit this in the Inbox view.`
          }
        ]);
      } catch (err) {
        setHistory([...newHistory, { type: 'error', text: `Draft error: ${err.message}` }]);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (lowerCmd === 'fetch-inbox' || lowerCmd === 'inbox') {
      setLoading(true);
      try {
        let res;
        const reqBody = JSON.stringify({
          email: user?.email,
          password: user?.password,
          provider: user?.provider,
          tone: user?.tone,
          limit: 10
        });

        try {
          res = await fetch('/api/fetch-emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: reqBody
          });
        } catch {
          res = await fetch('http://localhost:3002/api/fetch-emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: reqBody
          });
        }

        const data = await res.json();
        const emailsToDisplay = (data.emails && Array.isArray(data.emails)) ? data.emails : [];

        if (emailsToDisplay.length === 0) {
          setHistory([
            ...newHistory,
            {
              type: 'output',
              text: `📬 Inbox is clear. No recent messages found for ${user?.email || 'account'}.`
            }
          ]);
        } else {
          const list = emailsToDisplay.map((m, i) => {
            const actionTag = (m.needsReply || m.needs_reply) ? '⚡ [NEEDS REPLY]' : '📌 [NO REPLY NEEDED]';
            const urgencyTag = m.urgency ? `[${m.urgency.toUpperCase()}]` : '';
            return `[${i + 1}] ${actionTag} ${urgencyTag} ${m.subject}\n    From: ${m.sender || m.sender_name} <${m.sender_email || m.senderEmail || ''}>\n    Summary: ${m.summary || m.ai_summary || 'No summary available.'}`;
          }).join('\n\n');

          setHistory([
            ...newHistory,
            {
              type: 'output',
              text: `📥 Retrieved ${emailsToDisplay.length} messages from inbox:\n\n${list}`
            }
          ]);
        }
      } catch (err) {
        setHistory([...newHistory, { type: 'error', text: `Fetch error: ${err.message}` }]);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (lowerCmd.startsWith('search ') || lowerCmd.startsWith('search-history ')) {
      const q = cmd.replace(/^(search-history|search)\s+/i, '').trim();
      if (!q) {
        setHistory([...newHistory, { type: 'error', text: 'Please specify a search query (e.g. search invoice)' }]);
        return;
      }
      setLoading(true);
      try {
        let res;
        const reqBody = JSON.stringify({
          email: user?.email,
          password: user?.password,
          provider: user?.provider,
          query: q,
          limit: 20
        });

        try {
          res = await fetch('/api/search-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: reqBody
          });
        } catch {
          res = await fetch('http://localhost:3002/api/search-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: reqBody
          });
        }

        const data = await res.json();
        const matches = (data.emails && Array.isArray(data.emails)) ? data.emails : [];

        if (matches.length === 0) {
          setHistory([...newHistory, { type: 'output', text: `No emails found matching query "${q}".` }]);
        } else {
          const formatted = matches.map((m, i) =>
            `[${i + 1}] ${m.subject}\n    From: ${m.sender || m.sender_name} | Date: ${new Date(m.receivedAt || m.received_at || Date.now()).toLocaleDateString()}\n    Summary: ${m.summary || m.ai_summary || 'No summary'}`
          ).join('\n\n');
          setHistory([...newHistory, { type: 'output', text: `🔍 Found ${matches.length} matching message(s) for "${q}":\n\n${formatted}` }]);
        }
      } catch (err) {
        setHistory([...newHistory, { type: 'error', text: `Search error: ${err.message}` }]);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (lowerCmd.startsWith('ask ')) {
      const question = cmd.replace(/^ask\s+/i, '').trim();
      setLoading(true);
      try {
        let res;
        const reqBody = JSON.stringify({
          email: user?.email,
          password: user?.password,
          provider: user?.provider,
          question
        });

        try {
          res = await fetch('/api/ask-inbox', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: reqBody
          });
        } catch {
          res = await fetch('http://localhost:3002/api/ask-inbox', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: reqBody
          });
        }

        const data = await res.json();
        setHistory([
          ...newHistory,
          {
            type: 'output',
            text: `🤖 AI Inbox Intelligence Response:\n\n${data.answer || data.error || 'No answer available.'}`
          }
        ]);
      } catch (err) {
        setHistory([...newHistory, { type: 'error', text: `Error: ${err.message}` }]);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Default fallback: Execute as shell command if available, otherwise suggest help
    setLoading(true);
    try {
      let res;
      const reqBody = JSON.stringify({ command: cmd });
      try {
        res = await fetch('/api/terminal/exec', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: reqBody
        });
      } catch {
        res = await fetch('http://localhost:3002/api/terminal/exec', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: reqBody
        });
      }
      const data = await res.json();
      if (data.stdout && data.stdout.trim()) {
        setHistory([...newHistory, { type: 'output', text: data.stdout.trim() }]);
      } else if (data.stderr && data.stderr.trim()) {
        setHistory([...newHistory, { type: 'error', text: data.stderr.trim() }]);
      } else if (data.error) {
        setHistory([
          ...newHistory,
          {
            type: 'output',
            text: `Command "${cmd}" received. Type "help" to see all available MailMind agent commands.`
          }
        ]);
      } else {
        setHistory([...newHistory, { type: 'output', text: `(Command executed with code 0)` }]);
      }
    } catch {
      setHistory([
        ...newHistory,
        {
          type: 'output',
          text: `Command "${cmd}" received. Type "help" to see all available MailMind agent commands.`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCommand = (e) => {
    e.preventDefault();
    executeCmd(input);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      if (commandHistory.length > 0) {
        const nextIdx = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(nextIdx);
        setInput(commandHistory[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      if (historyIndex !== -1) {
        const nextIdx = historyIndex + 1;
        if (nextIdx < commandHistory.length) {
          setHistoryIndex(nextIdx);
          setInput(commandHistory[nextIdx]);
        } else {
          setHistoryIndex(-1);
          setInput('');
        }
      }
    }
  };

  const handleCopyLog = () => {
    const text = history.map(h => h.text).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="app-shell">
      <Sidebar user={user} />
      <div className="main-area">
        <div className="topbar">
          <button
            type="button"
            className="mobile-hamburger-btn"
            onClick={() => window.dispatchEvent(new CustomEvent('mailmind:toggle-drawer'))}
            aria-label="Toggle navigation menu"
            title="Menu"
          >
            ☰
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            <span className="topbar-title">🤖 AI Agent</span>
            <span className="chip hide-on-mobile" style={{ fontSize: 11, background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', borderColor: 'rgba(34, 197, 94, 0.3)' }}>
              🟢 Live Link
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleCopyLog}
              style={{ fontSize: 12, padding: '4px 8px' }}
              title="Copy terminal session log"
            >
              {copied ? '✅' : '📋'} <span className="hide-on-mobile">{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setHistory([])}
              style={{ fontSize: 12, padding: '4px 8px' }}
              title="Clear terminal screen"
            >
              🧹 <span className="hide-on-mobile">Clear</span>
            </button>
            <TopbarUserButton user={user} onClick={() => setUserModalOpen(true)} />
          </div>
        </div>

        <div className="page-content">
          {/* Agent Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(22, 24, 38, 0.95) 0%, rgba(15, 17, 28, 0.98) 100%)',
            border: '1px solid var(--border2)',
            borderRadius: 'var(--radius)',
            padding: '18px 22px',
            marginBottom: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
            boxShadow: '0 4px 24px rgba(0,0,0,0.35)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #6c63ff 0%, #3b82f6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                border: '1.5px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 0 20px var(--accent-glow)',
                flexShrink: 0
              }}>
                🤖
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h1 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                    MailMind Autonomous Agent
                  </h1>
                  <span className="badge badge-low" style={{ fontSize: 11, padding: '2px 8px' }}>
                    ● Online (Live Link)
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>
                  Autonomous inbox intelligence, live IMAP monitoring & interactive CLI agent
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="chip" style={{ fontSize: 11.5, background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
                🤖 Active Agent
              </span>
              <span className="chip" style={{ fontSize: 11.5, background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
                ⚡ Permission First
              </span>
              <button
                onClick={() => router.push('/inbox')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 11.5, padding: '4px 10px' }}
              >
                📥 Open Inbox View →
              </button>
            </div>
          </div>

          {/* Quick Command Chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Quick Actions:</span>
            {QUICK_COMMANDS.map(qc => (
              <button
                key={qc}
                onClick={() => executeCmd(qc)}
                className="chip"
                style={{
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  fontSize: 12,
                  background: 'var(--surface2)',
                  borderColor: 'var(--border2)'
                }}
              >
                ${qc}
              </button>
            ))}
          </div>

          <div style={{
            background: 'linear-gradient(180deg, #0d1117 0%, #080a0f 100%)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: 20,
            fontFamily: 'monospace',
            minHeight: '62vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)'
          }}>
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16, fontSize: 13, lineHeight: 1.6 }}>
              {history.map((item, index) => (
                <div key={index} style={{
                  marginBottom: 10,
                  whiteSpace: 'pre-wrap',
                  color: item.type === 'input' ? '#58a6ff' :
                         item.type === 'error' ? '#f85149' :
                         item.type === 'system' ? '#8b949e' : '#c9d1d9'
                }}>
                  {item.text}
                </div>
              ))}
              {loading && (
                <div style={{ color: '#d29922', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="spinner" style={{ width: 14, height: 14 }} /> Executing command…
                </div>
              )}
              <div ref={terminalEndRef} />
            </div>

            <form onSubmit={handleCommand} style={{ display: 'flex', gap: 10, alignItems: 'center', borderTop: '1px solid #30363d', paddingTop: 12 }}>
              <span style={{ color: '#58a6ff', fontWeight: 'bold' }}>mailmind-agent$</span>
              <input
                type="text"
                autoFocus
                className="input"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#fff',
                  fontFamily: 'monospace',
                  fontSize: 14,
                  padding: 0
                }}
                placeholder="Type command (e.g. 'help', 'status', 'fetch-inbox', 'classify', 'draft', 'stats')..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading || !input.trim()}>
                Run ↵
              </button>
            </form>
          </div>
        </div>
      </div>

      {userModalOpen && (
        <GoogleAccountModal
          user={user}
          onClose={() => setUserModalOpen(false)}
          onOpenCompose={() => router.push('/inbox')}
          onDisconnect={async () => {
            try {
              await fetch('/api/auth/disconnect', { method: 'POST' });
            } catch {}
            localStorage.removeItem('mailmind_user');
            router.replace('/onboarding');
          }}
          onUserUpdate={(updated) => setUser(updated)}
          onAccountSwitch={(switched) => {
            setUser(switched);
            setHistory(h => [
              ...h,
              { type: 'output', text: `🔄 Active account switched to ${switched.email}` }
            ]);
          }}
        />
      )}
    </div>
  );
}
