'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import EmailAvatar from '@/components/EmailAvatar';
import ProviderIcon, { PROVIDER_LIST } from '@/components/ProviderIcon';
import AppPasswordModal from '@/components/AppPasswordModal';
import LegalModal from '@/components/LegalModal';
import { extractDisplayName, isValidEmail } from '@/lib/avatar-utils';
import { addOrUpdateAccount, isExistingUser } from '@/lib/account-manager';
import { generateAppPassword, PROVIDER_GUIDES } from '@/lib/app-password-generator';
import {
  requestDeviceNotificationPermission,
  getDeviceNotificationPermission,
  saveNotificationSettings
} from '@/lib/browser-notifications';
import {
  MailIcon,
  KeyIcon,
  CheckIcon,
  CloseIcon,
  ShieldCheckIcon,
  ChevronRightIcon
} from '@/components/Icons';

const STEPS = ['connect', 'tone', 'notifications', 'done'];

const providers = PROVIDER_LIST;

const TONE_OPTIONS = [
  {
    id: 'professional',
    label: 'Executive & Articulate',
    tagline: 'Polished, clear, and balanced for professional correspondence',
    sample: "Thank you for the update, Sarah. I have reviewed the proposal and the timeline aligns with our objectives. Let us proceed with Tuesday's deployment as planned.",
    badge: 'Recommended for Work'
  },
  {
    id: 'casual',
    label: 'Conversational & Warm',
    tagline: 'Friendly, natural, and personable for collaborative teams',
    sample: "Hey Sarah, thanks for passing this along! Everything looks great to me. Let's aim for Tuesday to get it out the door. Talk soon!",
    badge: 'Internal Collaboration'
  },
  {
    id: 'brief',
    label: 'Concise & Direct',
    tagline: 'Direct sentences with zero filler for high-volume inboxes',
    sample: "Reviewed and approved. Ready to proceed with the Tuesday launch.",
    badge: 'High Efficiency'
  },
];

function ProgressBar({ step }) {
  const idx = STEPS.indexOf(step);
  const pct = (idx / (STEPS.length - 1)) * 100;
  return (
    <div style={{ width: '100%', height: 3, background: 'var(--border)', borderRadius: 2, marginBottom: 32 }}>
      <div style={{
        height: '100%', width: `${pct}%`,
        background: 'var(--accent)',
        borderRadius: 2, transition: 'width 0.35s ease',
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
  const [appPasswordModalTab, setAppPasswordModalTab] = useState('generator');
  const [isSavedEmailFound, setIsSavedEmailFound] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState('terms');

  const [tone, setTone] = useState('professional');
  const [inApp, setInApp] = useState(true);
  const [deviceNotifications, setDeviceNotifications] = useState(true);
  const [notifSound, setNotifSound] = useState(true);
  const [digest, setDigest] = useState(false);

  const openAppPasswordModal = (tab = 'generator') => {
    setAppPasswordModalTab(tab);
    setAppPasswordModalOpen(true);
  };

  const handleGenerateGooglePassword = () => {
    const pwd = generateAppPassword({ format: 'spaced', length: 16 });
    setPassword(pwd);
    setShowPassword(true);
    setAuthError('');
    setAuthHint('Generated standard 16-character App Password applied.');
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
      setAuthError('Password is required. Please enter or generate an App Password.');
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
        setAuthError(data.error || 'Authentication failed. Please verify your credentials.');
        if (data.hint) {
          setAuthHint(data.hint);
        } else if (selectedProvider === 'google' || cleanEmail.includes('gmail')) {
          setAuthHint('Google accounts require a 16-character App Password generated in your Google Security Console.');
        }
      }
    } catch (err) {
      setConnecting(false);
      setAuthError('Connection error: ' + (err.message || 'Unable to connect to email server.'));
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
  const activeToneObj = TONE_OPTIONS.find(t => t.id === tone) || TONE_OPTIONS[0];

  return (
    <div style={{
      minHeight: '100vh',
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px',
      boxSizing: 'border-box',
      width: '100%',
      maxWidth: '100vw',
      overflowX: 'hidden'
    }}>
      <div style={{ width: '100%', maxWidth: 560, boxSizing: 'border-box' }} className="fade-in">
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 44, height: 44, background: 'var(--surface2)',
            border: '1px solid var(--border2)', color: 'var(--accent)',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px'
          }}>
            <MailIcon size={20} />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5 }}>
            Mail<span style={{ color: 'var(--accent)' }}>Mind</span>
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13.5, marginTop: 4 }}>
            Thoughtful inbox monitoring and permission-first drafts
          </p>
        </div>

        <ProgressBar step={step} />

        {/* Step: Connect / Login */}
        {step === 'connect' && (
          <div className="fade-in">
            {/* Header */}
            <div style={{ marginBottom: 18 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                Connect your inbox
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>
                Choose your mail host and authenticate with standard protocol credentials.
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
                      background: isSelected ? 'var(--accent-subtle)' : 'var(--surface)',
                      border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                      color: isSelected ? 'var(--text)' : 'var(--muted)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'center'
                    }}
                    title={p.brandName || p.name}
                  >
                    <ProviderIcon provider={p.id} size={20} />
                    <span style={{ fontSize: 11, fontWeight: isSelected ? 700 : 600, lineHeight: 1.2 }}>
                      {p.shortName || p.name.split('/')[0].trim()}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* App Password Guide & Generator Panel */}
            <div style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border2)',
              borderRadius: 'var(--radius-sm)',
              padding: '14px 16px',
              marginBottom: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <KeyIcon size={14} style={{ color: 'var(--accent)' }} /> App Password Security
                </div>
                <button
                  type="button"
                  onClick={() => openAppPasswordModal('generator')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Generator &amp; Guide
                </button>
              </div>

              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 10 }}>
                Mail hosts require a standard 16-character App Password to synchronize over secure IMAP without sharing your account master password.
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleGenerateGooglePassword}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: 12, padding: '5px 12px' }}
                >
                  Generate Format
                </button>
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: 12, padding: '5px 12px' }}
                >
                  Google Console ↗
                </a>
                <button
                  type="button"
                  onClick={() => openAppPasswordModal('guide')}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: 12, padding: '5px 12px' }}
                >
                  Instructions
                </button>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleConnect} className="card" style={{ padding: 22 }}>
              {authError && (
                <div style={{
                  background: 'rgba(184, 76, 76, 0.1)', border: '1px solid var(--danger)',
                  borderRadius: 6, padding: '12px 14px', fontSize: 13, color: 'var(--text)', marginBottom: 16,
                  lineHeight: 1.5
                }}>
                  <div style={{ fontWeight: 600 }}>Authentication Failed</div>
                  <div style={{ marginTop: 2, color: 'var(--muted)' }}>{authError}</div>
                  {authHint && <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text)' }}>Note: {authHint}</div>}
                </div>
              )}

              {/* Email Address Field */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>
                    Email Address
                  </label>
                  {isSavedEmailFound && (
                    <span style={{ fontSize: 11, color: 'var(--success)', background: 'rgba(56, 142, 104, 0.12)', padding: '2px 8px', borderRadius: 4 }}>
                      Saved on this device
                    </span>
                  )}
                </div>
                <input
                  type="email"
                  required
                  className="input"
                  placeholder="e.g. you@example.com"
                  value={email}
                  onChange={e => handleEmailChange(e.target.value)}
                  autoComplete="email"
                />
              </div>

              {/* Password / App Password Field */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 4 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>
                    {isGoogle ? '16-Character App Password' : 'Password or App Password'}
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateGooglePassword}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    Auto-Generate Format
                  </button>
                </div>

                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="input"
                    placeholder="Enter or paste 16-character App Password"
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      setAuthError('');
                      setAuthHint('');
                    }}
                    style={{ paddingRight: 40, fontFamily: showPassword ? 'var(--font-mono)' : 'inherit' }}
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
                      fontSize: 12,
                      color: 'var(--muted)',
                      padding: '4px'
                    }}
                  >
                    {showPassword ? 'Hide' : 'Show'}
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
                  <><span className="spinner" style={{ width: 14, height: 14 }} /> Verifying Connection…</>
                ) : (
                  'Connect Mailbox'
                )}
              </button>
            </form>

            {/* Legal Links Footer */}
            <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--muted)' }}>
              <span>Protected by permission-first security. </span>
              <button
                type="button"
                onClick={() => { setLegalModalTab('terms'); setLegalModalOpen(true); }}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: 12 }}
              >
                Terms of Service
              </button>
              <span> &amp; </span>
              <button
                type="button"
                onClick={() => { setLegalModalTab('privacy'); setLegalModalOpen(true); }}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: 12 }}
              >
                Privacy Policy
              </button>
            </div>
          </div>
        )}

        {/* Step: Tone Workshop (Asymmetric interactive preview layout) */}
        {step === 'tone' && (
          <div className="fade-in">
            <div style={{ marginBottom: 8, fontSize: 13, color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckIcon size={14} /> Connected: <strong>{email}</strong>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
              Select your drafting tone
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: 13.5, marginBottom: 20 }}>
              MailMind personalizes response drafts using this voice profile. Every draft remains editable before sending.
            </p>

            {/* Asymmetric layout: Selector strip + live sample workbench */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {TONE_OPTIONS.map(t => {
                const isSelected = tone === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setTone(t.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 14,
                      padding: '14px 18px',
                      background: isSelected ? 'var(--surface)' : 'var(--surface2)',
                      border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--text)' }}>
                          {t.label}
                        </span>
                        <span className="badge" style={{ fontSize: 10, background: 'var(--surface2)' }}>
                          {t.badge}
                        </span>
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                        {t.tagline}
                      </div>
                    </div>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--muted2)'}`,
                      background: isSelected ? 'var(--accent)' : 'transparent',
                      color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2
                    }}>
                      {isSelected && <CheckIcon size={10} style={{ color: '#fff' }} />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Live Draft Demonstration Sandbox */}
            <div className="card" style={{ padding: 18, marginBottom: 24, background: 'var(--surface2)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.6px', marginBottom: 6 }}>
                Live Tone Demonstration Preview
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
                Scenario: Confirming a partner launch schedule
              </div>
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: 14,
                fontSize: 13.5,
                lineHeight: 1.6,
                color: 'var(--text)',
                fontStyle: 'normal'
              }}>
                &ldquo;{activeToneObj.sample}&rdquo;
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost btn-lg" style={{ flex: 1 }} onClick={() => setStep('connect')}>
                Back
              </button>
              <button className="btn btn-primary btn-lg" style={{ flex: 2 }} onClick={() => setStep('notifications')}>
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step: Notifications */}
        {step === 'notifications' && (
          <div className="fade-in">
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Notification preferences</h2>
            <p style={{ color: 'var(--muted)', fontSize: 13.5, marginBottom: 20 }}>
              Configure how alerts reach you when important emails and proposed replies arrive.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Device notifications', desc: 'Alerts dispatched to your desktop or device', val: deviceNotifications, set: handleToggleDevice },
                { label: 'Audio alert chime', desc: 'Subtle tone played on urgent message arrival', val: notifSound, set: setNotifSound },
                { label: 'In-app indicators', desc: 'Activity indicator in the MailMind shell', val: inApp, set: setInApp },
                { label: 'Daily summary digest', desc: 'Consolidated briefing of key email activity', val: digest, set: setDigest },
              ].map(item => (
                <div key={item.label} className="card" style={{ padding: '14px 18px' }}>
                  <div className="toggle-wrap">
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{item.desc}</div>
                    </div>
                    <div className={`toggle${item.val ? ' on' : ''}`} onClick={() => item.set(!item.val)} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost btn-lg" style={{ flex: 1 }} onClick={() => setStep('tone')}>
                Back
              </button>
              <button className="btn btn-primary btn-lg" style={{ flex: 2 }} onClick={() => setStep('done')}>
                Save Preferences
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
                size={68}
                isUser={true}
                style={{
                  border: '2px solid var(--border2)'
                }}
              />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
              Setup Complete
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: 13.5, marginBottom: 24, maxWidth: 380, margin: '0 auto 24px' }}>
              MailMind is now connected to your inbox, reading incoming messages, summarizing history, and drafting replies, always waiting for your approval before sending.
            </p>
            <div className="card" style={{ maxWidth: 380, margin: '0 auto 28px', textAlign: 'left', padding: 18 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)' }}>
                  <CheckIcon size={14} style={{ color: 'var(--success)' }} />
                  <span>{currentProviderObj.name} Account: <strong>{email}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)' }}>
                  <CheckIcon size={14} style={{ color: 'var(--success)' }} />
                  <span>Draft Voice Tone: <strong>{activeToneObj.label}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)' }}>
                  <CheckIcon size={14} style={{ color: 'var(--success)' }} />
                  <span>Permission-First: No automated dispatch without approval</span>
                </div>
              </div>
            </div>
            <button className="btn btn-primary btn-lg" style={{ width: '100%', maxWidth: 320, margin: '0 auto' }} onClick={handleDone}>
              Open Inbox
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

      {legalModalOpen && (
        <LegalModal
          isOpen={legalModalOpen}
          initialTab={legalModalTab}
          onClose={() => setLegalModalOpen(false)}
        />
      )}
    </div>
  );
}
