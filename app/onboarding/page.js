'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import EmailAvatar from '@/components/EmailAvatar';
import ProviderIcon, { PROVIDER_LIST } from '@/components/ProviderIcon';
import { extractDisplayName } from '@/lib/avatar-utils';
import { addOrUpdateAccount } from '@/lib/account-manager';
import {
  requestDeviceNotificationPermission,
  getDeviceNotificationPermission,
  saveNotificationSettings
} from '@/lib/browser-notifications';

const STEPS = ['connect', 'tone', 'notifications', 'done'];

const providers = PROVIDER_LIST;

const tones = [
  { id: 'professional', label: 'Professional', emoji: '💼', desc: 'Polished and clear — great for work emails' },
  { id: 'casual',       label: 'Casual',       emoji: '😊', desc: 'Relaxed and friendly — feels like you' },
  { id: 'brief',        label: 'Brief',         emoji: '⚡', desc: 'Short and direct — max 3 sentences' },
];

function ProgressBar({ step }) {
  const idx = STEPS.indexOf(step);
  const pct = (idx / (STEPS.length - 1)) * 100;
  return (
    <div style={{ width: '100%', height: 3, background: 'var(--border)', borderRadius: 2, marginBottom: 40 }}>
      <div style={{
        height: '100%', width: `${pct}%`,
        background: 'linear-gradient(90deg, var(--accent), #a78bfa)',
        borderRadius: 2, transition: 'width 0.5s ease',
      }} />
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState('connect');
  const [selectedProvider, setSelectedProvider] = useState('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [imapHost, setImapHost] = useState('');
  const [imapPort, setImapPort] = useState('993');
  const [connecting, setConnecting] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authHint, setAuthHint] = useState('');
  const [tone, setTone] = useState('professional');
  const [inApp, setInApp] = useState(true);
  const [deviceNotifications, setDeviceNotifications] = useState(true);
  const [notifSound, setNotifSound] = useState(true);
  const [digest, setDigest] = useState(false);

  const handleToggleDevice = async (val) => {
    setDeviceNotifications(val);
    if (val && getDeviceNotificationPermission() === 'default') {
      await requestDeviceNotificationPermission();
    }
  };

  // Auto-detect provider when user types an email address
  const handleEmailChange = (newEmail) => {
    setEmail(newEmail);
    const domain = (newEmail.split('@')[1] || '').toLowerCase();
    if (domain.includes('gmail') || domain.includes('googlemail')) {
      setSelectedProvider('google');
    } else if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live') || domain.includes('office365')) {
      setSelectedProvider('microsoft');
    } else if (domain.includes('yahoo')) {
      setSelectedProvider('yahoo');
    } else if (domain.includes('icloud') || domain.includes('me.com') || domain.includes('mac.com')) {
      setSelectedProvider('icloud');
    }
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setAuthError('Please enter your password or App Password.');
      return;
    }

    setConnecting(true);
    setAuthError('');
    setAuthHint('');

    try {
      let res;
      try {
        res = await fetch('/api/auth/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            provider: selectedProvider,
            host: selectedProvider === 'custom' ? imapHost : undefined,
            port: selectedProvider === 'custom' ? imapPort : undefined,
            tone
          })
        });
      } catch {
        res = await fetch('http://localhost:3002/api/auth/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            provider: selectedProvider,
            host: selectedProvider === 'custom' ? imapHost : undefined,
            port: selectedProvider === 'custom' ? imapPort : undefined,
            tone
          })
        });
      }

      const data = await res.json();
      if (res.ok && data.success) {
        setConnecting(false);
        setStep('tone');
      } else {
        setConnecting(false);
        setAuthError(data.error || 'Failed to authenticate with your email server.');
        if (data.hint) setAuthHint(data.hint);
      }
    } catch (err) {
      setConnecting(false);
      setAuthError('Connection error: ' + (err.message || 'Unable to connect to email authentication service.'));
    }
  };

  const handleDone = () => {
    const displayName = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const newUser = {
      provider: selectedProvider,
      email: email.trim().toLowerCase(),
      password: password,
      tone,
      monitoringMode: 'ask_permission',
      inApp,
      deviceNotifications,
      notifSound,
      digest,
      connected: true,
      isDemo: false,
      name: displayName || 'User',
      savedAt: new Date().toISOString()
    };
    saveNotificationSettings({
      enabled: deviceNotifications,
      sound: notifSound
    });
    localStorage.setItem('mailmind_user', JSON.stringify(newUser));
    addOrUpdateAccount(newUser);
    router.push('/inbox');
  };

  const currentProviderObj = providers.find(p => p.id === selectedProvider) || providers[0];

  return (
    <div style={{
      minHeight: '100vh',
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 14px',
      boxSizing: 'border-box',
      width: '100%',
      maxWidth: '100vw',
      overflowX: 'hidden'
    }}>
      <div style={{ width: '100%', maxWidth: 540, boxSizing: 'border-box' }} className="fade-in">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, background: 'linear-gradient(135deg, var(--accent), #a78bfa)',
            borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, margin: '0 auto 12px', boxShadow: '0 4px 20px rgba(108,99,255,0.35)'
          }}>✉️</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>
            Mail<span style={{ color: 'var(--accent)' }}>Mind</span>
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13.5, marginTop: 4 }}>Log in with your email to monitor your inbox & draft replies</p>
        </div>

        <ProgressBar step={step} />

        {/* Step: Connect / Login */}
        {step === 'connect' && (
          <div className="fade-in">
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Connect your email account</h2>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 18 }}>
              Sign in with your email to enable real-time inbox monitoring, history search, and permission-based AI drafting on your mailbox.
            </p>

            {/* Provider Selector Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: 8, marginBottom: 18 }}>
              {providers.map(p => {
                const isSelected = selectedProvider === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedProvider(p.id);
                      setAuthError('');
                      setAuthHint('');
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                      padding: '12px 6px',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'var(--accent-glow)' : 'var(--surface)',
                      border: `1.5px solid ${isSelected ? (p.color || 'var(--accent)') : 'var(--border)'}`,
                      color: isSelected ? 'var(--text)' : 'var(--muted)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'center'
                    }}
                    title={p.brandName || p.name}
                  >
                    <ProviderIcon provider={p.id} size={22} />
                    <span style={{ fontSize: 11, fontWeight: isSelected ? 700 : 600, lineHeight: 1.2 }}>
                      {p.shortName || p.name.split('/')[0].trim()}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Login Form */}
            <form onSubmit={handleConnect} className="card" style={{ padding: 24 }}>
              {authError && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.12)', border: '1px solid var(--danger)',
                  borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#fca5a5', marginBottom: 16,
                  lineHeight: 1.5
                }}>
                  <div style={{ fontWeight: 600 }}>⚠️ Authentication Failed</div>
                  <div>{authError}</div>
                  {authHint && <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9 }}>💡 {authHint}</div>}
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  className="input"
                  placeholder="e.g. you@gmail.com, you@outlook.com"
                  value={email}
                  onChange={e => handleEmailChange(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>
                    {selectedProvider === 'google' || selectedProvider === 'yahoo' || selectedProvider === 'icloud'
                      ? 'App Password'
                      : 'Password / App Password'}
                  </label>
                  {currentProviderObj.guideUrl && (
                    <a
                      href={currentProviderObj.guideUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: 11.5, color: 'var(--accent)', textDecoration: 'underline' }}
                    >
                      Get {currentProviderObj.name.split('/')[0].trim()} App Password ↗
                    </a>
                  )}
                </div>
                <input
                  type="password"
                  required
                  className="input"
                  placeholder={selectedProvider === 'google' ? '16-character App Password (e.g. abcd efgh ijkl mnop)' : 'Enter password or App Password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 6, lineHeight: 1.4, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <ProviderIcon provider={selectedProvider} size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                  <div>
                    {selectedProvider === 'google' && (
                      <span>Gmail requires an App Password. Generate one at <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>myaccount.google.com/apppasswords</a>.</span>
                    )}
                    {selectedProvider === 'microsoft' && (
                      <span>Use your Outlook/Office 365 password or Microsoft App Password from <a href="https://account.live.com/proofs/manage/additional" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Security Settings</a>.</span>
                    )}
                    {selectedProvider === 'yahoo' && (
                      <span>Generate an App Password in <a href="https://login.yahoo.com/account/security" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Yahoo Account Security</a> settings.</span>
                    )}
                    {selectedProvider === 'icloud' && (
                      <span>Generate an app-specific password at <a href="https://appleid.apple.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>appleid.apple.com</a>.</span>
                    )}
                    {selectedProvider === 'custom' && (
                      <span>Enter your email account password and IMAP server settings below.</span>
                    )}
                  </div>
                </div>
              </div>

              {selectedProvider === 'custom' && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <div style={{ flex: 2 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>IMAP Host</label>
                    <input
                      type="text"
                      required
                      className="input"
                      placeholder="imap.yourserver.com"
                      value={imapHost}
                      onChange={e => setImapHost(e.target.value)}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Port</label>
                    <input
                      type="text"
                      required
                      className="input"
                      placeholder="993"
                      value={imapPort}
                      onChange={e => setImapPort(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: 8 }}
                disabled={connecting}
              >
                {connecting ? (
                  <><span className="spinner" style={{ width: 16, height: 16 }} /> Verifying & Connecting…</>
                ) : (
                  'Log in & Connect Inbox →'
                )}
              </button>
            </form>
          </div>
        )}

        {/* Step: Tone */}
        {step === 'tone' && (
          <div className="fade-in">
            <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>✅</span> Connected as: <strong>{email}</strong>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Pick your AI reply tone</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
              MailMind will adapt to this style when drafting email responses for your review and approval.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
              {tones.map(t => (
                <div
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
                    background: tone === t.id ? 'var(--accent-glow)' : 'var(--surface)',
                    border: `1px solid ${tone === t.id ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius)', cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize: 24 }}>{t.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{t.label}</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)' }}>{t.desc}</div>
                  </div>
                  {tone === t.id && <span style={{ marginLeft: 'auto', color: 'var(--accent)', fontSize: 18 }}>✓</span>}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost btn-lg" style={{ flex: 1 }} onClick={() => setStep('connect')}>
                ← Back
              </button>
              <button className="btn btn-primary btn-lg" style={{ flex: 2 }} onClick={() => setStep('notifications')}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step: Notifications */}
        {step === 'notifications' && (
          <div className="fade-in">
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Notification preferences</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
              Choose how you would like to be alerted when new emails and reply drafts arrive.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
              {[
                { label: 'Device & desktop notifications', desc: 'Real-time alerts sent to your OS desktop or device', val: deviceNotifications, set: handleToggleDevice },
                { label: 'Notification sound alert', desc: 'Audio chime when important emails arrive', val: notifSound, set: setNotifSound },
                { label: 'In-app notifications', desc: 'Real-time bell updates inside MailMind', val: inApp, set: setInApp },
                { label: 'Daily digest email', desc: 'Morning summary of key emails', val: digest, set: setDigest },
              ].map(item => (
                <div key={item.label} className="card" style={{ padding: '16px 20px' }}>
                  <div className="toggle-wrap">
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{item.label}</div>
                      <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{item.desc}</div>
                    </div>
                    <div className={`toggle${item.val ? ' on' : ''}`} onClick={() => item.set(!item.val)} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost btn-lg" style={{ flex: 1 }} onClick={() => setStep('tone')}>
                ← Back
              </button>
              <button className="btn btn-primary btn-lg" style={{ flex: 2 }} onClick={() => setStep('done')}>
                Save & continue →
              </button>
            </div>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <div className="fade-in" style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-block', marginBottom: 14 }}>
              <EmailAvatar
                email={email}
                name={extractDisplayName('', email)}
                size={72}
                isUser={true}
                style={{
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 4px 20px rgba(108, 99, 255, 0.35)'
                }}
              />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, fontFamily: '"Google Sans", "Product Sans", Roboto, system-ui, sans-serif' }}>
              You're all set!
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>
              MailMind is now connected to your inbox, reading incoming messages, summarizing email history, and drafting replies — always waiting for your approval before sending.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 340, margin: '0 auto 32px', textAlign: 'left' }}>
              <div style={{ fontSize: 14, color: 'var(--success)' }}>✅ Google / Gmail Account: <strong>{email}</strong></div>
              <div style={{ fontSize: 14, color: 'var(--success)' }}>✅ AI Reply Tone: {tone}</div>
              <div style={{ fontSize: 14, color: 'var(--success)' }}>✅ Full History &amp; Search Enabled</div>
              <div style={{ fontSize: 14, color: 'var(--success)' }}>✅ Permission-first: No replies sent without your approval</div>
            </div>
            <button className="btn btn-primary btn-lg" style={{ width: '100%', maxWidth: 320, margin: '0 auto' }} onClick={handleDone}>
              Open my inbox →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
