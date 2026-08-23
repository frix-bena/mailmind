'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import EmailAvatar, { GMAIL_AVATAR_PALETTE } from '@/components/EmailAvatar';
import GoogleAccountModal from '@/components/GoogleAccountModal';
import { extractDisplayName } from '@/lib/avatar-utils';
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
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [avatarColor, setAvatarColor] = useState('');
  const [tone, setTone] = useState('professional');
  const [inApp, setInApp] = useState(true);
  const [digest, setDigest] = useState(false);
  const [pollInterval, setPollInterval] = useState('3');
  const [disconnecting, setDisconnecting] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saved, setSaved] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);

  useEffect(() => {
    try {
      let stored = JSON.parse(localStorage.getItem('mailmind_user') || 'null');
      if (!stored || !stored.connected || !stored.email) {
        stored = { ...mockUser, isDemo: true };
        localStorage.setItem('mailmind_user', JSON.stringify(stored));
      }
      setUser(stored);
      if (stored.name) setName(stored.name);
      if (stored.avatar || stored.picture) setAvatar(stored.avatar || stored.picture || '');
      if (stored.avatarColor || stored.color) setAvatarColor(stored.avatarColor || stored.color || '');
      if (stored.tone) setTone(stored.tone);
      if (stored.inApp !== undefined) setInApp(stored.inApp);
      if (stored.digest !== undefined) setDigest(stored.digest);
      if (stored.pollInterval) setPollInterval(stored.pollInterval);
    } catch {
      const stored = { ...mockUser, isDemo: true };
      localStorage.setItem('mailmind_user', JSON.stringify(stored));
      setUser(stored);
    }
  }, []);

  const tones = [
    { id: 'professional', label: '💼 Professional' },
    { id: 'casual',       label: '😊 Casual' },
    { id: 'brief',        label: '⚡ Brief' },
  ];

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Please select an image smaller than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result;
      if (dataUrl) {
        setAvatar(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!user) return;
    const updated = {
      ...user,
      name: name || user.name,
      avatar,
      picture: avatar,
      avatarColor,
      color: avatarColor,
      tone,
      inApp,
      digest,
      pollInterval
    };
    setUser(updated);
    localStorage.setItem('mailmind_user', JSON.stringify(updated));

    // Save to backend
    try {
      await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updated.name,
          avatar: updated.avatar,
          picture: updated.picture,
          avatarColor: updated.avatarColor,
          color: updated.color,
          tone: updated.tone
        })
      });
    } catch {}

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
    gmail: 'Google / Gmail',
    microsoft: 'Microsoft Outlook',
    yahoo: 'Yahoo Mail',
    icloud: 'Apple iCloud',
    custom: 'Custom IMAP'
  };

  const displayName = extractDisplayName(name || user?.name, user?.email);

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
          <span className="topbar-title">⚙️ Settings</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {saved && (
              <span className="badge badge-low fade-in" style={{ fontSize: 11, padding: '3px 8px' }}>✅ Saved</span>
            )}
            {user && (
              <button
                type="button"
                onClick={() => setUserModalOpen(true)}
                title={`Google Account: ${displayName} (${user.email})`}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 2,
                  cursor: 'pointer',
                  borderRadius: '50%'
                }}
              >
                <EmailAvatar
                  src={avatar || user?.avatar}
                  email={user.email}
                  name={displayName}
                  size={34}
                  isUser={true}
                  color={avatarColor || user?.avatarColor}
                  showTooltip={false}
                  style={{ border: '1.5px solid rgba(255, 255, 255, 0.2)' }}
                />
              </button>
            )}
          </div>
        </div>
        <div className="page-content">

          {/* User Profile Card - Gmail Style */}
          {user && (
            <div className="card fade-in" style={{ padding: 24, marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                <EmailAvatar
                  src={avatar || user?.avatar}
                  email={user.email}
                  name={displayName}
                  size={76}
                  isUser={true}
                  color={avatarColor || user?.avatarColor}
                  showCameraBadge={true}
                  onCameraClick={() => setShowCustomizer(!showCustomizer)}
                  style={{
                    border: '2px solid rgba(255, 255, 255, 0.15)',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.35)'
                  }}
                />
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h1 style={{
                      fontSize: 22,
                      fontWeight: 800,
                      margin: 0,
                      fontFamily: '"Google Sans", "Product Sans", Roboto, system-ui, sans-serif'
                    }}>
                      {displayName}
                    </h1>
                    <span className="badge badge-low" style={{ fontSize: 11 }}>● Active</span>
                  </div>
                  <div style={{ fontSize: 13.5, color: 'var(--muted)', fontFamily: 'monospace', marginTop: 3 }}>
                    {user.email}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    <span className="badge badge-purple">{providerLabels[user.provider] || 'Google Account'}</span>
                    <button
                      type="button"
                      className="chip"
                      onClick={() => setShowCustomizer(!showCustomizer)}
                      style={{ fontSize: 12, cursor: 'pointer' }}
                    >
                      📷 {showCustomizer ? 'Hide Photo Options' : 'Customize Profile Picture'}
                    </button>
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

              {/* Profile Picture Customizer Box */}
              {showCustomizer && (
                <div style={{
                  marginTop: 20,
                  padding: 18,
                  background: 'var(--surface2)',
                  borderRadius: 12,
                  border: '1px solid var(--border)'
                }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px 0' }}>
                    Gmail Profile Picture & Color Options
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                        Custom Photo URL / Link:
                      </label>
                      <input
                        type="url"
                        value={avatar}
                        onChange={e => setAvatar(e.target.value)}
                        placeholder="https://example.com/photo.jpg"
                        style={{
                          width: '100%',
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          padding: '8px 12px',
                          color: 'var(--text)',
                          fontSize: 13,
                          marginBottom: 10,
                          boxSizing: 'border-box'
                        }}
                      />

                      <div style={{ display: 'flex', gap: 8 }}>
                        <label
                          style={{
                            flex: 1,
                            background: 'var(--surface)',
                            border: '1px dashed var(--border2)',
                            borderRadius: 8,
                            padding: '7px 10px',
                            fontSize: 12,
                            textAlign: 'center',
                            color: 'var(--muted)',
                            cursor: 'pointer'
                          }}
                        >
                          📁 Upload Photo File
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            style={{ display: 'none' }}
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => setAvatar('')}
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: 11 }}
                          title="Reset to automatic Google profile or initials"
                        >
                          🔄 Auto Google
                        </button>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>
                        Google Material Design Avatar Color:
                      </label>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(8, 1fr)',
                        gap: 6,
                        marginBottom: 10
                      }}>
                        {GMAIL_AVATAR_PALETTE.map((pal) => {
                          const isSelected = (avatarColor && avatarColor.toLowerCase() === pal.hex.toLowerCase()) ||
                            (!avatarColor && !avatar && pal.hex === '#1a73e8');
                          return (
                            <button
                              key={pal.hex}
                              type="button"
                              onClick={() => {
                                setAvatarColor(pal.hex);
                              }}
                              title={pal.name}
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                background: pal.hex,
                                border: isSelected ? '2px solid #ffffff' : '1px solid rgba(0,0,0,0.2)',
                                boxShadow: isSelected ? '0 0 0 2px var(--accent)' : 'none',
                                cursor: 'pointer',
                                transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                                transition: 'transform 0.15s ease'
                              }}
                            />
                          );
                        })}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        Pick a color to personalize your letter avatar initials.
                      </div>
                    </div>
                  </div>
                </div>
              )}
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

          {/* Autonomous AI Agent */}
          <Section title="Autonomous AI Agent & Terminal">
            <Row label="Interactive Agent Terminal" desc="Access autonomous inbox intelligence, classification & terminal CLI">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => router.push('/terminal')}
                style={{ fontSize: 13, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <span>🤖</span> Launch AI Agent Console →
              </button>
            </Row>
            <Row label="System CLI Agent" desc="Run MailMind natively from your system terminal with full node execution">
              <div style={{ fontFamily: 'monospace', fontSize: 12, background: 'var(--surface2)', padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)' }}>
                $ npm run agent
              </div>
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

      {userModalOpen && (
        <GoogleAccountModal
          user={user}
          onClose={() => setUserModalOpen(false)}
          onOpenCompose={() => router.push('/inbox')}
          onDisconnect={handleDisconnect}
          onUserUpdate={(updated) => {
            setUser(updated);
            if (updated.avatar !== undefined) setAvatar(updated.avatar);
            if (updated.avatarColor !== undefined) setAvatarColor(updated.avatarColor);
            if (updated.name !== undefined) setName(updated.name);
          }}
        />
      )}
    </div>
  );
}
