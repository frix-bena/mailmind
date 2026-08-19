'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { mockUser } from '@/lib/mockData';

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16 }}>{title}</h2>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, desc, children, danger }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      padding: '18px 24px', borderBottom: '1px solid var(--border)',
    }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14, color: danger ? 'var(--danger)' : 'var(--text)' }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{desc}</div>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ value, onChange }) {
  return <div className={`toggle${value ? ' on' : ''}`} onClick={() => onChange(!value)} />;
}

export default function SettingsPage() {
  const [user, setUser] = useState(mockUser);
  const [tone, setTone] = useState('professional');
  const [inApp, setInApp] = useState(true);
  const [digest, setDigest] = useState(false);
  const [pollInterval, setPollInterval] = useState('3');
  const [disconnecting, setDisconnecting] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('mailmind_user') || 'null');
      if (stored) {
        setUser(stored);
        if (stored.tone) setTone(stored.tone);
        if (stored.inApp !== undefined) setInApp(stored.inApp);
        if (stored.digest !== undefined) setDigest(stored.digest);
      }
    } catch {
      // ignore
    }
  }, []);

  const tones = [
    { id: 'professional', label: '💼 Professional' },
    { id: 'casual',       label: '😊 Casual' },
    { id: 'brief',        label: '⚡ Brief' },
  ];

  const handleSave = () => {
    const updated = {
      ...user,
      tone,
      inApp,
      digest,
      pollInterval
    };
    setUser(updated);
    localStorage.setItem('mailmind_user', JSON.stringify(updated));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleDisconnect = async () => {
    if (window.confirm('Disconnect your inbox? This will stop email monitoring and clear credentials.')) {
      setDisconnecting(true);
      try {
        await fetch('http://localhost:3002/api/auth/disconnect', { method: 'POST' });
      } catch {
        // ignore
      }
      localStorage.removeItem('mailmind_user');
      setTimeout(() => {
        window.location.href = '/onboarding';
      }, 500);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar user={user} />
      <div className="main-area">
        <div className="topbar">
          <span className="topbar-title">⚙️ Settings</span>
          {saved && (
            <span className="badge badge-low fade-in" style={{ fontSize: 12 }}>✅ Saved</span>
          )}
        </div>
        <div className="page-content">

          {/* Connected Account */}
          <Section title="Connected Email Account">
            <Row
              label={user?.email ? `Account: ${user.email}` : 'Connected Account'}
              desc={`Provider: ${user?.provider || 'Google'} · IMAP/SMTP Access Active`}
            >
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="badge badge-low">● Connected</span>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                >
                  {disconnecting ? 'Disconnecting…' : 'Disconnect'}
                </button>
              </div>
            </Row>
            <Row
              label="Terminal Agent CLI Access"
              desc="Run 'npm run agent' in your terminal for direct CLI email history & bash execution"
            >
              <span className="chip" style={{ fontSize: 12 }}>terminal-agent.js</span>
            </Row>
          </Section>

          {/* Reply Preferences */}
          <Section title="AI Reply Preferences">
            <Row label="Reply tone" desc="Applied to all AI-drafted replies">
              <div style={{ display: 'flex', gap: 8 }}>
                {tones.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTone(t.id)}
                    className="btn btn-sm"
                    style={{
                      background: tone === t.id ? 'var(--accent)' : 'var(--surface2)',
                      color: tone === t.id ? '#fff' : 'var(--muted)',
                      border: `1px solid ${tone === t.id ? 'var(--accent)' : 'var(--border)'}`,
                    }}
                  >{t.label}</button>
                ))}
              </div>
            </Row>
          </Section>

          {/* Notifications */}
          <Section title="Notifications">
            <Row label="In-app notifications" desc="Real-time bell alerts inside MailMind">
              <Toggle value={inApp} onChange={setInApp} />
            </Row>
            <Row label="Daily digest email" desc="Morning summary sent to your inbox">
              <Toggle value={digest} onChange={setDigest} />
            </Row>
          </Section>

          {/* Polling */}
          <Section title="Inbox Polling">
            <Row label="Check for new emails" desc="How often MailMind polls your inbox">
              <select
                value={pollInterval}
                onChange={e => setPollInterval(e.target.value)}
                style={{
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '8px 12px', color: 'var(--text)',
                  fontSize: 14, cursor: 'pointer',
                }}
              >
                <option value="1">Every 1 minute</option>
                <option value="3">Every 3 minutes</option>
                <option value="5">Every 5 minutes</option>
                <option value="15">Every 15 minutes</option>
              </select>
            </Row>
          </Section>

          {/* Save button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 40 }}>
            <button className="btn btn-primary" onClick={handleSave} style={{ minWidth: 140 }}>
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
