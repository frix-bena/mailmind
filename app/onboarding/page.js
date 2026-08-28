'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import EmailAvatar from '@/components/EmailAvatar';
import ProviderIcon, { PROVIDER_LIST } from '@/components/ProviderIcon';
import AppPasswordModal from '@/components/AppPasswordModal';
import { extractDisplayName, isValidEmail } from '@/lib/avatar-utils';
import { addOrUpdateAccount, isExistingUser } from '@/lib/account-manager';
import { cleanAppPassword, PROVIDER_GUIDES } from '@/lib/app-password-generator';
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
    <div style={{ width: '100%', height: 3, background: 'var(--border)', borderRadius: 2, marginBottom: 36 }}>
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
  const [showPassword, setShowPassword] = useState(false);
  const [imapHost, setImapHost] = useState('');
  const [imapPort, setImapPort] = useState('993');
  const [connecting, setConnecting] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authHint, setAuthHint] = useState('');
  const [appPasswordModalOpen, setAppPasswordModalOpen] = useState(false);
  const [appPasswordModalTab, setAppPasswordModalTab] = useState('guide');
  const [isSavedEmailFound, setIsSavedEmailFound] = useState(false);

  const [tone, setTone] = useState('professional');
  const [inApp, setInApp] = useState(true);
  const [deviceNotifications, setDeviceNotifications] = useState(true);
  const [notifSound, setNotifSound] = useState(true);
  const [digest, setDigest] = useState(false);

  const openAppPasswordModal = (tab = 'guide') => {
    setAppPasswordModalTab(tab);
    setAppPasswordModalOpen(true);
  };

  const handleToggleDevice = async (val) => {
    setDeviceNotifications(val);
    if (val && getDeviceNotificationPermission() === 'default') {
      await requestDeviceNotificationPermission();
    }
  };

  // Auto-detect provider when user enters email
  const handleEmailChange = (newEmail) => {
    setEmail(newEmail);
    setAuthError('');
    setAuthHint('');

    const clean = newEmail.trim().toLowerCase();
    const domain = (clean.split('@')[1] || '').toLowerCase();
    if (domain.includes('gmail') || domain.includes('googlemail')) {
      setSelectedProvider('google');
    } else if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live') || domain.includes('office365')) {
      setSelectedProvider('microsoft');
    } else if (domain.includes('yahoo')) {
      setSelectedProvider('yahoo');
    } else if (domain.includes('icloud') || domain.includes('me.com') || domain.includes('mac.com')) {
      setSelectedProvider('icloud');
    }

    if (isValidEmail(clean)) {
      setIsSavedEmailFound(isExistingUser(clean));
    } else {
      setIsSavedEmailFound(false);
    }
  };

  const executeConnection = async (targetPassword) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      setAuthError('Please enter a valid email address (e.g. yourname@gmail.com).');
      return;
    }

    const passToUse = targetPassword !== undefined ? targetPassword : password;
    if (passToUse == null || String(passToUse).trim() === '') {
      setAuthError(
        selectedProvider === 'google' || cleanEmail.includes('gmail')
          ? 'Password is required. Please generate a 16-character Google App Password manually and paste it here.'
          : 'Password is required. Please enter your email password or App Password.'
      );
      return;
    }

    setConnecting(true);
    setAuthError('');
    setAuthHint('');

    try {
      let res;
      const payload = JSON.stringify({
        email: cleanEmail,
        password: String(passToUse).trim(),
        provider: selectedProvider,
        host: selectedProvider === 'custom' ? imapHost : undefined,
        port: selectedProvider === 'custom' ? imapPort : undefined,
        tone
      });

      try {
        res = await fetch('/api/auth/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload
        });
      } catch {
        res = await fetch('http://localhost:3002/api/auth/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload
        });
      }

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setConnecting(false);
        setStep('tone');
      } else {
        setConnecting(false);
        setAuthError(data.error || 'Authentication failed. Please check your credentials.');
        if (data.hint) {
          setAuthHint(data.hint);
        } else if (selectedProvider === 'google' || cleanEmail.includes('gmail')) {
          setAuthHint('Google requires generating a 16-character App Password manually at https://myaccount.google.com/apppasswords.');
        }
      }
    } catch (err) {
      setConnecting(false);
      setAuthError('Connection error: ' + (err.message || 'Unable to connect to email authentication service.'));
    }
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    await executeConnection();
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
  const guide = PROVIDER_GUIDES[selectedProvider] || PROVIDER_GUIDES.google;
  const isGoogle = selectedProvider === 'google' || email.toLowerCase().includes('gmail');

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
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 52, height: 52, background: 'linear-gradient(135deg, var(--accent), #a78bfa)',
            borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, margin: '0 auto 12px', boxShadow: '0 4px 20px rgba(108,99,255,0.35)'
          }}>✉️</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>
            Mail<span style={{ color: 'var(--accent)' }}>Mind</span>
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13.5, marginTop: 4 }}>
            Connect your inbox to monitor emails and automate replies with AI
          </p>
        </div>

        <ProgressBar step={step} />

        {/* Step: Connect / Login */}
        {step === 'connect' && (
          <div className="fade-in">
            {/* Header */}
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                Sign in to your email account
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>
                Select your email provider and sign in with your email address and 16-character App Password.
              </p>
            </div>

            {/* Provider Selector Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: 8, marginBottom: 16 }}>
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

            {/* Manual Google App Password Guide Banner */}
            {isGoogle ? (
              <div style={{
                background: 'linear-gradient(135deg, rgba(66, 133, 244, 0.1), rgba(234, 67, 53, 0.08))',
                border: '1px solid rgba(66, 133, 244, 0.3)',
                borderRadius: 14,
                padding: '14px 16px',
                marginBottom: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>🔑</span> Google App Password Required
                  </div>
                  <button
                    type="button"
                    onClick={() => openAppPasswordModal('guide')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline'
                    }}
                  >
                    📖 View Step-by-Step Guide
                  </button>
                </div>

                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.45, marginBottom: 10 }}>
                  Google requires a <strong>16-character App Password</strong> (not your regular password) when 2-Step Verification is active.
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                    style={{
                      fontSize: 12,
                      padding: '6px 14px',
                      borderRadius: 8,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontWeight: 700
                    }}
                  >
                    <span>Generate App Password in Google ↗</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => openAppPasswordModal('guide')}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8 }}
                  >
                    <span>📖 Instructions</span>
                  </button>
                </div>
              </div>
            ) : (
              guide.appPasswordUrl && (
                <div style={{
                  background: 'rgba(108, 99, 255, 0.08)',
                  border: '1px solid rgba(108, 99, 255, 0.25)',
                  borderRadius: 12,
                  padding: '12px 14px',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  flexWrap: 'wrap'
                }}>
                  <div style={{ fontSize: 12, color: 'var(--text)', flex: 1, minWidth: 200 }}>
                    <strong>Using {guide.name}?</strong> Generate a 16-character App Password in your account security console.
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <a
                      href={guide.appPasswordUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: 11.5, padding: '5px 12px', borderRadius: 8, textDecoration: 'none' }}
                    >
                      <span>Open {guide.shortName} Console ↗</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => openAppPasswordModal('guide')}
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: 11.5, padding: '5px 10px', borderRadius: 8 }}
                    >
                      Guide
                    </button>
                  </div>
                </div>
              )
            )}

            {/* Login Form */}
            <form onSubmit={handleConnect} className="card" style={{ padding: 24 }}>
              {authError && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.12)', border: '1px solid var(--danger)',
                  borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#fca5a5', marginBottom: 16,
                  lineHeight: 1.5
                }}>
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>⚠️</span> Authentication Failed
                  </div>
                  <div style={{ marginTop: 4 }}>{authError}</div>
                  {authHint && <div style={{ marginTop: 6, fontSize: 12, opacity: 0.95 }}>💡 {authHint}</div>}

                  {isGoogle && (
                    <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--text)' }}>Need a Google App Password?</span>
                      <a
                        href="https://myaccount.google.com/apppasswords"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: '#EA4335',
                          color: '#fff',
                          fontSize: 11.5,
                          fontWeight: 700,
                          borderRadius: 6,
                          padding: '5px 12px',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5
                        }}
                      >
                        <span>Open Google App Passwords ↗</span>
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Email Address Field */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>
                    Email Address
                  </label>
                  {isSavedEmailFound && (
                    <span style={{ fontSize: 11, color: '#86efac', background: 'rgba(34, 197, 94, 0.15)', padding: '2px 8px', borderRadius: 6 }}>
                      ✓ Saved account on device
                    </span>
                  )}
                </div>
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

              {/* Password / App Password Field */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 4 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>
                    {isGoogle ? 'Google 16-Character App Password' : 'Password / App Password'} <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  {guide.appPasswordUrl && (
                    <a
                      href={guide.appPasswordUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: 'var(--accent)',
                        fontSize: 11.5,
                        fontWeight: 600,
                        textDecoration: 'underline'
                      }}
                    >
                      Get {guide.shortName} App Password ↗
                    </a>
                  )}
                </div>

                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="input"
                    placeholder={isGoogle ? 'Paste 16-character Google code (e.g. abcd efgh ijkl mnop)' : 'Enter your email or 16-char App Password'}
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      setAuthError('');
                      setAuthHint('');
                    }}
                    style={{ paddingRight: 40, fontFamily: showPassword ? 'monospace' : 'inherit' }}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 15,
                      color: 'var(--muted)',
                      padding: '4px'
                    }}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>

                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                  <span>
                    {isGoogle
                      ? 'Copy the 16-character code from Google and paste it here.'
                      : `Enter your ${currentProviderObj.name} password or App Password.`}
                  </span>
                  <button
                    type="button"
                    onClick={() => openAppPasswordModal('guide')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent)',
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline'
                    }}
                  >
                    Setup instructions
                  </button>
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

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: 8 }}
                disabled={connecting || !email || !password}
              >
                {connecting ? (
                  <><span className="spinner" style={{ width: 16, height: 16 }} /> Verifying & Connecting…</>
                ) : (
                  'Verify & Connect Inbox →'
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
              You&apos;re all set!
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>
              MailMind is now connected to your inbox, reading incoming messages, summarizing email history, and drafting replies — always waiting for your approval before sending.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 340, margin: '0 auto 32px', textAlign: 'left' }}>
              <div style={{ fontSize: 14, color: 'var(--success)' }}>✅ {currentProviderObj.name} Account: <strong>{email}</strong></div>
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

      {appPasswordModalOpen && (
        <AppPasswordModal
          isOpen={appPasswordModalOpen}
          initialProvider={selectedProvider}
          initialTab={appPasswordModalTab}
          userEmail={email}
          onClose={() => setAppPasswordModalOpen(false)}
          onSelectPassword={(pwd) => {
            setPassword(pwd);
            setAuthError('');
            setAuthHint('');
          }}
        />
      )}
    </div>
  );
}
