'use client';

import React, { useState, useEffect } from 'react';
import ProviderIcon, { PROVIDER_LIST, getProviderInfo } from '@/components/ProviderIcon';
import {
  KeyIcon,
  CheckIcon,
  CloseIcon,
  CopyIcon,
  RefreshIcon,
  ShieldCheckIcon,
  DocumentIcon
} from '@/components/Icons';
import {
  generateAppPassword,
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
  initialTab = 'generator' // 'generator' | 'guide' | 'paste' | 'faq' | 'recovery'
}) {
  const [activeTab, setActiveTab] = useState(initialTab || 'generator');
  const [selectedProvider, setSelectedProvider] = useState(initialProvider || 'google');
  const [formatType, setFormatType] = useState('spaced'); // 'spaced' | 'dashed' | 'alphanumeric'
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [pastedPassword, setPastedPassword] = useState('');
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

  useEffect(() => {
    handleRegenerate();
  }, [formatType, selectedProvider]);

  const handleCopy = (textToCopy) => {
    if (!textToCopy) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleApply = (pwd) => {
    const clean = cleanAppPassword(pwd || pastedPassword);
    if (!clean) return;
    if (onSelectPassword) {
      onSelectPassword(clean);
      setAppliedMsg('App Password applied to login form!');
      setTimeout(() => {
        setAppliedMsg('');
        if (onClose) onClose();
      }, 700);
    }
  };

  const guide = PROVIDER_GUIDES[selectedProvider] || PROVIDER_GUIDES.google;
  const currentProviderInfo = getProviderInfo(selectedProvider);

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
          maxWidth: 580,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)'
            }}>
              <KeyIcon size={18} />
            </span>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                {activeTab === 'generator'
                  ? 'App Password Generator'
                  : `${guide.name} App Password Setup Guide`}
              </h2>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
                {userEmail
                  ? `Target Account: ${userEmail} · Generate standard 16-character App Passwords`
                  : 'Generate a 16-character App Password for any email account'}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="btn btn-ghost btn-sm"
            style={{ padding: '4px 8px' }}
          >
            <CloseIcon size={14} />
          </button>
        </div>

        {/* Modal Tabs Navigation */}
        <div style={{
          display: 'flex',
          padding: '8px 16px 0',
          borderBottom: '1px solid var(--border)',
          gap: 4,
          background: 'var(--surface2)',
          overflowX: 'auto'
        }}>
          {[
            { id: 'generator', label: 'Generate Password' },
            { id: 'guide', label: 'Step-by-Step Guide' },
            { id: 'paste', label: 'Paste and Apply' },
            { id: 'faq', label: 'Security & 2FA FAQ' },
            { id: 'recovery', label: 'Account Recovery' }
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
                  fontWeight: isTabActive ? 600 : 500,
                  border: 'none',
                  background: 'none',
                  color: isTabActive ? 'var(--accent)' : 'var(--muted)',
                  borderBottom: isTabActive ? '2px solid var(--accent)' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Scrollable Modal Content */}
        <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1 }}>

          {appliedMsg && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid var(--success, #22c55e)',
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
              <CheckIcon size={14} style={{ color: 'var(--success, #22c55e)' }} />
              <span>{appliedMsg}</span>
            </div>
          )}

          {/* Provider Selector Pills Bar */}
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
                    onClick={() => setSelectedProvider(p.id)}
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
                    <span style={{ whiteSpace: 'nowrap' }}>{p.shortName || p.name.split("/")[0].trim()}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ══════════════════ TAB: GENERATE APP PASSWORD (UNRESTRICTED) ══════════════════ */}
          {activeTab === 'generator' && (
            <div className="fade-in">
              {/* Unrestricted email callout */}
              <div style={{
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: '14px 16px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap'
              }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <KeyIcon size={14} style={{ color: 'var(--accent)' }} /> Universal 16-Character App Password Generator
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>
                    No email is restricted. You can generate a standard 16-character Google-compatible App Password for <strong>any email address</strong> (Gmail, Google Workspace, custom domains, or any mail host).
                  </div>
                </div>
                {userEmail && (
                  <div style={{
                    padding: '4px 10px',
                    borderRadius: 8,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: 'var(--text)',
                    whiteSpace: 'nowrap'
                  }}>
                    {userEmail}
                  </div>
                )}
              </div>

              {/* Password Generator Card */}
              <div style={{
                background: 'var(--surface2, #252538)',
                borderRadius: 16,
                padding: '20px 18px',
                border: '1px solid var(--border)',
                marginBottom: 18,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Generated 16-Character Password ({formatType === 'spaced' ? 'Google Standard' : formatType === 'dashed' ? 'Apple Style' : 'Alphanumeric'}):</span>
                  <span style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: calculatePasswordStrength(generatedPassword).color,
                    background: 'var(--surface)',
                    padding: '2px 8px',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    <ShieldCheckIcon size={11} /> {calculatePasswordStrength(generatedPassword).label} Entropy
                  </span>
                </div>

                {/* Password Display Box */}
                <div style={{
                  background: 'var(--surface, #181824)',
                  border: '1.5px dashed var(--accent)',
                  borderRadius: 12,
                  padding: '14px 16px',
                  fontFamily: 'monospace',
                  fontSize: 21,
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
                    {copied ? <CheckIcon size={13} style={{ color: 'var(--success, #22c55e)' }} /> : <CopyIcon size={13} />}
                    <span>{copied ? 'Copied to Clipboard' : 'Copy Password'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRegenerate}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: 12, padding: '7px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 5 }}
                    title="Generate another 16-character password"
                  >
                    <RefreshIcon size={13} />
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
                    { id: 'spaced', label: '4x4 Spaced (Google / Yahoo)', example: 'abcd efgh ijkl mnop' },
                    { id: 'dashed', label: '4x4 Dashed (Apple iCloud)', example: 'abcd-efgh-ijkl-mnop' },
                    { id: 'alphanumeric', label: 'Alphanumeric (Microsoft)', example: 'k9Nm-2PxL-8VbQ-4WtZ' }
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

              {/* Official Google Console Option */}
              <div style={{
                background: 'rgba(66, 133, 244, 0.08)',
                border: '1px solid rgba(66, 133, 244, 0.25)',
                borderRadius: 12,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                flexWrap: 'wrap'
              }}>
                <div style={{ fontSize: 12, color: 'var(--text)' }}>
                  Need to generate directly inside your Google Security Console instead?
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: 11.5, padding: '5px 12px', borderRadius: 8, textDecoration: 'none' }}
                  >
                    Open Google App Passwords ↗
                  </a>
                  <button
                    type="button"
                    onClick={() => setActiveTab('guide')}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: 11.5, padding: '5px 10px', borderRadius: 8 }}
                  >
                    Step Guide →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════ TAB: STEP-BY-STEP MANUAL GUIDE ══════════════════ */}
          {activeTab === 'guide' && (
            <div className="fade-in">
              {/* Direct Provider Action Banner */}
              <div style={{
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: '16px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap'
              }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <KeyIcon size={15} style={{ color: 'var(--accent)' }} /> Generate Password Manually on {guide.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>
                    Google and major email providers require a dedicated 16-character App Password for IMAP access when 2-Step Verification is enabled.
                  </div>
                </div>

                {guide.appPasswordUrl && (
                  <a
                    href={guide.appPasswordUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{
                      fontSize: 12.5,
                      padding: '8px 16px',
                      borderRadius: 9,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontWeight: 700,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <span>Open {guide.shortName} App Passwords Page</span>
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

              {/* Tip Box */}
              {guide.tips && (
                <div style={{
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontSize: 11.5,
                  color: 'var(--muted)',
                  marginBottom: 16,
                  lineHeight: 1.4
                }}>
                  <strong style={{ color: 'var(--text)' }}>Note:</strong> {guide.tips}
                </div>
              )}

              {/* Quick Paste & Apply Box */}
              <div style={{
                background: 'var(--surface2)',
                borderRadius: 14,
                padding: '16px',
                border: '1.5px solid var(--accent)'
              }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
                  Paste the 16-character code generated from {guide.shortName}:
                </label>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 10 }}>
                  (Spaces like <code style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>abcd efgh ijkl mnop</code> are accepted and normalized automatically)
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder={`e.g. ${guide.formatExample || 'abcd efgh ijkl mnop'}`}
                    value={pastedPassword}
                    onChange={(e) => setPastedPassword(e.target.value)}
                    style={{
                      flex: 1,
                      minWidth: 200,
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      padding: '9px 12px',
                      color: 'var(--text)',
                      fontSize: 14,
                      fontFamily: 'monospace'
                    }}
                  />
                  {onSelectPassword && (
                    <button
                      type="button"
                      disabled={!pastedPassword.trim()}
                      onClick={() => handleApply(pastedPassword)}
                      className="btn btn-primary"
                      style={{ fontSize: 12.5, padding: '9px 16px', borderRadius: 8, fontWeight: 700, whiteSpace: 'nowrap' }}
                    >
                      Apply to Login Form →
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════ TAB: PASTE & APPLY ══════════════════ */}
          {activeTab === 'paste' && (
            <div className="fade-in">
              <div style={{
                background: 'var(--surface2)',
                borderRadius: 14,
                padding: '18px',
                border: '1px solid var(--border)',
                marginBottom: 16
              }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <DocumentIcon size={14} style={{ color: 'var(--accent)' }} /> Enter Generated App Password
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.4 }}>
                  Paste the password code generated from your {guide.name} security settings page:
                </div>

                <div style={{ marginBottom: 14 }}>
                  <input
                    type="text"
                    placeholder={`Paste 16-character code (e.g. ${guide.formatExample || 'abcd efgh ijkl mnop'})`}
                    value={pastedPassword}
                    onChange={(e) => setPastedPassword(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--surface)',
                      border: '1.5px solid var(--border)',
                      borderRadius: 10,
                      padding: '12px 14px',
                      color: 'var(--text)',
                      fontSize: 15,
                      fontFamily: 'monospace',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {pastedPassword.trim() && (
                  <div style={{
                    background: 'var(--surface)',
                    padding: '10px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    marginBottom: 14,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ color: 'var(--muted)' }}>Clean normalized code:</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#22c55e' }}>
                      {cleanAppPassword(pastedPassword)}
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {onSelectPassword && (
                    <button
                      type="button"
                      disabled={!pastedPassword.trim()}
                      onClick={() => handleApply(pastedPassword)}
                      className="btn btn-primary"
                      style={{ fontSize: 13, padding: '10px 20px', borderRadius: 8, fontWeight: 700, flex: 1 }}
                    >
                      Apply Password to Login Form →
                    </button>
                  )}
                  {guide.appPasswordUrl && (
                    <a
                      href={guide.appPasswordUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                      style={{ fontSize: 12.5, padding: '10px 16px', borderRadius: 8, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                    >
                      <span>Open {guide.shortName} Page ↗</span>
                    </a>
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
                    Why does Google require an App Password?
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
                    Google has enhanced account security. When 2-Step Verification is turned on, standard mail clients cannot complete a 2FA prompt during automated background IMAP synchronization. Google provides dedicated 16-character App Passwords to allow third-party apps like MailMind to sync securely without sharing your master account password.
                  </div>
                </div>

                <div style={{
                  background: 'var(--surface2)',
                  borderRadius: 12,
                  padding: '14px 16px',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                    Is it safer than my normal password?
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
                    Yes! An App Password only grants access to sync your mailbox via IMAP/SMTP. It does not allow anyone to change your Google Account recovery options, billing, or security settings.
                  </div>
                </div>

                <div style={{
                  background: 'var(--surface2)',
                  borderRadius: 12,
                  padding: '14px 16px',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                    How do I revoke or delete an App Password?
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
                    You can visit <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>Google App Passwords</a> at any time and click the trash can icon next to &ldquo;MailMind&rdquo;. MailMind will immediately lose access without affecting your main Google Account.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════ TAB: ACCOUNT RECOVERY ══════════════════ */}
          {activeTab === 'recovery' && (
            <div className="fade-in">
              <div style={{
                background: 'var(--surface2)',
                borderRadius: 14,
                padding: '16px',
                border: '1px solid var(--border)'
              }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
                  Official Master Password Reset Links
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.4 }}>
                  If you need to reset or recover your master email account password, visit your provider&apos;s official account recovery page:
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {PROVIDER_LIST.filter(p => p.recoveryUrl).map((p) => (
                    <a
                      key={p.id}
                      href={p.recoveryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: 'var(--surface)',
                        borderRadius: 10,
                        border: '1px solid var(--border)',
                        color: 'var(--text)',
                        textDecoration: 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ProviderIcon provider={p.id} size={18} />
                        <span style={{ fontSize: 12.5, fontWeight: 600 }}>{p.name} Recovery</span>
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--accent)' }}>Open Recovery Page ↗</span>
                    </a>
                  ))}
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
          <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheckIcon size={13} style={{ color: 'var(--accent)' }} />
            <span>Encrypted IMAP and SMTP Connection</span>
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
                disabled={!pastedPassword.trim()}
                onClick={() => handleApply(pastedPassword)}
                className="btn btn-primary btn-sm"
                style={{ fontSize: 12, padding: '5px 14px', borderRadius: 8 }}
              >
                Apply to Form
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
