'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopbarUserButton from '@/components/TopbarUserButton';
import GoogleAccountModal from '@/components/GoogleAccountModal';

const QUICK_COMMANDS = [
  'status',
  'fetch-inbox',
  'ask Summarize this week',
  'help',
  'cli-guide',
  'clear'
];

const AGENT_IMAGE_URL = 'https://plus.unsplash.com/premium_photo-1680404114169-e254afa55a16?w=1920&auto=format&fit=crop&q=80&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NjZ8fHRlY2h8ZW58MHx8MHx8fDA%3D';

export default function TerminalPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([
    { type: 'system', text: '📧 MailMind Terminal Agent Shell Initialized.' },
    { type: 'system', text: 'Type "help" for commands, or click any quick command chip below.' },
    { type: 'system', text: 'You can also run the full CLI agent directly in your system terminal using: npm run agent' }
  ]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const terminalEndRef = useRef(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('mailmind_user') || 'null');
      if (stored && stored.connected && stored.email) {
        setUser(stored);
      } else {
        router.replace('/onboarding');
      }
    } catch {
      router.replace('/onboarding');
    }
  }, [router]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const executeCmd = async (commandToRun) => {
    const cmd = commandToRun.trim();
    if (!cmd) return;

    const newHistory = [...history, { type: 'input', text: `$ ${cmd}` }];
    setHistory(newHistory);
    setInput('');

    if (cmd === 'clear' || cmd === 'cls') {
      setHistory([]);
      return;
    }

    if (cmd === 'help') {
      setHistory([
        ...newHistory,
        {
          type: 'output',
          text: `Available Terminal Agent Commands:
  • help                      - Show this guide
  • clear                     - Clear terminal screen
  • status                    - Show email account connection status
  • fetch-inbox               - Retrieve recent inbox messages via IMAP
  • fetch-history [limit]     - Browse past email history
  • search-history <query>    - Search across email history
  • ask <question>            - Ask AI questions over email history
  • cli-guide                 - Instructions to run interactive terminal agent
  • <any bash command>        - Execute system commands (e.g. git, ls, ps, npm)`
        }
      ]);
      return;
    }

    if (cmd === 'cli-guide') {
      setHistory([
        ...newHistory,
        {
          type: 'output',
          text: `To run the interactive Terminal Agent in your terminal:
  $ npm run agent
  Or:
  $ node terminal-agent.js
  
Direct CLI flags:
  $ node terminal-agent.js --inbox
  $ node terminal-agent.js --history 50
  $ node terminal-agent.js --search "invoice"
  $ node terminal-agent.js --ask "Summarize this week"`
        }
      ]);
      return;
    }

    if (cmd === 'status') {
      setHistory([
        ...newHistory,
        {
          type: 'output',
          text: `Connected Account: ${user?.email || 'None'} (${user?.provider || 'gmail'})\nAI Reply Tone: ${user?.tone || 'professional'}\nBridge API: http://localhost:3002`
        }
      ]);
      return;
    }

    if (cmd === 'fetch-inbox') {
      setLoading(true);
      try {
        let res;
        const reqBody = JSON.stringify({ email: user?.email, password: user?.password, provider: user?.provider, limit: 5 });
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
        if (data.emails) {
          const list = data.emails.map((m, i) => `[${i + 1}] ${m.subject} (From: ${m.sender || m.sender_name})\n    Summary: ${m.summary || m.ai_summary}`).join('\n\n');
          setHistory([...newHistory, { type: 'output', text: `Fetched ${data.emails.length} emails from inbox:\n\n${list}` }]);
        } else {
          setHistory([...newHistory, { type: 'error', text: data.error || 'Failed to fetch emails.' }]);
        }
      } catch (err) {
        setHistory([...newHistory, { type: 'error', text: `Error: ${err.message}` }]);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (cmd.startsWith('ask ')) {
      const question = cmd.replace('ask ', '').trim();
      setLoading(true);
      try {
        let res;
        const reqBody = JSON.stringify({ email: user?.email, password: user?.password, provider: user?.provider, question });
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
        setHistory([...newHistory, { type: 'output', text: `🤖 AI Response:\n\n${data.answer || data.error}` }]);
      } catch (err) {
        setHistory([...newHistory, { type: 'error', text: `Error: ${err.message}` }]);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Default: execute as bash / system command via bridge API
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
      if (data.stdout) {
        setHistory([...newHistory, { type: 'output', text: data.stdout.trim() }]);
      } else if (data.stderr) {
        setHistory([...newHistory, { type: 'error', text: data.stderr.trim() }]);
      } else if (data.error) {
        setHistory([...newHistory, { type: 'error', text: data.error }]);
      } else {
        setHistory([...newHistory, { type: 'output', text: '(Command executed with code 0)' }]);
      }
    } catch (err) {
      setHistory([...newHistory, { type: 'error', text: `Failed to execute: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCommand = (e) => {
    e.preventDefault();
    executeCmd(input);
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
          <span className="topbar-title">💻 Terminal & CLI Agent</span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className="chip" style={{ fontSize: 12 }}>
              🟢 Agent Online
            </span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleCopyLog}
              style={{ fontSize: 12, padding: '4px 10px' }}
              title="Copy terminal session log"
            >
              {copied ? '✅ Copied' : '📋 Copy Log'}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setHistory([])}
              style={{ fontSize: 12, padding: '4px 10px' }}
              title="Clear terminal screen"
            >
              🧹 Clear
            </button>
            <TopbarUserButton user={user} onClick={() => setUserModalOpen(true)} />
          </div>
        </div>

        <div className="page-content">
          {/* Agent Banner with background image */}
          <div style={{
            backgroundImage: `linear-gradient(90deg, rgba(13, 17, 23, 0.68) 0%, rgba(13, 17, 23, 0.48) 50%, rgba(13, 17, 23, 0.68) 100%), url("${AGENT_IMAGE_URL}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '1px solid var(--border)',
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
                borderRadius: '50%',
                backgroundImage: `url("${AGENT_IMAGE_URL}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: '2px solid var(--accent)',
                boxShadow: '0 0 16px var(--accent-glow)',
                flexShrink: 0
              }} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h1 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                    MailMind Autonomous Agent
                  </h1>
                  <span className="badge badge-low" style={{ fontSize: 11, padding: '2px 8px' }}>
                    ● Online
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
                ⚡ IMAP Live
              </span>
            </div>
          </div>

          {/* Quick Command Chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Quick Run:</span>
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
            backgroundImage: `linear-gradient(rgba(13, 17, 23, 0.68), rgba(13, 17, 23, 0.78)), url("${AGENT_IMAGE_URL}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: 20,
            fontFamily: 'monospace',
            minHeight: '62vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5), 0 8px 32px rgba(0,0,0,0.4)',
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
                placeholder="Type command (e.g. 'help', 'status', 'fetch-inbox', 'git status')..."
                value={input}
                onChange={e => setInput(e.target.value)}
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
        />
      )}
    </div>
  );
}
