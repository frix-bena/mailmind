'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EmailAvatar, { GMAIL_AVATAR_PALETTE } from '@/components/EmailAvatar';
import MonitoringModeModal from '@/components/MonitoringModeModal';
import { extractDisplayName } from '@/lib/avatar-utils';
import {
  getStoredAccounts,
  saveStoredAccounts,
  addOrUpdateAccount,
  removeStoredAccount,
  switchActiveAccount
} from '@/lib/account-manager';

import ProviderIcon, { PROVIDER_LIST, getProviderInfo } from '@/components/ProviderIcon';

const PROVIDERS = PROVIDER_LIST;

export default function GoogleAccountModal({
  user,
  onClose,
  onOpenCompose,
  onDisconnect,
  onUserUpdate,
  onAccountSwitch,
  initialTab = 'overview'
}) {
  const router = useRouter();
  const displayName = extractDisplayName(user?.name, user?.email);
  const firstName = displayName.split(' ')[0] || 'User';

  const [activeTab, setActiveTab] = useState(initialTab); // 'overview' | 'switch' | 'photo' | 'color'
  const [photoUrl, setPhotoUrl] = useState(user?.avatar || user?.picture || user?.photoUrl || '');
  const [selectedColor, setSelectedColor] = useState(user?.avatarColor || user?.color || '');
  const [tempPhotoUrl, setTempPhotoUrl] = useState(photoUrl);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [switchingTo, setSwitchingTo] = useState(null);
  const [showMonitoringModal, setShowMonitoringModal] = useState(false);

  // Add new account form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newProvider, setNewProvider] = useState('google');
  const [newHost, setNewHost] = useState('');
  const [newPort, setNewPort] = useState('993');
  const [newTone, setNewTone] = useState('professional');
  const [newMonitoringMode, setNewMonitoringMode] = useState('ask_permission');
  const [newAvatarColor, setNewAvatarColor] = useState('#1a73e8');
  const [newAccountError, setNewAccountError] = useState('');
  const [newAccountConnecting, setNewAccountConnecting] = useState(false);

  useEffect(() => {
    setPhotoUrl(user?.avatar || user?.picture || user?.photoUrl || '');
    setSelectedColor(user?.avatarColor || user?.color || '');
    setTempPhotoUrl(user?.avatar || user?.picture || user?.photoUrl || '');
    refreshAccounts();
  }, [user]);

  const refreshAccounts = () => {
    try {
      const stored = getStoredAccounts();
      setAccounts(stored);
    } catch {
      setAccounts([]);
    }
  };

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
        setTempPhotoUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = async (newAvatar, newColor) => {
    setSaving(true);
    const updated = {
      ...(user || {}),
      avatar: newAvatar !== undefined ? newAvatar : photoUrl,
      picture: newAvatar !== undefined ? newAvatar : photoUrl,
      avatarColor: newColor !== undefined ? newColor : selectedColor,
      color: newColor !== undefined ? newColor : selectedColor,
    };

    try {
      localStorage.setItem('mailmind_user', JSON.stringify(updated));
      addOrUpdateAccount(updated);
    } catch {}

    try {
      await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatar: updated.avatar,
          picture: updated.picture,
          avatarColor: updated.avatarColor,
          color: updated.color,
          name: updated.name
        })
      });
    } catch {}

    if (onUserUpdate) {
      onUserUpdate(updated);
    }

    setPhotoUrl(updated.avatar);
    setSelectedColor(updated.avatarColor);
    setSaving(false);
    setSuccessMsg('Profile picture updated!');
    setTimeout(() => setSuccessMsg(''), 2500);
    setActiveTab('overview');
  };

  const handleResetToGoogle = () => {
    setTempPhotoUrl('');
    handleSaveAvatar('', selectedColor);
  };

  // Switch to an existing account
  const handleSwitchAccount = async (targetAcc) => {
    if (!targetAcc || targetAcc.email.toLowerCase() === user?.email?.toLowerCase()) {
      setActiveTab('overview');
      return;
    }

    setSwitchingTo(targetAcc.email);
    try {
      const switched = await switchActiveAccount(targetAcc);
      if (switched) {
        setPhotoUrl(switched.avatar || switched.picture || '');
        setSelectedColor(switched.avatarColor || switched.color || '');
        refreshAccounts();

        if (onAccountSwitch) {
          onAccountSwitch(switched);
        } else if (onUserUpdate) {
          onUserUpdate(switched);
        }

        setSuccessMsg('Switched to ' + switched.email + '!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error('Account switch failed:', err);
    } finally {
      setSwitchingTo(null);
      setActiveTab('overview');
    }
  };

  // Remove account from list
  const handleRemoveAccount = (e, emailToRemove) => {
    e.stopPropagation();
    if (window.confirm('Remove ' + emailToRemove + ' from saved accounts?')) {
      removeStoredAccount(emailToRemove);
      refreshAccounts();
      setSuccessMsg('Removed ' + emailToRemove);
      setTimeout(() => setSuccessMsg(''), 2500);
    }
  };

  // Auto-detect provider when typing new email
  const handleNewEmailChange = (val) => {
    setNewEmail(val);
    const domain = (val.split('@')[1] || '').toLowerCase();
    if (domain.includes('gmail') || domain.includes('googlemail')) {
      setNewProvider('google');
    } else if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live') || domain.includes('office365')) {
      setNewProvider('microsoft');
    } else if (domain.includes('yahoo')) {
      setNewProvider('yahoo');
    } else if (domain.includes('icloud') || domain.includes('me.com') || domain.includes('mac.com')) {
      setNewProvider('icloud');
    }
  };

  // Helper to validate and construct new candidate account object
  const buildCandidateAccount = () => {
    if (!newEmail || !newEmail.includes('@')) {
      setNewAccountError('Please enter a valid email address.');
      return null;
    }
    if (!newPassword || !newPassword.trim()) {
      setNewAccountError('Password is required. Please enter your email account password.');
      return null;
    }

    const cleanEmail = newEmail.trim().toLowerCase();
    const candidateName = newName.trim() || extractDisplayName('', cleanEmail);

    return {
      email: cleanEmail,
      name: candidateName,
      provider: newProvider,
      password: newPassword.trim(),
      host: newProvider === 'custom' ? (newHost.trim() || undefined) : undefined,
      port: newProvider === 'custom' ? (newPort.trim() || '993') : undefined,
      tone: newTone,
      monitoringMode: newMonitoringMode || 'ask_permission',
      avatarColor: newAvatarColor || selectedColor || '#1a73e8',
      connected: true,
      isDemo: false,
      savedAt: new Date().toISOString()
    };
  };

  const resetAddForm = () => {
    setShowAddForm(false);
    setNewName('');
    setNewEmail('');
    setNewPassword('');
    setNewHost('');
    setNewPort('993');
    setNewTone('professional');
    setNewMonitoringMode('ask_permission');
    setNewAvatarColor('#1a73e8');
    setNewAccountError('');
    setNewAccountConnecting(false);
  };

  // Save new account to list without switching immediately
  const handleAddAccountOnly = async (e) => {
    e.preventDefault();
    const candidate = buildCandidateAccount();
    if (!candidate) return;

    // Check if account already exists
    const exists = accounts.some(a => a.email.toLowerCase() === candidate.email);
    if (exists) {
      setNewAccountError(`An account with ${candidate.email} already exists.`);
      return;
    }

    setNewAccountConnecting(true);
    setNewAccountError('');

    try {
      const res = await fetch('/api/auth/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: candidate.email,
          password: candidate.password,
          provider: candidate.provider,
          host: candidate.host,
          port: candidate.port,
          tone: candidate.tone
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setNewAccountConnecting(false);
        setNewAccountError(data.error || 'Failed to authenticate with email server. Please check your password.');
        return;
      }
      if (data.name && !newName.trim()) candidate.name = data.name;

      addOrUpdateAccount(candidate);
      refreshAccounts();
      setSuccessMsg(`Account ${candidate.email} added!`);
      setTimeout(() => setSuccessMsg(''), 3000);
      resetAddForm();
    } catch (err) {
      setNewAccountError(err.message || 'Failed to save account.');
    } finally {
      setNewAccountConnecting(false);
    }
  };

  // Connect and switch to a new email address immediately
  const handleConnectAndSwitch = async (e) => {
    e.preventDefault();
    const candidate = buildCandidateAccount();
    if (!candidate) return;

    setNewAccountConnecting(true);
    setNewAccountError('');

    try {
      const res = await fetch('/api/auth/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: candidate.email,
          password: candidate.password,
          provider: candidate.provider,
          host: candidate.host,
          port: candidate.port,
          tone: candidate.tone
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.name && !newName.trim()) candidate.name = data.name;
      } else {
        setNewAccountConnecting(false);
        setNewAccountError(data.error || 'Failed to authenticate with email server. Please check your password.');
        return;
      }
    } catch (err) {
      setNewAccountConnecting(false);
      setNewAccountError('Connection error: ' + (err.message || 'Unable to connect to email authentication service.'));
      return;
    }

    // Save and switch
    addOrUpdateAccount(candidate);
    await handleSwitchAccount(candidate);
    resetAddForm();
  };

  const currentProviderObj = PROVIDERS.find(p => p.id === newProvider) || PROVIDERS[0];
  const otherAccounts = accounts.filter(
    a => a.email && a.email.toLowerCase() !== user?.email?.toLowerCase()
  );

  return (
    <div
      className="modal-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        zIndex: 1000,
        backdropFilter: 'blur(6px)',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        animation: 'fadeIn 0.15s ease'
      }}
    >
      <div
        className="modal google-account-card"
        style={{
          maxWidth: 460,
          width: '100%',
          padding: 0,
          borderRadius: 24,
          background: 'var(--surface, #1e1e2d)',
          border: '1px solid var(--border2, #2f2f44)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.55)',
          overflow: 'hidden',
          animation: 'scaleUp 0.18s ease-out',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Google Account Modal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px 12px',
          borderBottom: '1px solid var(--border, #2a2a3c)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted, #94a3b8)', letterSpacing: '0.2px' }}>
              Google Account &bull; Profile
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {activeTab !== 'overview' && (
              <button
                onClick={() => setActiveTab('overview')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 6
                }}
              >
                &larr; Overview
              </button>
            )}
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1
              }}
            >
              &#10005;
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '20px 20px 16px', overflowY: 'auto', flex: 1 }}>

          {/* Success Message Banner */}
          {successMsg && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid var(--success)',
              color: '#86efac',
              fontSize: 12.5,
              padding: '8px 14px',
              borderRadius: 20,
              marginBottom: 14,
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}>
              <span>&#9989;</span> {successMsg}
            </div>
          )}

          {/* ══════════════════ TAB: OVERVIEW ══════════════════ */}
          {activeTab === 'overview' && (
            <div style={{ textAlign: 'center' }}>
              {/* Main Gmail Avatar */}
              <div style={{ display: 'inline-block', position: 'relative', marginBottom: 10 }}>
                <EmailAvatar
                  src={photoUrl}
                  email={user?.email}
                  name={displayName}
                  size={76}
                  isUser={true}
                  color={selectedColor}
                  showCameraBadge={true}
                  onCameraClick={() => setActiveTab('photo')}
                  style={{
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
                    border: '2px solid rgba(255, 255, 255, 0.15)'
                  }}
                />
              </div>

              <h2 style={{
                fontSize: 19,
                fontWeight: 700,
                margin: '2px 0 2px',
                fontFamily: '"Google Sans", "Product Sans", Roboto, system-ui, sans-serif'
              }}>
                Hi, {firstName}!
              </h2>

              <div style={{
                fontSize: 13,
                color: 'var(--muted, #94a3b8)',
                marginBottom: 14,
                fontFamily: 'monospace'
              }}>
                {user?.email}
              </div>

              {/* Quick Action Pill Buttons: Switch Account & Customize Photo */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('switch')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'var(--surface2)',
                    border: '1px solid var(--accent)',
                    color: 'var(--text)',
                    fontSize: 12.5,
                    fontWeight: 600,
                    padding: '7px 16px',
                    borderRadius: 100,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 2px 8px rgba(108, 99, 255, 0.2)'
                  }}
                >
                  <span>&#8644;</span> Switch / Manage Accounts ({accounts.length})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('photo')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'transparent',
                    border: '1px solid var(--border2, #3b3b54)',
                    color: 'var(--muted)',
                    fontSize: 12.5,
                    fontWeight: 500,
                    padding: '7px 14px',
                    borderRadius: 100,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>&#128247;</span> Customize Photo
                </button>
              </div>

              {/* Quick Google-Style Account Switcher Strip */}
              {otherAccounts.length > 0 ? (
                <div style={{
                  background: 'var(--surface2, #252538)',
                  borderRadius: 14,
                  padding: '12px 14px',
                  marginBottom: 18,
                  textAlign: 'left',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 10
                  }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Other Accounts on this device ({otherAccounts.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('switch')}
                      style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Manage &rarr;
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {otherAccounts.slice(0, 3).map((acc) => {
                      const accName = extractDisplayName(acc.name, acc.email);
                      const isTargetSwitching = switchingTo === acc.email;
                      return (
                        <div
                          key={acc.email}
                          onClick={() => handleSwitchAccount(acc)}
                          title={'Click to switch to ' + acc.email}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '8px 10px',
                            background: 'var(--surface)',
                            borderRadius: 10,
                            cursor: 'pointer',
                            border: '1px solid var(--border)',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                        >
                          <EmailAvatar
                            src={acc.avatar || acc.picture}
                            email={acc.email}
                            name={accName}
                            size={28}
                            color={acc.avatarColor || acc.color}
                            isUser={true}
                            showTooltip={false}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {accName}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {acc.email}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6 }}
                          >
                            {isTargetSwitching ? '...' : 'Switch'}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(true);
                      setActiveTab('switch');
                    }}
                    style={{
                      width: '100%',
                      marginTop: 10,
                      background: 'none',
                      border: '1px dashed var(--border2)',
                      borderRadius: 8,
                      padding: '6px',
                      color: 'var(--accent)',
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4
                    }}
                  >
                    + Add Another Account
                  </button>
                </div>
              ) : (
                <div style={{
                  background: 'var(--surface2, #252538)',
                  borderRadius: 14,
                  padding: '12px 14px',
                  marginBottom: 18,
                  textAlign: 'left',
                  border: '1px dashed var(--border2, #3b3b54)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12
                }}>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>
                      Connect More Email Accounts
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                      Add your work, personal, or secondary email to switch between them anytime.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(true);
                      setActiveTab('switch');
                    }}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: 11.5, padding: '5px 12px', borderRadius: 8, whiteSpace: 'nowrap' }}
                  >
                    + Add Account
                  </button>
                </div>
              )}

              {/* Account Details Box */}
              <div style={{
                background: 'var(--surface2, #242436)',
                borderRadius: 12,
                padding: '12px 14px',
                marginBottom: 18,
                fontSize: 12.5,
                display: 'flex',
                flexDirection: 'column',
                gap: 7,
                border: '1px solid var(--border)',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--muted)' }}>Account Provider:</span>
                  <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ProviderIcon provider={user?.provider || user?.email} size={16} />
                    {getProviderInfo(user?.provider || user?.email).name}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>AI Reply Tone:</span>
                  <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{user?.tone || 'Professional'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--muted)' }}>Monitoring Mode:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontWeight: 600,
                      color: (user?.monitoringMode === 'auto_reply' || user?.monitoringMode === 'without_permission') ? 'var(--accent)' : '#86efac',
                      fontSize: 12
                    }}>
                      {(user?.monitoringMode === 'auto_reply' || user?.monitoringMode === 'without_permission') ? '⚡ Autonomous' : '🛡️ Permission-First'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowMonitoringModal(true)}
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border2, #3b3b54)',
                        color: 'var(--text)',
                        fontSize: 10.5,
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                      title="Open pop-up bar to change monitoring mode"
                    >
                      <span>⚙️</span> Change ⇄
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    onClose();
                    onOpenCompose && onOpenCompose();
                  }}
                  style={{ borderRadius: 10, padding: '9px 12px', fontSize: 12.5 }}
                >
                  &#9993;&#65039; Compose Email
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    onClose();
                    router.push('/settings');
                  }}
                  style={{ borderRadius: 10, padding: '9px 12px', fontSize: 12.5 }}
                >
                  &#9881;&#65039; Account Settings
                </button>
              </div>

              {/* Disconnect / Sign Out */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onDisconnect && onDisconnect();
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: 'var(--danger, #f87171)',
                    padding: '6px 18px',
                    borderRadius: 100,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  Sign out / Disconnect Active Account
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════ TAB: SWITCH ACCOUNT ══════════════════ */}
          {activeTab === 'switch' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
                    Switch Account
                  </h3>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                    Choose an account to switch into or connect a new email address.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(!showAddForm);
                    setNewAccountError('');
                  }}
                  className="btn btn-primary btn-sm"
                  style={{ fontSize: 11.5, padding: '5px 12px', borderRadius: 8 }}
                >
                  {showAddForm ? 'Close Form' : '+ Add Email'}
                </button>
              </div>

              {/* Add Account Inline Form */}
              {showAddForm && (
                <form
                  onSubmit={handleConnectAndSwitch}
                  style={{
                    background: 'var(--surface2, #252538)',
                    borderRadius: 14,
                    padding: 16,
                    marginBottom: 18,
                    border: '1px solid var(--accent)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                      Connect &amp; Add Email Account
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                      Supports Gmail, Outlook, Yahoo, iCloud &amp; IMAP
                    </span>
                  </div>

                  {newAccountError && (
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid var(--danger)',
                      color: '#fca5a5',
                      fontSize: 12,
                      padding: '8px 10px',
                      borderRadius: 8,
                      marginBottom: 12
                    }}>
                      &#9888;&#65039; {newAccountError}
                    </div>
                  )}

                  {/* Provider Pills */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
                    {PROVIDERS.map(p => {
                      const isSelected = newProvider === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setNewProvider(p.id)}
                          style={{
                            flex: 1,
                            minWidth: 70,
                            padding: '8px 4px',
                            fontSize: 11.5,
                            fontWeight: isSelected ? 700 : 600,
                            borderRadius: 8,
                            border: `1.5px solid ${isSelected ? (p.color || 'var(--accent)') : 'var(--border)'}`,
                            background: isSelected ? 'var(--accent-glow)' : 'var(--surface)',
                            color: isSelected ? 'var(--text)' : 'var(--muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 5,
                            transition: 'all 0.15s ease',
                            textAlign: 'center'
                          }}
                          title={p.brandName || p.name}
                        >
                          <ProviderIcon provider={p.id} size={20} />
                          <span style={{ fontSize: 11, lineHeight: 1.1 }}>{p.shortName || p.name.split('/')[0].trim()}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Account Name / Label */}
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>
                      Account Label / Name (Optional):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Work Email, Personal Gmail, Consulting"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        padding: '8px 10px',
                        color: 'var(--text)',
                        fontSize: 12.5,
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Email Address */}
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>
                      Email Address <span style={{ color: 'var(--danger)' }}>*</span>:
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. user@gmail.com, work@company.com"
                      value={newEmail}
                      onChange={e => handleNewEmailChange(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        padding: '8px 10px',
                        color: 'var(--text)',
                        fontSize: 12.5,
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Password */}
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>
                      Password <span style={{ color: 'var(--danger)' }}>*</span>:
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Email account password (required)"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        padding: '8px 10px',
                        color: 'var(--text)',
                        fontSize: 12.5,
                        boxSizing: 'border-box'
                      }}
                    />
                    <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 3 }}>
                      {currentProviderObj.hint} &bull; Password is required
                    </div>
                  </div>

                  {/* Custom IMAP Host & Port */}
                  {newProvider === 'custom' && (
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                      <div style={{ flex: 2 }}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 3 }}>IMAP Host</label>
                        <input
                          type="text"
                          placeholder="imap.mail.com"
                          value={newHost}
                          onChange={e => setNewHost(e.target.value)}
                          style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px', color: 'var(--text)', fontSize: 12, boxSizing: 'border-box' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 3 }}>Port</label>
                        <input
                          type="text"
                          placeholder="993"
                          value={newPort}
                          onChange={e => setNewPort(e.target.value)}
                          style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px', color: 'var(--text)', fontSize: 12, boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Reply Tone Selection */}
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>
                      AI Reply Tone for this Account:
                    </label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {['professional', 'casual', 'brief', 'friendly'].map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setNewTone(t)}
                          style={{
                            flex: 1,
                            padding: '4px 6px',
                            fontSize: 11,
                            borderRadius: 6,
                            textTransform: 'capitalize',
                            border: '1px solid ' + (newTone === t ? 'var(--accent)' : 'var(--border)'),
                            background: newTone === t ? 'var(--accent-glow)' : 'var(--surface)',
                            color: newTone === t ? 'var(--text)' : 'var(--muted)',
                            cursor: 'pointer'
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Monitoring Mode Selection */}
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>
                      Monitoring &amp; Reply Mode:
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => setNewMonitoringMode('ask_permission')}
                        style={{
                          padding: '6px 8px',
                          fontSize: 11,
                          fontWeight: 600,
                          borderRadius: 6,
                          textAlign: 'left',
                          border: '1px solid ' + (newMonitoringMode === 'ask_permission' ? 'var(--accent)' : 'var(--border)'),
                          background: newMonitoringMode === 'ask_permission' ? 'var(--accent-glow)' : 'var(--surface)',
                          color: newMonitoringMode === 'ask_permission' ? 'var(--text)' : 'var(--muted)',
                          cursor: 'pointer'
                        }}
                      >
                        🛡️ Ask Permission
                        <div style={{ fontSize: 9.5, color: 'var(--muted)', fontWeight: 400, marginTop: 2 }}>
                          Human approval required
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewMonitoringMode('auto_reply')}
                        style={{
                          padding: '6px 8px',
                          fontSize: 11,
                          fontWeight: 600,
                          borderRadius: 6,
                          textAlign: 'left',
                          border: '1px solid ' + (newMonitoringMode === 'auto_reply' ? 'var(--accent)' : 'var(--border)'),
                          background: newMonitoringMode === 'auto_reply' ? 'var(--accent-glow)' : 'var(--surface)',
                          color: newMonitoringMode === 'auto_reply' ? 'var(--text)' : 'var(--muted)',
                          cursor: 'pointer'
                        }}
                      >
                        ⚡ Without Permission
                        <div style={{ fontSize: 9.5, color: 'var(--muted)', fontWeight: 400, marginTop: 2 }}>
                          Auto-reply immediately
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Avatar Color Choice */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>
                      Account Avatar Color:
                    </label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {GMAIL_AVATAR_PALETTE.slice(0, 8).map(pal => {
                        const isChosen = newAvatarColor === pal.hex;
                        return (
                          <button
                            key={pal.hex}
                            type="button"
                            onClick={() => setNewAvatarColor(pal.hex)}
                            title={pal.name}
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              background: pal.hex,
                              border: isChosen ? '2px solid #ffffff' : '1px solid rgba(0,0,0,0.2)',
                              boxShadow: isChosen ? '0 0 0 2px var(--accent)' : 'none',
                              cursor: 'pointer',
                              transform: isChosen ? 'scale(1.2)' : 'scale(1)',
                              transition: 'transform 0.15s ease'
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                    <button
                      type="button"
                      onClick={resetAddForm}
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: 11.5 }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddAccountOnly}
                      disabled={newAccountConnecting || !newEmail || !newPassword.trim()}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: 11.5, padding: '6px 12px' }}
                    >
                      Save to Accounts
                    </button>
                    <button
                      type="submit"
                      disabled={newAccountConnecting || !newEmail || !newPassword.trim()}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: 11.5, padding: '6px 14px' }}
                    >
                      {newAccountConnecting ? 'Connecting & Switching...' : 'Connect & Switch →'}
                    </button>
                  </div>
                </form>
              )}

              {/* Saved Accounts List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                {/* Active Account */}
                {user && user.email && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: 'var(--accent-glow)',
                    border: '1.5px solid var(--accent)',
                    boxShadow: '0 2px 10px rgba(108, 99, 255, 0.15)'
                  }}>
                    <EmailAvatar
                      src={photoUrl}
                      email={user.email}
                      name={displayName}
                      size={36}
                      color={selectedColor}
                      isUser={true}
                      showTooltip={false}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                          {displayName}
                        </span>
                        <span className="badge badge-low" style={{ fontSize: 10, padding: '1px 6px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <ProviderIcon provider={user?.provider || user?.email} size={11} />
                          Active
                        </span>
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user.email}
                      </div>
                    </div>
                    <span style={{ fontSize: 16, color: 'var(--accent)' }}>&#10003;</span>
                  </div>
                )}

                {/* Other Saved Accounts */}
                {otherAccounts.map((acc) => {
                  const accDisplayName = extractDisplayName(acc.name, acc.email);
                  const isSwitchingThis = switchingTo === acc.email;
                  return (
                    <div
                      key={acc.email}
                      onClick={() => handleSwitchAccount(acc)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 14px',
                        borderRadius: 12,
                        background: 'var(--surface2)',
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                    >
                      <EmailAvatar
                        src={acc.avatar || acc.picture}
                        email={acc.email}
                        name={accDisplayName}
                        size={36}
                        color={acc.avatarColor || acc.color}
                        isUser={true}
                        showTooltip={false}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                            {accDisplayName}
                          </span>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 10.5,
                            color: 'var(--muted)',
                            background: 'var(--surface)',
                            padding: '1px 6px',
                            borderRadius: 6,
                            border: '1px solid var(--border)'
                          }}>
                            <ProviderIcon provider={acc.provider || acc.email} size={12} />
                            {getProviderInfo(acc.provider || acc.email).shortName}
                          </span>
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--muted)', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {acc.email}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleSwitchAccount(acc); }}
                        disabled={isSwitchingThis}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6 }}
                      >
                        {isSwitchingThis ? 'Switching...' : 'Switch'}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleRemoveAccount(e, acc.email)}
                        title="Remove from saved accounts"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--muted)',
                          cursor: 'pointer',
                          padding: '4px 6px',
                          fontSize: 13,
                          borderRadius: 4
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; }}
                      >
                        &#10005;
                      </button>
                    </div>
                  );
                })}

                {/* Empty State when no other accounts exist */}
                {otherAccounts.length === 0 && !showAddForm && (
                  <div style={{
                    padding: '24px 16px',
                    textAlign: 'center',
                    background: 'var(--surface2)',
                    borderRadius: 12,
                    border: '1px dashed var(--border)'
                  }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>📬</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                      No other accounts connected
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4, maxWidth: 300, margin: '4px auto 14px' }}>
                      Add your personal, work, or team email accounts to switch between them with one click.
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(true)}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8 }}
                    >
                      + Add Your Email Account
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════ TAB: PHOTO & COLORS ══════════════════ */}
          {(activeTab === 'photo' || activeTab === 'color') && (
            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('photo')}
                  style={{
                    flex: 1,
                    padding: '7px 10px',
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 8,
                    border: 'none',
                    background: activeTab === 'photo' ? 'var(--accent)' : 'var(--surface2)',
                    color: activeTab === 'photo' ? '#fff' : 'var(--muted)',
                    cursor: 'pointer'
                  }}
                >
                  &#128444;&#65039; Photo URL / Upload
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('color')}
                  style={{
                    flex: 1,
                    padding: '7px 10px',
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 8,
                    border: 'none',
                    background: activeTab === 'color' ? 'var(--accent)' : 'var(--surface2)',
                    color: activeTab === 'color' ? '#fff' : 'var(--muted)',
                    cursor: 'pointer'
                  }}
                >
                  &#127912; Google Colors
                </button>
              </div>

              {activeTab === 'photo' && (
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                    Profile Photo URL or Direct Image Link:
                  </label>
                  <input
                    type="url"
                    value={tempPhotoUrl}
                    onChange={e => setTempPhotoUrl(e.target.value)}
                    placeholder="https://example.com/my-avatar.jpg"
                    style={{
                      width: '100%',
                      background: 'var(--surface2)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      padding: '8px 10px',
                      color: 'var(--text)',
                      fontSize: 12.5,
                      marginBottom: 10,
                      boxSizing: 'border-box'
                    }}
                  />

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <label
                      style={{
                        flex: 1,
                        background: 'var(--surface2)',
                        border: '1px dashed var(--border2)',
                        borderRadius: 8,
                        padding: '7px 10px',
                        fontSize: 12,
                        textAlign: 'center',
                        color: 'var(--muted)',
                        cursor: 'pointer'
                      }}
                    >
                      &#128193; Upload Photo from Computer
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={handleResetToGoogle}
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: 11, padding: '5px 10px' }}
                      title="Fetch photo automatically from Google / Gravatar"
                    >
                      &#128259; Auto Google Sync
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveAvatar(tempPhotoUrl, selectedColor)}
                      disabled={saving}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: 11, padding: '5px 14px' }}
                    >
                      {saving ? 'Saving...' : 'Apply Photo'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'color' && (
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted)', marginBottom: 8 }}>
                    Select Authentic Google Material Design Avatar Color:
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(8, 1fr)',
                    gap: 6,
                    marginBottom: 14
                  }}>
                    {GMAIL_AVATAR_PALETTE.map((pal) => {
                      const isSelected = (selectedColor && selectedColor.toLowerCase() === pal.hex.toLowerCase()) ||
                        (!selectedColor && !photoUrl && pal.hex === '#1a73e8');
                      return (
                        <button
                          key={pal.hex}
                          type="button"
                          onClick={() => {
                            setSelectedColor(pal.hex);
                            handleSaveAvatar('', pal.hex);
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
                </div>
              )}
            </div>
          )}

        </div>

        {/* Google-style Footer */}
        <div style={{
          padding: '10px 20px',
          background: 'rgba(0, 0, 0, 0.15)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          fontSize: 11,
          color: 'var(--muted)',
          flexShrink: 0
        }}>
          <a href="#" onClick={e => e.preventDefault()} style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Policy</a>
          <span>&bull;</span>
          <a href="#" onClick={e => e.preventDefault()} style={{ color: 'inherit', textDecoration: 'none' }}>Terms of Service</a>
        </div>
      </div>

      {showMonitoringModal && (
        <MonitoringModeModal
          isOpen={showMonitoringModal}
          currentMode={user?.monitoringMode || 'ask_permission'}
          user={user}
          onClose={() => setShowMonitoringModal(false)}
          onSave={async (nextMode) => {
            const updated = { ...(user || {}), monitoringMode: nextMode };
            try {
              localStorage.setItem('mailmind_user', JSON.stringify(updated));
              addOrUpdateAccount(updated);
            } catch {}
            try {
              await fetch('/api/auth/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  monitoringMode: nextMode
                })
              });
            } catch {}
            if (onUserUpdate) onUserUpdate(updated);
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('mailmind:account-switched', { detail: updated }));
            }
            setSuccessMsg(`Mode changed to: ${nextMode === 'auto_reply' ? 'Reply without permission' : 'Ask permission'}`);
            setTimeout(() => setSuccessMsg(''), 2500);
          }}
        />
      )}
    </div>
  );
}
