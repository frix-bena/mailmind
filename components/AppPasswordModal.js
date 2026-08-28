'use client';

import React, { useState, useEffect } from 'react';
import ProviderIcon, { PROVIDER_LIST, getProviderInfo } from '@/components/ProviderIcon';
import {
  generateAppPassword,
  generateSecurePassword,
  cleanAppPassword,
  formatAppPassword,
  calculatePasswordStrength,
  PROVIDER_GUIDES,
  getProviderAppPasswordGuide
} from '@/lib/app-password-generator';

export default function AppPasswordModal({
  isOpen = true,
  onClose,
  initialProvider = 'google',
  userEmail = '',
  onSelectPassword,
  initialTab = 'generator' // 'generator' | 'forgot' | 'create' | 'guide' | 'faq'
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedProvider, setSelectedProvider] = useState(initialProvider || 'google');
  const [formatType, setFormatType] = useState('spaced'); // 'spaced' | 'dashed' | 'alphanumeric' | 'token'
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [pastedPassword, setPastedPassword] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [showCustomPassword, setShowCustomPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [appliedMsg, setAppliedMsg] = useState('');

  // Update selected provider and active tab if props change
  useEffect(() => {
    if (initialProvider) {
      setSelectedProvider(initialProvider);
    }
  }, [initialProvider]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Generate an initial password on mount or when format changes
  useEffect(() => {
    handleRegenerate();
  }, [formatType, selectedProvider]);

  const handleRegenerate = () => {
    let fmt = formatType;
    if (selectedProvider === 'icloud' && formatType === 'spaced') {
      fmt = 'dashed';
    }
    const newPwd = generateAppPassword({
      format: fmt,
      length: 16
    });
    setGeneratedPassword(newPwd);
    setCopied(false);
  };

  const handleCopy = (textToCopy) => {
    if (!textToCopy) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleApply = (pwd) => {
    const clean = cleanAppPassword(pwd);
    if (!clean) return;
    if (onSelectPassword) {
      onSelectPassword(clean);
      setAppliedMsg('New password applied to login form!');
      setTimeout(() => {
        setAppliedMsg('');
        if (onClose) onClose();
      }, 700);
    }
  };

  const guide = PROVIDER_GUIDES[selectedProvider] || PROVIDER_GUIDES.google;
  const currentProviderInfo = getProviderInfo(selectedProvider);
  const pwdStrength = calculatePasswordStrength(generatedPassword);
  const customPwdStrength = calculatePasswordStrength(customPassword);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose && onClose()}
      style={{
        zIndex: 1100,
        backdropFilter: 'blur(6px)',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        animation: 'fadeIn 0.15s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        className="modal app-password-modal"
        style={{
          maxWidth: 560,
          width: '100%',
          padding: 0,
          borderRadius: 24,
          background: 'var(--surface, #1e1e2d)',
          border: '1px solid var(--border2, #2f2f44)',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
          animation: 'scaleUp 0.18s ease-out',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 22px 14px',
          borderBottom: '1px solid var(--border, #2a2a3c)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: activeTab === 'forgot'
                ? 'linear-gradient(135deg, #ef4444, #f59e0b)'
                : activeTab === 'create'
                  ? 'linear-gradient(135deg, #10b981, #06b6d4)'
                  : 'linear-gradient(135deg, var(--accent, #6c63ff), #a78bfa)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 17,
              boxShadow: '0 2px 8px rgba(108, 99, 255, 0.3)'
            }}>
              {activeTab === 'forgot' ? '🆘' : activeTab === 'create' ? '🆕' : '🔑'}
            </span>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                {activeTab === 'forgot'
                  ? 'Forgot Password & Generate New One'
                  : activeTab === 'create'
                    ? 'Create New Password & Check Strength'
                    : 'App Password Generator & Assistant'}
              </h2>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
                {activeTab === 'forgot' 
                  ? 'Generate a fresh new password or recover your email credentials'
                  : activeTab === 'create'
                    ? 'Craft a strong password or generate a high-entropy passphrase'
                    : 'Create or fetch 16-character passwords for 2FA-secured inboxes'}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              fontSize: 18,
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '50%',
              lineHeight: 1
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Tabs Navigation */}
        <div style={{
          display: 'flex',
          padding: '8px 16px 0',
          borderBottom: '1px solid var(--border)',
          gap: 4,
          background: 'rgba(0,0,0,0.1)',
          overflowX: 'auto'
        }}>
          {[
            { id: 'generator', label: '⚡ Instant Generator', icon: '⚡' },
            { id: 'forgot', label: '🆘 Forgot Password?', icon: '🆘' },
            { id: 'create', label: '🆕 Create Password', icon: '🆕' },
            { id: 'guide', label: '📖 Step-by-Step Guide', icon: '📖' },
            { id: 'faq', label: '🛡️ Security & FAQ', icon: '🛡️' }
          ].map((tab) => {
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '9px 12px',
                  fontSize: 12,
                  fontWeight: isTabActive ? 700 : 500,
                  border: 'none',
                  background: 'none',
                  color: isTabActive ? 'var(--accent)' : 'var(--muted)',
                  borderBottom: isTabActive ? '2px solid var(--accent)' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  whiteSpace: 'nowrap'
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Modal Content */}
        <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1 }}>

          {appliedMsg && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid var(--success)',
              color: '#86efac',
              fontSize: 13,
              padding: '9px 14px',
              borderRadius: 12,
              marginBottom: 16,
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}>
              <span>✅</span> {appliedMsg}
            </div>
          )}

          {/* Provider Pills Bar (Shared across tabs) */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              Select Email Provider:
            </label>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
              {PROVIDER_LIST.map((p) => {
                const isSelected = selectedProvider === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedProvider(p.id);
                    }}
                    style={{
                      flex: 1,
                      minWidth: 72,
                      padding: '8px 6px',
                      fontSize: 11,
                      fontWeight: isSelected ? 700 : 600,
                      borderRadius: 10,
                      border: `1.5px solid ${isSelected ? (p.color || 'var(--accent)') : 'var(--border)'}`,
                      background: isSelected ? 'var(--accent-glow)' : 'var(--surface2)',
                      color: isSelected ? 'var(--text)' : 'var(--muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      transition: 'all 0.15s ease',
                      textAlign: 'center'
                    }}
                  >
                    <ProviderIcon provider={p.id} size={18} />
                    <span style={{ whiteSpace: 'nowrap' }}>{p.shortName || p.name.split('/')[0].trim()}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ══════════════════ TAB: INSTANT GENERATOR ══════════════════ */}
          {activeTab === 'generator' && (
            <div className="fade-in">
              <div style={{
                background: 'var(--surface2, #252538)',
                borderRadius: 16,
                padding: '20px 18px',
                border: '1px solid var(--border)',
                marginBottom: 18,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Generated 16-Character Password ({guide.shortName || 'Standard'} Format):</span>
                  <span style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: pwdStrength.color,
                    background: 'var(--surface)',
                    padding: '2px 8px',
                    borderRadius: 12,
                    border: '1px solid var(--border)'
                  }}>
                    🛡️ {pwdStrength.label} Entropy
                  </span>
                </div>

                {/* Password Display Box */}
                <div style={{
                  background: 'var(--surface, #181824)',
                  border: '1.5px dashed var(--accent)',
                  borderRadius: 12,
                  padding: '14px 16px',
                  fontFamily: 'monospace',
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: '2px',
                  color: 'var(--text)',
                  marginBottom: 14,
                  userSelect: 'all',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  wordBreak: 'break-all'
                }}>
                  <span>{generatedPassword}</span>
                </div>

                {/* Quick Action Buttons */}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleCopy(cleanAppPassword(generatedPassword))}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: 12, padding: '7px 14px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <span>{copied ? '✅' : '📋'}</span>
                    <span>{copied ? 'Copied to Clipboard!' : 'Copy Password'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRegenerate}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: 12, padding: '7px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 5 }}
                    title="Generate a different random password"
                  >
                    <span>🔄</span>
                    <span>Generate New One</span>
                  </button>

                  {onSelectPassword && (
                    <button
                      type="button"
                      onClick={() => handleApply(generatedPassword)}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: 12, padding: '7px 16px', borderRadius: 8, fontWeight: 700 }}
                    >
                      Use in Login Form →
                    </button>
                  )}
                </div>
              </div>

              {/* Format Options */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>
                  Password Formatting Style:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {[
                    { id: 'spaced', label: '4x4 Spaced', example: 'abcd efgh ijkl mnop' },
                    { id: 'dashed', label: '4x4 Dashed', example: 'abcd-efgh-ijkl-mnop' },
                    { id: 'alphanumeric', label: 'Alphanumeric', example: 'k9Nm-2PxL-8VbQ-4WtZ' }
                  ].map((fmt) => {
                    const isFmtActive = formatType === fmt.id;
                    return (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setFormatType(fmt.id)}
                        style={{
                          padding: '7px 8px',
                          fontSize: 11,
                          fontWeight: isFmtActive ? 700 : 500,
                          borderRadius: 8,
                          border: `1px solid ${isFmtActive ? 'var(--accent)' : 'var(--border)'}`,
                          background: isFmtActive ? 'var(--accent-glow)' : 'var(--surface2)',
                          color: isFmtActive ? 'var(--text)' : 'var(--muted)',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>{fmt.label}</div>
                        <div style={{ fontSize: 9.5, opacity: 0.7, fontFamily: 'monospace', marginTop: 2 }}>{fmt.example.slice(0, 14)}…</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Forgot Password Helper Banner */}
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 12,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                flexWrap: 'wrap',
                marginBottom: 12
              }}>
                <div style={{ fontSize: 12, color: 'var(--text)', flex: 1, minWidth: 200 }}>
                  <strong>Forgot your account password?</strong>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    Generate an App Password above or view official {guide.shortName} recovery options.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('forgot')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: 11.5, padding: '5px 12px', borderRadius: 8, whiteSpace: 'nowrap' }}
                >
                  <span>🆘 Recovery Guide</span>
                </button>
              </div>

              {/* Direct Provider Quick-Link Callout */}
              {guide.appPasswordUrl && (
                <div style={{
                  background: 'rgba(108, 99, 255, 0.08)',
                  border: '1px solid rgba(108, 99, 255, 0.25)',
                  borderRadius: 12,
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  flexWrap: 'wrap'
                }}>
                  <div style={{ fontSize: 12, color: 'var(--text)', flex: 1, minWidth: 200 }}>
                    <strong>Need an official {guide.name} App Password?</strong>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                      Generate directly inside your {guide.shortName} Security Console with 1 click.
                    </div>
                  </div>
                  <a
                    href={guide.appPasswordUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: 11.5, padding: '5px 12px', borderRadius: 8, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}
                  >
                    <span>Open {guide.shortName} Console</span>
                    <span>↗</span>
                  </a>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════ TAB: FORGOT PASSWORD & RECOVERY ══════════════════ */}
          {activeTab === 'forgot' && (
            <div className="fade-in">
              <div style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(245, 158, 11, 0.08))',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 14,
                padding: '14px 16px',
                marginBottom: 16
              }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span>🆘</span> Forgot your password for {guide.name}?
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
                  {guide.forgotPasswordTips || 'You can instantly generate a brand new 16-character App Password to connect MailMind without needing to change your main master email password.'}
                </div>
              </div>

              {/* Option 1: Instant Generator for New Password (Recommended) */}
              <div style={{
                background: 'var(--surface2)',
                borderRadius: 14,
                padding: '16px',
                border: '1.5px solid var(--accent)',
                marginBottom: 14
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="badge badge-low" style={{ fontSize: 10 }}>Recommended</span>
                    <span>Option 1: Generate a New 16-Char App Password</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}
                  >
                    🔄 Generate Another
                  </button>
                </div>

                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10, lineHeight: 1.4 }}>
                  Instead of changing your email password, use a dedicated 16-character passcode for MailMind:
                </div>

                {/* Instant Generated Code Box */}
                <div style={{
                  background: 'var(--surface)',
                  border: '1.5px dashed var(--accent)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontFamily: 'monospace',
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: '1px',
                  color: 'var(--text)',
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  userSelect: 'all'
                }}>
                  <span>{generatedPassword}</span>
                  <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>New Password</span>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleCopy(cleanAppPassword(generatedPassword))}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 5 }}
                  >
                    <span>{copied ? '✅' : '📋'}</span>
                    <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                  </button>

                  {onSelectPassword && (
                    <button
                      type="button"
                      onClick={() => handleApply(generatedPassword)}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, fontWeight: 700 }}
                    >
                      Apply New Password to Form →
                    </button>
                  )}
                </div>
              </div>

              {/* Option 2: Official Provider Password Reset / Recovery Link */}
              <div style={{
                background: 'var(--surface2)',
                borderRadius: 14,
                padding: '16px',
                border: '1px solid var(--border)',
                marginBottom: 14
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
                  Option 2: Reset your {guide.name} Master Password
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12, lineHeight: 1.4 }}>
                  If you need to recover or change your main email account login credentials:
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {guide.recoveryUrl && (
                    <a
                      href={guide.recoveryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: 12, padding: '7px 14px', borderRadius: 8, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <span>🔄 Open {guide.shortName} Password Recovery</span>
                      <span>↗</span>
                    </a>
                  )}

                  {guide.appPasswordUrl && (
                    <a
                      href={guide.appPasswordUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: 12, padding: '7px 12px', borderRadius: 8, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                    >
                      <span>🔑 {guide.shortName} App Passwords Page</span>
                      <span>↗</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Quick Paste Form */}
              <div style={{
                background: 'var(--surface2)',
                borderRadius: 12,
                padding: 14,
                border: '1px solid var(--border)'
              }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                  Have your new password or code ready? Paste it here:
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    placeholder={`e.g. ${guide.formatExample || 'abcd efgh ijkl mnop'}`}
                    value={pastedPassword}
                    onChange={(e) => setPastedPassword(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      padding: '8px 12px',
                      color: 'var(--text)',
                      fontSize: 13,
                      fontFamily: 'monospace'
                    }}
                  />
                  {onSelectPassword && (
                    <button
                      type="button"
                      disabled={!pastedPassword.trim()}
                      onClick={() => handleApply(pastedPassword)}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: 12, padding: '7px 14px', borderRadius: 8, whiteSpace: 'nowrap' }}
                    >
                      Apply to Form
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════ TAB: CREATE PASSWORD (NEW USER) ══════════════════ */}
          {activeTab === 'create' && (
            <div className="fade-in">
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 182, 212, 0.08))',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 14,
                padding: '14px 16px',
                marginBottom: 16
              }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span>🆕</span> New User &bull; Create a Secure Password
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
                  Set up your email credentials with a secure password or generate a random high-entropy password for maximum mailbox safety.
                </div>
              </div>

              {/* Password Creation Form Card */}
              <div style={{
                background: 'var(--surface2)',
                borderRadius: 14,
                padding: '18px',
                border: '1px solid var(--border)',
                marginBottom: 16
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>
                    Type or Create Your Password:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const suggested = generateSecurePassword({ length: 16 });
                      setCustomPassword(suggested);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <span>✨</span> Auto-Generate Strong Password
                  </button>
                </div>

                <div style={{ position: 'relative', marginBottom: 12 }}>
                  <input
                    type={showCustomPassword ? 'text' : 'password'}
                    placeholder="Enter or generate a new password"
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--surface)',
                      border: `1.5px solid ${customPassword ? customPwdStrength.color : 'var(--border)'}`,
                      borderRadius: 10,
                      padding: '10px 42px 10px 14px',
                      color: 'var(--text)',
                      fontSize: 14,
                      fontFamily: showCustomPassword ? 'monospace' : 'inherit',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCustomPassword(!showCustomPassword)}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 15,
                      padding: '4px 6px',
                      color: 'var(--muted)'
                    }}
                    title={showCustomPassword ? 'Hide password' : 'Show password'}
                  >
                    {showCustomPassword ? '🙈' : '👁️'}
                  </button>
                </div>

                {/* Strength Meter Bar */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, fontSize: 11.5 }}>
                    <span style={{ color: 'var(--muted)' }}>Password Strength:</span>
                    <span style={{ fontWeight: 700, color: customPwdStrength.color }}>
                      {customPwdStrength.label}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 5, background: 'var(--surface)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: customPwdStrength.width,
                      background: customPwdStrength.color,
                      transition: 'all 0.3s ease',
                      borderRadius: 3
                    }} />
                  </div>
                </div>

                {/* Requirements Checklist */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 6,
                  padding: '10px 12px',
                  background: 'var(--surface)',
                  borderRadius: 10,
                  fontSize: 11.5,
                  marginBottom: 16
                }}>
                  <div style={{ color: customPwdStrength.hasLength ? '#22c55e' : 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{customPwdStrength.hasLength ? '✓' : '○'}</span> At least 8 characters
                  </div>
                  <div style={{ color: customPwdStrength.hasUpper ? '#22c55e' : 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{customPwdStrength.hasUpper ? '✓' : '○'}</span> Uppercase letter (A-Z)
                  </div>
                  <div style={{ color: customPwdStrength.hasLower ? '#22c55e' : 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{customPwdStrength.hasLower ? '✓' : '○'}</span> Lowercase letter (a-z)
                  </div>
                  <div style={{ color: (customPwdStrength.hasNumber || customPwdStrength.hasSpecial) ? '#22c55e' : 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{(customPwdStrength.hasNumber || customPwdStrength.hasSpecial) ? '✓' : '○'}</span> Number or symbol
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {onSelectPassword && (
                    <button
                      type="button"
                      disabled={!customPassword.trim()}
                      onClick={() => handleApply(customPassword)}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: 12.5, padding: '8px 18px', borderRadius: 8, fontWeight: 700, flex: 1 }}
                    >
                      Apply Password to Login Form →
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={!customPassword.trim()}
                    onClick={() => handleCopy(customPassword)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: 12, padding: '8px 14px', borderRadius: 8 }}
                  >
                    <span>{copied ? '✅ Copied' : '📋 Copy'}</span>
                  </button>
                </div>
              </div>

              {/* 2FA Provider Tip */}
              <div style={{
                background: 'rgba(108, 99, 255, 0.08)',
                border: '1px solid rgba(108, 99, 255, 0.25)',
                borderRadius: 12,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                flexWrap: 'wrap'
              }}>
                <div style={{ fontSize: 12, color: 'var(--text)', flex: 1, minWidth: 200 }}>
                  <strong>Using Gmail or Outlook 2-Step Verification?</strong>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    You can also create a dedicated 16-character App Password.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('generator')}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: 11.5, padding: '5px 12px', borderRadius: 8, whiteSpace: 'nowrap' }}
                >
                  ⚡ App Password Generator →
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════ TAB: STEP-BY-STEP GUIDE ══════════════════ */}
          {activeTab === 'guide' && (
            <div className="fade-in">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ProviderIcon provider={selectedProvider} size={22} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                    How to generate App Password for {guide.name}
                  </span>
                </div>

                {guide.appPasswordUrl && (
                  <a
                    href={guide.appPasswordUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: 11.5, padding: '5px 12px', borderRadius: 8, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                  >
                    <span>Open {guide.shortName} Page</span>
                    <span>↗</span>
                  </a>
                )}
              </div>

              {/* Numbered Steps */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
                {guide.steps.map((s) => (
                  <div
                    key={s.step}
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: '12px 14px',
                      background: 'var(--surface2)',
                      borderRadius: 12,
                      border: '1px solid var(--border)'
                    }}
                  >
                    <div style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: 'var(--accent-glow)',
                      border: '1px solid var(--accent)',
                      color: 'var(--accent)',
                      fontWeight: 700,
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {s.step}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                        {s.title}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, lineHeight: 1.4 }}>
                        {s.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tip box */}
              {guide.tips && (
                <div style={{
                  background: 'rgba(251, 191, 36, 0.1)',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontSize: 11.5,
                  color: '#fbbf24',
                  marginBottom: 16,
                  lineHeight: 1.4
                }}>
                  💡 <strong>Pro Tip:</strong> {guide.tips}
                </div>
              )}

              {/* Quick Paste & Apply Box */}
              <div style={{
                background: 'var(--surface2)',
                borderRadius: 12,
                padding: 14,
                border: '1px solid var(--border)'
              }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                  Paste the App Password you generated from {guide.shortName}:
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    placeholder={`e.g. ${guide.formatExample || 'abcd efgh ijkl mnop'}`}
                    value={pastedPassword}
                    onChange={(e) => setPastedPassword(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      padding: '8px 12px',
                      color: 'var(--text)',
                      fontSize: 13,
                      fontFamily: 'monospace'
                    }}
                  />
                  {onSelectPassword && (
                    <button
                      type="button"
                      disabled={!pastedPassword.trim()}
                      onClick={() => handleApply(pastedPassword)}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: 12, padding: '7px 14px', borderRadius: 8, whiteSpace: 'nowrap' }}
                    >
                      Apply to Form
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════ TAB: SECURITY & FAQ ══════════════════ */}
          {activeTab === 'faq' && (
            <div className="fade-in">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{
                  background: 'var(--surface2)',
                  borderRadius: 12,
                  padding: '14px 16px',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                    ❓ What is an App Password?
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
                    An App Password is a 16-digit passcode that gives an application (like MailMind) permission to access your mailbox securely via IMAP and SMTP without revealing your actual main account password.
                  </div>
                </div>

                <div style={{
                  background: 'var(--surface2)',
                  borderRadius: 12,
                  padding: '14px 16px',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                    🆘 What if I forgot my main email password?
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
                    You don't need to panic! You can generate a dedicated 16-character App Password using the Instant Generator or via your email provider's security console. This connects MailMind immediately without needing to remember or reset your master account password.
                  </div>
                </div>

                <div style={{
                  background: 'var(--surface2)',
                  borderRadius: 12,
                  padding: '14px 16px',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                    🔒 Why do Google, Outlook, Yahoo &amp; Apple require them?
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
                    When 2-Factor Authentication (2FA) is turned on, standard mail clients cannot prompt for a 2FA push notification during automated IMAP synchronization. App Passwords bridge this securely by acting as a dedicated, revocable credential.
                  </div>
                </div>

                <div style={{
                  background: 'var(--surface2)',
                  borderRadius: 12,
                  padding: '14px 16px',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                    🛡️ Can I revoke or delete an App Password?
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
                    Yes, at any time! You can visit your provider's security console (Google, Apple, Microsoft, Yahoo) and click <strong>Revoke</strong> or delete the "MailMind" password. MailMind will immediately lose access without affecting your main account.
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '12px 20px',
          background: 'rgba(0, 0, 0, 0.15)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
            🔒 Safe &amp; 100% Encrypted IMAP/SMTP
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 12, padding: '5px 12px' }}
            >
              Close
            </button>

            {onSelectPassword && (
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'create' && customPassword.trim()) {
                    handleApply(customPassword);
                  } else {
                    handleApply(generatedPassword);
                  }
                }}
                className="btn btn-primary btn-sm"
                style={{ fontSize: 12, padding: '5px 14px', borderRadius: 8 }}
              >
                {activeTab === 'create' && customPassword.trim() ? 'Use Created Password' : 'Use Generated Password'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

