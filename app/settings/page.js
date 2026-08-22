'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import EmailAvatar from '@/components/EmailAvatar';
import { extractDisplayName } from '@/lib/avatar-utils';

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
      flexWrap: 'wrap'
    }}>
      <div style={{ flex: 1, minWidth: 200 }}>
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
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tone, setTone] = useState('professional');
  const [inApp, setInApp] = useState(true);
  const [digest, setDigest] = useState(false);
  const [pollInterval, setPollInterval] = useState('3');
  const [disconnecting, setDisconnecting] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('mailmind_user') || 'null');
      if (stored && stored.connected && stored.email) {
        setUser(stored);
        if (stored.tone) setTone(stored.tone);
        if (stored.inApp !== undefined) setInApp(stored.inApp);
        if (stored.digest !== undefined) setDigest(stored.digest);
        if (stored.pollInterval) setPollInterval(stored.pollInterval);
      } else {
        router.replace('/onboarding');
      }
    } catch {
      router.replace('/onboarding');
    }
  }, [router]);

  const tones = [
    { id: 'professional', label: '💼 Professional' },
    { id: 'casual',       label: '😊 Casual' },
    { id: 'brief',        label: '⚡ Brief' },
  ];

  const handleSave = () => {
    if (!user) return;
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

  const handleTestConnection = async () => {
    if (!user) return;
    setTestingConnection(true);
    setTestResult(null);

    try {
      let res;
      const reqBody = JSON.stringify({
        email: user.email,
        password: user.password,
        provider: user.provider,
        limit: 1
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
      if (res.ok && data.success) {
        setTestResult({ success: true, message: `Connected! Server responded with ${data.total || 0} total messages.` });
      } else {
        setTestResult({ success: false, message: data.error || 'Connection check failed.' });
      }
    } catch (err) {
      setTestResult({ success: false, message: 'Connection test failed: ' + err.message });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleDisconnect = async () => {
    if (window.confirm('Disconnect your email account? This will log you out, stop email monitoring, and clear saved credentials.')) {
      setDisconnecting(true);
      try {
        try {
          await fetch('/api/auth/disconnect', { method: 'POST' });
        } catch {
          await fetch('http://localhost:3002/api/auth/disconnect', { method: 'POST' });
        }
      } catch {
        // ignore
      }
      localStorage.removeItem('mailmind_user');
      setTimeout(() => {
        router.replace('/onboarding');
      }, 400);
    }
  };

  const providerLabels = {
    google: 'Google / Gmail',
    microsoft: 'Microsoft Outlook',
    yahoo: 'Yahoo Mail',
    icloud: 'Apple iCloud',
    custom: 'Custom IMAP'
  };

  const displayName = extractDisplayName(user?.name, user?.email);

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

          {/* User Profile Card */}
          {user && (
            <div className="card fade-in" style={{ padding: 24, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <EmailAvatar email={user.email} name={displayName} size={64} style={{ border: '2px solid var(--accent)' }} />
              <div style={{ flex: 1, minWidth: 200 }}>
                <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{displayName}</h1>
                <div style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'monospace', marginTop: 2 }}>{user.email}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <span className="badge badge-low">● IMAP / SMTP Active</span>
                  <span className="badge badge-purple">{providerLabels[user.provider] || user.provider || 'Email'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                >
                  {testingConnection ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Testing…</> : '⚡ Test Connection'}
                </button>
              </div>
            </div>
          )}

          {testResult && (
            <div className="fade-in" style={{
              background: testResult.success ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: `1px solid ${testResult.success ? 'var(--success)' : 'var(--danger)'}`,
              borderRadius: 8,
              padding: '12px 16px',
              fontSize: 13.5,
              color: testResult.success ? '#86efac' : '#fca5a5',
              marginBottom: 24
            }}>
              {testResult.success ? '✅' : '⚠️'} {testResult.message}
            </div>
          )}

          {/* Connected Account */}
          <Section title="Connected Email Account">
            <Row
              label={user?.email ? `Account: ${user.email}` : 'Connected Email'}
              desc={`Provider: ${providerLabels[user?.provider] || user?.provider || 'Email Server'} · IMAP/SMTP Access Active`}
            >
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="badge badge-low">● Connected</span>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                >
                  {disconnecting ? 'Disconnecting…' : 'Log out / Disconnect'}
                </button>
              </div>
            </Row>
            <Row
              label="Terminal Agent CLI Access"
              desc="Run 'npm run agent' in your terminal for direct CLI email history & bash execution"
            >
              <button
                className="chip"
                onClick={() => router.push('/terminal')}
                style={{ fontSize: 12, cursor: 'pointer' }}
              >
                💻 Open Terminal Agent →
              </button>
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
