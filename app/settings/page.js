'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import EmailAvatar, { GMAIL_AVATAR_PALETTE } from '@/components/EmailAvatar';
import GoogleAccountModal from '@/components/GoogleAccountModal';
import { extractDisplayName } from '@/lib/avatar-utils';
import {
  getActiveUser,
  getStoredAccounts,
  removeStoredAccount,
  switchActiveAccount,
  isDemoAccount
} from '@/lib/account-manager';

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
  const [accounts, setAccounts] = useState([]);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [avatarColor, setAvatarColor] = useState('');
  const [tone, setTone] = useState('professional');
  const [monitoringMode, setMonitoringMode] = useState('ask_permission');
  const [inApp, setInApp] = useState(true);
  const [digest, setDigest] = useState(false);
  const [pollInterval, setPollInterval] = useState('3');
  const [disconnecting, setDisconnecting] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saved, setSaved] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userModalTab, setUserModalTab] = useState('overview');
  const [showCustomizer, setShowCustomizer] = useState(false);

  const refreshAccountsList = () => {
    try {
      setAccounts(getStoredAccounts());
    } catch {
      setAccounts([]);
    }
  };

  useEffect(() => {
    const stored = getActiveUser();
    if (!stored || !stored.connected || !stored.email || isDemoAccount(stored)) {
      router.replace('/onboarding');
      return;
    }
    setUser(stored);
    if (stored.name) setName(stored.name);
    if (stored.avatar || stored.picture) setAvatar(stored.avatar || stored.picture || '');
    if (stored.avatarColor || stored.color) setAvatarColor(stored.avatarColor || stored.color || '');
    if (stored.tone) setTone(stored.tone);
    if (stored.monitoringMode) setMonitoringMode(stored.monitoringMode);
    if (stored.inApp !== undefined) setInApp(stored.inApp);
    if (stored.digest !== undefined) setDigest(stored.digest);
    if (stored.pollInterval) setPollInterval(stored.pollInterval);
    refreshAccountsList();

    const handleAccountSwitched = (e) => {
      if (e.detail && e.detail.email && !isDemoAccount(e.detail)) {
        const u = e.detail;
        setUser(u);
        if (u.name) setName(u.name);
        if (u.avatar || u.picture) setAvatar(u.avatar || u.picture || '');
        if (u.avatarColor || u.color) setAvatarColor(u.avatarColor || u.color || '');
        if (u.tone) setTone(u.tone);
        if (u.monitoringMode) setMonitoringMode(u.monitoringMode);
        refreshAccountsList();
      } else {
        router.replace('/onboarding');
      }
    };
    window.addEventListener('mailmind:account-switched', handleAccountSwitched);

    return () => {
      window.removeEventListener('mailmind:account-switched', handleAccountSwitched);
    };
  }, [router]);

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
      monitoringMode,
      inApp,
      digest,
      pollInterval
    };
    setUser(updated);
    localStorage.setItem('mailmind_user', JSON.stringify(updated));
    addOrUpdateAccount(updated);

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
          tone: updated.tone,
          monitoringMode: updated.monitoringMode
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
                      onClick={() => {
                        setUserModalTab('switch');
                        setUserModalOpen(true);
                      }}
                      style={{ fontSize: 12, cursor: 'pointer', background: 'var(--accent-glow)', borderColor: 'var(--accent)' }}
                    >
                      ⇄ Switch Account
                    </button>
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

          {/* Connected Accounts */}
          <Section title="Connected Email Accounts">
            <Row
              label={user?.email ? `Active: ${user.email}` : 'Active Account'}
              desc={`Provider: ${providerLabels[user?.provider] || user?.provider || 'Email Server'} · IMAP/SMTP Active`}
            >
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="badge badge-low">● Active</span>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setUserModalTab('switch');
                    setUserModalOpen(true);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <span>+</span> Add / Switch Account
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                >
                  {disconnecting ? 'Disconnecting…' : 'Sign out'}
                </button>
              </div>
            </Row>

            {/* List all saved accounts */}
            {accounts.length > 0 && (
              <div style={{ padding: '16px 24px', background: 'var(--surface2)', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.5px' }}>
                  All Saved Accounts on this Device ({accounts.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {accounts.map(acc => {
                    const isActive = acc.email.toLowerCase() === user?.email?.toLowerCase();
                    const accName = extractDisplayName(acc.name, acc.email);
                    return (
                      <div
                        key={acc.email}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: 10,
                          background: isActive ? 'var(--accent-glow)' : 'var(--surface)',
                          border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                          gap: 12
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                          <EmailAvatar
                            src={acc.avatar || acc.picture}
                            email={acc.email}
                            name={accName}
                            size={32}
                            color={acc.avatarColor || acc.color}
                            isUser={true}
                            showTooltip={false}
                          />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                                {accName}
                              </span>
                              {isActive && (
                                <span className="badge badge-low" style={{ fontSize: 10, padding: '1px 5px' }}>
                                  Active
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 11.5, color: 'var(--muted)', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {acc.email} ({providerLabels[acc.provider] || acc.provider || 'email'})
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          {!isActive && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: 11.5, padding: '4px 10px' }}
                              onClick={async () => {
                                await switchActiveAccount(acc);
                                refreshAccountsList();
                              }}
                            >
                              Switch to this
                            </button>
                          )}
                          {!isActive && (
                            <button
                              type="button"
                              title="Remove account"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--muted)',
                                cursor: 'pointer',
                                padding: '4px 8px',
                                fontSize: 14,
                                borderRadius: 4
                              }}
                              onClick={() => {
                                if (window.confirm(`Remove ${acc.email} from saved accounts?`)) {
                                  removeStoredAccount(acc.email);
                                  refreshAccountsList();
                                }
                              }}
                              onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; }}
                              onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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

          {/* Monitoring Mode & Agent Reply Policy */}
          <Section title="Agent Monitoring & Reply Permission Mode">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
                    Inbox Monitoring &amp; Reply Policy
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>
                    Choose whether MailMind must ask for your permission before sending replies, or if it can reply autonomously without permission.
                  </div>
                </div>
                <span
                  className={monitoringMode === 'auto_reply' || monitoringMode === 'without_permission' ? 'badge badge-purple' : 'badge badge-low'}
                  style={{ fontSize: 12, padding: '4px 10px' }}
                >
                  {monitoringMode === 'auto_reply' || monitoringMode === 'without_permission' ? '⚡ Autonomous Mode' : '🛡️ Permission-First Mode'}
                </span>
              </div>

              {/* Mode Selection Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginTop: 14 }}>
                {/* Option 1: Ask Permission */}
                <div
                  onClick={() => setMonitoringMode('ask_permission')}
                  style={{
                    background: (monitoringMode === 'ask_permission' || !monitoringMode) ? 'var(--accent-glow)' : 'var(--surface2)',
                    border: `2px solid ${monitoringMode === 'ask_permission' || !monitoringMode ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 12,
                    padding: '18px 20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    boxShadow: monitoringMode === 'ask_permission' || !monitoringMode ? '0 4px 16px rgba(108, 99, 255, 0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: monitoringMode === 'ask_permission' || !monitoringMode ? 'rgba(108, 99, 255, 0.2)' : 'var(--surface)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20
                      }}>
                        🛡️
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--text)' }}>
                          Ask Permission
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 1 }}>
                          Human-in-the-loop (Permission-First)
                        </div>
                      </div>
                    </div>
                    <div style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      border: `2px solid ${monitoringMode === 'ask_permission' || !monitoringMode ? 'var(--accent)' : 'var(--muted)'}`,
                      background: monitoringMode === 'ask_permission' || !monitoringMode ? 'var(--accent)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {(monitoringMode === 'ask_permission' || !monitoringMode) ? '✓' : ''}
                    </div>
                  </div>
                  <p style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.5, margin: '8px 0 0 0', opacity: 0.9 }}>
                    The agent continuously monitors your mailbox, categorizes messages, and prepares AI draft replies. <strong>No reply is sent without your explicit review and approval.</strong>
                  </p>
                  <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span className="badge badge-low" style={{ fontSize: 10.5, padding: '2px 7px' }}>🔒 100% Safe</span>
                    <span className="badge" style={{ fontSize: 10.5, padding: '2px 7px', background: 'var(--surface)', border: '1px solid var(--border)' }}>Review Drafts First</span>
                    <span className="badge" style={{ fontSize: 10.5, padding: '2px 7px', background: 'var(--surface)', border: '1px solid var(--border)' }}>Zero Unapproved Sends</span>
                  </div>
                </div>

                {/* Option 2: Reply Without Permission */}
                <div
                  onClick={() => setMonitoringMode('auto_reply')}
                  style={{
                    background: (monitoringMode === 'auto_reply' || monitoringMode === 'without_permission') ? 'var(--accent-glow)' : 'var(--surface2)',
                    border: `2px solid ${monitoringMode === 'auto_reply' || monitoringMode === 'without_permission' ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 12,
                    padding: '18px 20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    boxShadow: monitoringMode === 'auto_reply' || monitoringMode === 'without_permission' ? '0 4px 16px rgba(108, 99, 255, 0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: (monitoringMode === 'auto_reply' || monitoringMode === 'without_permission') ? 'rgba(168, 85, 247, 0.2)' : 'var(--surface)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20
                      }}>
                        ⚡
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--text)' }}>
                          Reply Without Permission
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 1 }}>
                          Autonomous Auto-Pilot
                        </div>
                      </div>
                    </div>
                    <div style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      border: `2px solid ${(monitoringMode === 'auto_reply' || monitoringMode === 'without_permission') ? 'var(--accent)' : 'var(--muted)'}`,
                      background: (monitoringMode === 'auto_reply' || monitoringMode === 'without_permission') ? 'var(--accent)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {(monitoringMode === 'auto_reply' || monitoringMode === 'without_permission') ? '✓' : ''}
                    </div>
                  </div>
                  <p style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.5, margin: '8px 0 0 0', opacity: 0.9 }}>
                    The agent monitors incoming emails, crafts smart responses in your chosen tone, and <strong>sends replies automatically via SMTP without waiting for confirmation.</strong>
                  </p>
                  <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span className="badge badge-purple" style={{ fontSize: 10.5, padding: '2px 7px' }}>⚡ Auto-Pilot</span>
                    <span className="badge" style={{ fontSize: 10.5, padding: '2px 7px', background: 'var(--surface)', border: '1px solid var(--border)' }}>Instant SMTP Dispatch</span>
                    <span className="badge" style={{ fontSize: 10.5, padding: '2px 7px', background: 'var(--surface)', border: '1px solid var(--border)' }}>Hands-Free Replies</span>
                  </div>
                </div>
              </div>

              {/* Status Banner */}
              <div style={{
                marginTop: 16,
                padding: '12px 16px',
                borderRadius: 10,
                background: (monitoringMode === 'auto_reply' || monitoringMode === 'without_permission') ? 'rgba(168, 85, 247, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                border: `1px solid ${(monitoringMode === 'auto_reply' || monitoringMode === 'without_permission') ? 'rgba(168, 85, 247, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                fontSize: 12.5,
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}>
                <span style={{ fontSize: 16 }}>{(monitoringMode === 'auto_reply' || monitoringMode === 'without_permission') ? '⚡' : '🛡️'}</span>
                <div>
                  <strong>Active Policy: </strong>
                  {(monitoringMode === 'auto_reply' || monitoringMode === 'without_permission')
                    ? 'The agent is authorized to reply without permission. Actionable incoming messages will be replied to automatically in real time.'
                    : 'The agent will ask for permission before sending any replies. All generated drafts will await your approval in your Inbox.'}
                </div>
              </div>
            </div>
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
          initialTab={userModalTab}
          onClose={() => {
            setUserModalOpen(false);
            setUserModalTab('overview');
          }}
          onOpenCompose={() => router.push('/inbox')}
          onDisconnect={handleDisconnect}
          onUserUpdate={(updated) => {
            setUser(updated);
            if (updated.avatar !== undefined) setAvatar(updated.avatar);
            if (updated.avatarColor !== undefined) setAvatarColor(updated.avatarColor);
            if (updated.name !== undefined) setName(updated.name);
            if (updated.monitoringMode !== undefined) setMonitoringMode(updated.monitoringMode);
          }}
          onAccountSwitch={(switched) => {
            setUser(switched);
            if (switched.name) setName(switched.name);
            if (switched.avatar !== undefined) setAvatar(switched.avatar);
            if (switched.avatarColor !== undefined) setAvatarColor(switched.avatarColor);
            if (switched.tone) setTone(switched.tone);
            if (switched.monitoringMode !== undefined) setMonitoringMode(switched.monitoringMode);
          }}
        />
      )}
    </div>
  );
}
