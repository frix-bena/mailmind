'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EmailAvatar from '@/components/EmailAvatar';
import ProviderIcon, { PROVIDER_LIST } from '@/components/ProviderIcon';
import AppPasswordModal from '@/components/AppPasswordModal';
import { extractDisplayName, isValidEmail } from '@/lib/avatar-utils';
import { addOrUpdateAccount, isExistingUser, getStoredAccounts } from '@/lib/account-manager';
import {
  generateAppPassword,
  generateSecurePassword,
  cleanAppPassword,
  calculatePasswordStrength,
  PROVIDER_GUIDES
} from '@/lib/app-password-generator';
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
  const [userMode, setUserMode] = useState('new'); // 'new' | 'existing'
  const [selectedProvider, setSelectedProvider] = useState('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [imapHost, setImapHost] = useState('');
  const [imapPort, setImapPort] = useState('993');
  const [connecting, setConnecting] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authHint, setAuthHint] = useState('');
  const [appPasswordModalOpen, setAppPasswordModalOpen] = useState(false);
  const [appPasswordModalTab, setAppPasswordModalTab] = useState('generator');
  const [showForgotDrawer, setShowForgotDrawer] = useState(false);
  const [inlineGeneratedPassword, setInlineGeneratedPassword] = useState('');
  const [copiedInline, setCopiedInline] = useState(false);
  const [isSavedEmailFound, setIsSavedEmailFound] = useState(false);

  const [tone, setTone] = useState('professional');
  const [inApp, setInApp] = useState(true);
  const [deviceNotifications, setDeviceNotifications] = useState(true);
  const [notifSound, setNotifSound] = useState(true);
  const [digest, setDigest] = useState(false);

  // Generate initial inline password for forgot-password helper
  useEffect(() => {
    handleRegenerateInline();
  }, [selectedProvider]);

  const handleRegenerateInline = () => {
    const fmt = selectedProvider === 'icloud' ? 'dashed' : 'spaced';
    const newPwd = generateAppPassword({ format: fmt, length: 16 });
    setInlineGeneratedPassword(newPwd);
    setCopiedInline(false);
  };

  const openAppPasswordModal = (tab = 'generator') => {
    setAppPasswordModalTab(tab);
    setAppPasswordModalOpen(true);
  };

  const handleToggleDevice = async (val) => {
    setDeviceNotifications(val);
    if (val && getDeviceNotificationPermission() === 'default') {
      await requestDeviceNotificationPermission();
    }
  };

  // Auto-detect provider and check if email is an existing user
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
      const exists = isExistingUser(clean);
      setIsSavedEmailFound(exists);
      if (exists && userMode === 'new') {
        // Optional hint or default
      }
    } else {
      setIsSavedEmailFound(false);
    }
  };

  const handleSuggestStrongPassword = () => {
    const strong = generateSecurePassword({ length: 16 });
    setPassword(strong);
    setConfirmPassword(strong);
    setShowPassword(true);
    setAuthError('');
  };

  const handleApplyGeneratedAndConnect = async (generated) => {
    const clean = cleanAppPassword(generated);
    if (!clean) return;
    setPassword(clean);
    setConfirmPassword(clean);
    setShowForgotDrawer(false);
    await executeConnection(clean);
  };

  const handleCopyInline = (text) => {
    if (!text) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedInline(true);
      setTimeout(() => setCopiedInline(false), 2500);
    }
  };

  const executeConnection = async (targetPassword) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      setAuthError('Please enter a valid email address (e.g. yourname@domain.com).');
      return;
    }

    const passToUse = targetPassword !== undefined ? targetPassword : password;
    if (passToUse == null || passToUse === '') {
      setAuthError(
        userMode === 'new'
          ? 'Please create a password for your account.'
          : 'Password is required. If you have forgotten your password, generate a new one below.'
      );
      return;
    }

    if (userMode === 'new' && confirmPassword && passToUse !== confirmPassword) {
      setAuthError('Passwords do not match. Please ensure both password fields match.');
      return;
    }

    setConnecting(true);
    setAuthError('');
    setAuthHint('');

    try {
      let res;
      const payload = JSON.stringify({
        email: cleanEmail,
        password: passToUse,
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
        if (data.hint) setAuthHint(data.hint);
        if (userMode === 'existing') {
          setShowForgotDrawer(true);
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
  const pwdStrength = calculatePasswordStrength(password);
  const passwordsMatch = confirmPassword && password === confirmPassword;

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
          <p style={{ color: 'var(--muted)', fontSize: 13.5, marginTop: 4 }}>
            {userMode === 'new' ? 'Create a password & connect your inbox' : 'Sign in to your account & monitor your inbox'}
          </p>
        </div>

        <ProgressBar step={step} />

        {/* Step: Connect / Login */}
        {step === 'connect' && (
          <div className="fade-in">
            {/* User Mode Segmented Toggle: New User vs Existing User */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 4,
              background: 'var(--surface2, #252538)',
              padding: 4,
              borderRadius: 12,
              marginBottom: 20,
              border: '1px solid var(--border)'
            }}>
              <button
                type="button"
                onClick={() => {
                  setUserMode('new');
                  setAuthError('');
                  setAuthHint('');
                  setShowForgotDrawer(false);
                }}
                style={{
                  padding: '10px 14px',
                  borderRadius: 9,
                  border: 'none',
                  fontSize: 13,
                  fontWeight: userMode === 'new' ? 700 : 500,
                  background: userMode === 'new' ? 'var(--accent)' : 'transparent',
                  color: userMode === 'new' ? '#fff' : 'var(--muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <span>🆕</span>
                <span>New User &bull; Create Password</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUserMode('existing');
                  setAuthError('');
                  setAuthHint('');
                }}
                style={{
                  padding: '10px 14px',
                  borderRadius: 9,
                  border: 'none',
                  fontSize: 13,
                  fontWeight: userMode === 'existing' ? 700 : 500,
                  background: userMode === 'existing' ? 'var(--accent)' : 'transparent',
                  color: userMode === 'existing' ? '#fff' : 'var(--muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <span>👤</span>
                <span>Existing User &bull; Sign In</span>
              </button>
            </div>

            {/* Context Header */}
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                {userMode === 'new' ? 'Create a password for your account' : 'Sign in with your email password'}
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>
                {userMode === 'new'
                  ? 'New user? Create a secure password or generate an App Password to connect your inbox.'
                  : 'Existing user? Enter your email password, or generate a new one if you have forgotten it.'}
              </p>
            </div>

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

            {/* Login / Setup Form */}
            <form onSubmit={handleConnect} className="card" style={{ padding: 24 }}>
              {authError && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.12)', border: '1px solid var(--danger)',
                  borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#fca5a5', marginBottom: 16,
                  lineHeight: 1.5
                }}>
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>⚠️</span> Authentication Issue
                  </div>
                  <div style={{ marginTop: 2 }}>{authError}</div>
                  {authHint && <div style={{ marginTop: 6, fontSize: 12, opacity: 0.95 }}>💡 {authHint}</div>}
                  <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text)' }}>Forgotten your password?</span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotDrawer(true);
                        setUserMode('existing');
                      }}
                      style={{
                        background: 'var(--danger)',
                        border: 'none',
                        color: '#fff',
                        fontSize: 11.5,
                        fontWeight: 600,
                        borderRadius: 6,
                        padding: '5px 12px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5
                      }}
                    >
                      <span>⚡</span> Generate a New Password Now →
                    </button>
                  </div>
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

              {/* ══════════════════ NEW USER: CREATE PASSWORD FLOW ══════════════════ */}
              {userMode === 'new' ? (
                <div>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 4 }}>
                      <label style={{ fontSize: 13, fontWeight: 600 }}>
                        Create Password <span style={{ color: 'var(--danger)' }}>*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleSuggestStrongPassword}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--accent)',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '2px 4px'
                        }}
                      >
                        <span>✨</span> Suggest Strong Password
                      </button>
                    </div>

                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="input"
                        placeholder="Create a secure password (min 8 chars)"
                        value={password}
                        onChange={e => {
                          setPassword(e.target.value);
                          setAuthError('');
                          setAuthHint('');
                        }}
                        style={{ paddingRight: 40, fontFamily: showPassword ? 'monospace' : 'inherit' }}
                        autoComplete="new-password"
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

                    {/* Interactive Password Strength Indicator */}
                    {password && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5, marginBottom: 4 }}>
                          <span style={{ color: 'var(--muted)' }}>Password Strength:</span>
                          <span style={{ fontWeight: 700, color: pwdStrength.color }}>
                            {pwdStrength.label}
                          </span>
                        </div>
                        <div style={{ width: '100%', height: 4, background: 'var(--surface2)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: pwdStrength.width,
                            background: pwdStrength.color,
                            transition: 'all 0.3s ease',
                            borderRadius: 2
                          }} />
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                          {pwdStrength.tips}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label style={{ fontSize: 13, fontWeight: 600 }}>
                        Confirm Password <span style={{ color: 'var(--danger)' }}>*</span>
                      </label>
                      {confirmPassword && (
                        <span style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: passwordsMatch ? '#22c55e' : '#ef4444'
                        }}>
                          {passwordsMatch ? '✓ Passwords match' : '⚠️ Passwords do not match'}
                        </span>
                      )}
                    </div>

                    <div style={{ position: 'relative' }}>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        className="input"
                        placeholder="Re-enter your password to confirm"
                        value={confirmPassword}
                        onChange={e => {
                          setConfirmPassword(e.target.value);
                          setAuthError('');
                        }}
                        style={{
                          paddingRight: 40,
                          border: confirmPassword ? (passwordsMatch ? '1px solid #22c55e' : '1px solid #ef4444') : undefined,
                          fontFamily: showConfirmPassword ? 'monospace' : 'inherit'
                        }}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  {/* Provider 2FA Tip */}
                  <div style={{
                    background: 'rgba(108, 99, 255, 0.08)',
                    border: '1px solid rgba(108, 99, 255, 0.2)',
                    borderRadius: 10,
                    padding: '10px 12px',
                    fontSize: 12,
                    color: 'var(--text)',
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 200 }}>
                      <ProviderIcon provider={selectedProvider} size={16} />
                      <span style={{ color: 'var(--muted)', fontSize: 11.5 }}>
                        Using {currentProviderObj.name} with 2FA? You can also create a 16-char App Password.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => openAppPasswordModal('create')}
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
                      App Password Assistant →
                    </button>
                  </div>
                </div>
              ) : (
                /* ══════════════════ EXISTING USER: SIGN IN & FORGOT PASSWORD FLOW ══════════════════ */
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 4 }}>
                      <label style={{ fontSize: 13, fontWeight: 600 }}>
                        Password <span style={{ color: 'var(--danger)' }}>*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowForgotDrawer(!showForgotDrawer)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '2px 4px'
                        }}
                      >
                        <span>🆘</span> Forgot password? Generate a new one
                      </button>
                    </div>

                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="input"
                        placeholder="Enter your email account or 16-character App Password"
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
                      <span>Enter your {currentProviderObj.name} password or 16-digit App Password.</span>
                      <button
                        type="button"
                        onClick={() => setShowForgotDrawer(true)}
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
                        Forgot password? Generate new
                      </button>
                    </div>
                  </div>

                  {/* 🆘 Dedicated Expandable Forgot Password Generator Drawer */}
                  {showForgotDrawer && (
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(245, 158, 11, 0.08))',
                      border: '1.5px solid rgba(239, 68, 68, 0.35)',
                      borderRadius: 14,
                      padding: '16px',
                      marginBottom: 18,
                      animation: 'fadeIn 0.2s ease-out'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>🆘</span> Forgot your password? Generate a new one:
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowForgotDrawer(false)}
                          style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 14, cursor: 'pointer', padding: 2 }}
                        >
                          ✕
                        </button>
                      </div>

                      <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 10, lineHeight: 1.4 }}>
                        Generate a fresh 16-character passcode right now to connect MailMind instantly without changing your master mailbox credentials:
                      </div>

                      {/* Live Generated Password Box */}
                      <div style={{
                        background: 'var(--surface, #181824)',
                        border: '1.5px dashed var(--accent)',
                        borderRadius: 10,
                        padding: '10px 14px',
                        fontFamily: 'monospace',
                        fontSize: 17,
                        fontWeight: 700,
                        letterSpacing: '1px',
                        color: 'var(--text)',
                        marginBottom: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        userSelect: 'all'
                      }}>
                        <span>{inlineGeneratedPassword}</span>
                        <span style={{ fontSize: 10.5, color: 'var(--accent)', fontWeight: 600, background: 'var(--surface2)', padding: '2px 8px', borderRadius: 8 }}>
                          New Password
                        </span>
                      </div>

                      {/* Quick Action Buttons */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                        <button
                          type="button"
                          onClick={() => handleApplyGeneratedAndConnect(inlineGeneratedPassword)}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: 11.5, padding: '6px 14px', borderRadius: 8, fontWeight: 700 }}
                        >
                          ⚡ Apply &amp; Connect Now →
                        </button>

                        <button
                          type="button"
                          onClick={handleRegenerateInline}
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: 11.5, padding: '6px 10px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <span>🔄</span> Generate Another
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyInline(cleanAppPassword(inlineGeneratedPassword))}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: 11.5, padding: '6px 10px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <span>{copiedInline ? '✅ Copied' : '📋 Copy'}</span>
                        </button>
                      </div>

                      {/* Official Recovery Link */}
                      {guide.recoveryUrl && (
                        <div style={{ borderTop: '1px solid rgba(239, 68, 68, 0.2)', paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                          <span style={{ fontSize: 11, color: 'var(--muted)' }}>Need to reset your main {guide.shortName} master password?</span>
                          <a
                            href={guide.recoveryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'underline', fontWeight: 600 }}
                          >
                            Open {guide.shortName} Account Recovery ↗
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

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
                disabled={connecting || !email || !password || (userMode === 'new' && confirmPassword && !passwordsMatch)}
              >
                {connecting ? (
                  <><span className="spinner" style={{ width: 16, height: 16 }} /> Verifying & Connecting…</>
                ) : userMode === 'new' ? (
                  'Create Password & Connect Inbox →'
                ) : (
                  'Log in & Connect Inbox →'
                )}
              </button>

              {/* Switch User Mode Link */}
              <div style={{ textAlign: 'center', marginTop: 14 }}>
                {userMode === 'new' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setUserMode('existing');
                      setAuthError('');
                      setAuthHint('');
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 12.5, cursor: 'pointer' }}
                  >
                    Already have an account? <span style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'underline' }}>Sign in with existing password</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setUserMode('new');
                      setAuthError('');
                      setAuthHint('');
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 12.5, cursor: 'pointer' }}
                  >
                    New user? <span style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'underline' }}>Create a new account &amp; password</span>
                  </button>
                )}
              </div>
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
