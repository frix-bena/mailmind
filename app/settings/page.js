'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import EmailAvatar, { GMAIL_AVATAR_PALETTE } from '@/components/EmailAvatar';
import GoogleAccountModal from '@/components/GoogleAccountModal';
import MonitoringModeModal from '@/components/MonitoringModeModal';
import AppPasswordModal from '@/components/AppPasswordModal';
import ProviderIcon, { getProviderInfo, PROVIDER_LIST } from '@/components/ProviderIcon';
import {
  generateAppPassword,
  generateSecurePassword,
  cleanAppPassword,
  calculatePasswordStrength,
  PROVIDER_GUIDES
} from '@/lib/app-password-generator';
import { extractDisplayName } from '@/lib/avatar-utils';
import {
  getActiveUser,
  getStoredAccounts,
  removeStoredAccount,
  switchActiveAccount,
  addOrUpdateAccount,
  updateAccountPassword,
  isDemoAccount
} from '@/lib/account-manager';
import ThemeToggle from '@/components/ThemeToggle';
import {
  useTheme,
  THEME_MODES,
  CUSTOM_PRESETS,
  BACKGROUND_TONES,
  ACCENT_SWATCHES,
  hexToRgba
} from '@/lib/theme-manager';
import {
  requestDeviceNotificationPermission,
  getDeviceNotificationPermission,
  isDeviceNotificationSupported,
  sendUnifiedDeviceNotification,
  playNotificationChime,
  loadNotificationSettings,
  saveNotificationSettings
} from '@/lib/browser-notifications';
import LegalModal from '@/components/LegalModal';
import {
  CheckIcon,
  CloseIcon,
  KeyIcon,
  ShieldIcon,
  ShieldCheckIcon,
  SunIcon,
  MoonIcon,
  PaletteIcon,
  SlidersIcon,
  SendIcon,
  SettingsIcon,
  BellIcon,
  DocumentIcon,
  RefreshIcon,
  MenuIcon
} from '@/components/Icons';

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
  const { theme, mode, preset, setMode, setPreset, updateTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [avatarColor, setAvatarColor] = useState('');
  const [tone, setTone] = useState('professional');
  const [signature, setSignature] = useState('');
  const [monitoringMode, setMonitoringMode] = useState('ask_permission');
  const [inApp, setInApp] = useState(true);
  const [deviceNotifications, setDeviceNotifications] = useState(true);
  const [notifSound, setNotifSound] = useState(true);
  const [highUrgencyOnly, setHighUrgencyOnly] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [browserPermission, setBrowserPermission] = useState('default');
  const [testingNotif, setTestingNotif] = useState(false);
  const [notifStatusMsg, setNotifStatusMsg] = useState('');
  const [digest, setDigest] = useState(false);
  const [pollInterval, setPollInterval] = useState('3');
  const [disconnecting, setDisconnecting] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userModalTab, setUserModalTab] = useState('overview');
  const [monitoringModalOpen, setMonitoringModalOpen] = useState(false);
  const [appPasswordModalOpen, setAppPasswordModalOpen] = useState(false);
  const [appPasswordModalTab, setAppPasswordModalTab] = useState('guide');
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState('terms');

  // Password Management States for Settings
  const [newAccountPassword, setNewAccountPassword] = useState('');
  const [confirmNewAccountPassword, setConfirmNewAccountPassword] = useState('');
  const [showNewAccountPassword, setShowNewAccountPassword] = useState(false);
  const [pwdUpdateSuccess, setPwdUpdateSuccess] = useState('');
  const [pwdUpdateError, setPwdUpdateError] = useState('');
  const [savingNewPassword, setSavingNewPassword] = useState(false);

  // Profile details and avatar customizer toggle
  const [showCustomizer, setShowCustomizer] = useState(false);

  const openAppPasswordModal = (tab = 'guide') => {
    setAppPasswordModalTab(tab);
    setAppPasswordModalOpen(true);
  };

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
    router.prefetch('/inbox');
    router.prefetch('/search');
    if (stored.name) setName(stored.name);
    if (stored.avatar || stored.picture) setAvatar(stored.avatar || stored.picture || '');
    if (stored.avatarColor || stored.color) setAvatarColor(stored.avatarColor || stored.color || '');
    if (stored.tone) setTone(stored.tone);
    if (stored.signature !== undefined) setSignature(stored.signature);
    if (stored.monitoringMode) setMonitoringMode(stored.monitoringMode);
    if (stored.inApp !== undefined) setInApp(stored.inApp);
    if (stored.deviceNotifications !== undefined) setDeviceNotifications(stored.deviceNotifications);
    if (stored.notifSound !== undefined) setNotifSound(stored.notifSound);
    if (stored.highUrgencyOnly !== undefined) setHighUrgencyOnly(stored.highUrgencyOnly);
    if (stored.webhookUrl) setWebhookUrl(stored.webhookUrl);
    if (stored.digest !== undefined) setDigest(stored.digest);
    if (stored.pollInterval) setPollInterval(stored.pollInterval);
    
    // Load local device notification settings
    const nSettings = loadNotificationSettings();
    if (nSettings.enabled !== undefined) setDeviceNotifications(nSettings.enabled);
    if (nSettings.sound !== undefined) setNotifSound(nSettings.sound);
    if (nSettings.highUrgencyOnly !== undefined) setHighUrgencyOnly(nSettings.highUrgencyOnly);
    if (nSettings.webhookUrl) setWebhookUrl(nSettings.webhookUrl);
    setBrowserPermission(getDeviceNotificationPermission());

    refreshAccountsList();

    const handleAccountSwitched = (e) => {
      if (e.detail && e.detail.email && !isDemoAccount(e.detail)) {
        const u = e.detail;
        setUser(u);
        if (u.name) setName(u.name);
        if (u.avatar || u.picture) setAvatar(u.avatar || u.picture || '');
        if (u.avatarColor || u.color) setAvatarColor(u.avatarColor || u.color || '');
        if (u.tone) setTone(u.tone);
        if (u.signature !== undefined) setSignature(u.signature);
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
    { id: 'professional', label: 'Professional' },
    { id: 'casual',       label: 'Conversational' },
    { id: 'brief',        label: 'Concise' },
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
    setSaving(true);
    const cleanName = name.trim() || user.name || extractDisplayName('', user.email);
    const updated = {
      ...user,
      name: cleanName,
      avatar,
      picture: avatar,
      avatarColor,
      color: avatarColor,
      tone,
      signature,
      monitoringMode,
      inApp,
      deviceNotifications,
      notifSound,
      highUrgencyOnly,
      webhookUrl,
      digest,
      pollInterval
    };
    setUser(updated);

    try {
      localStorage.setItem('mailmind_user', JSON.stringify(updated));
      addOrUpdateAccount(updated);
      refreshAccountsList();
    } catch (err) {
      console.warn('LocalStorage save error:', err);
    }

    // Save notification local settings
    try {
      saveNotificationSettings({
        enabled: deviceNotifications,
        sound: notifSound,
        highUrgencyOnly,
        webhookUrl
      });
    } catch (_) {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mailmind:account-switched', { detail: updated }));
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);

    // Save to backend API in background
    try {
      const payload = JSON.stringify({
        name: updated.name,
        avatar: updated.avatar,
        picture: updated.picture,
        avatarColor: updated.avatarColor,
        color: updated.color,
        tone: updated.tone,
        signature: updated.signature,
        monitoringMode: updated.monitoringMode,
        inApp: updated.inApp,
        deviceNotifications: updated.deviceNotifications,
        notifSound: updated.notifSound,
        highUrgencyOnly: updated.highUrgencyOnly,
        webhookUrl: updated.webhookUrl,
        digest: updated.digest,
        pollInterval: updated.pollInterval
      });

      fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      }).catch(() => {
        fetch('http://localhost:3002/api/auth/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload
        }).catch(() => {});
      });
    } catch (err) {
      console.warn('Backend save error:', err);
    }
  };

  const handleToggleDeviceNotifications = async (val) => {
    setDeviceNotifications(val);
    if (val && getDeviceNotificationPermission() === 'default') {
      const perm = await requestDeviceNotificationPermission();
      setBrowserPermission(perm);
    }
    saveNotificationSettings({
      enabled: val,
      sound: notifSound,
      highUrgencyOnly,
      webhookUrl
    });
  };

  const handleRequestPermission = async () => {
    const perm = await requestDeviceNotificationPermission();
    setBrowserPermission(perm);
    if (perm === 'granted') {
      setNotifStatusMsg('Notification permission granted!');
      setTimeout(() => setNotifStatusMsg(''), 3000);
    }
  };

  const handleTestNotification = async () => {
    setTestingNotif(true);
    setNotifStatusMsg('');
    try {
      if (getDeviceNotificationPermission() === 'default') {
        const perm = await requestDeviceNotificationPermission();
        setBrowserPermission(perm);
      }
      await sendUnifiedDeviceNotification({
        title: 'MailMind Agent Active',
        message: `Device notifications are working for ${user?.email || 'your account'}.`,
        urgency: 'normal',
        sound: notifSound,
        webhookUrl
      });
      setNotifStatusMsg('Test notification sent to your device!');
      setTimeout(() => setNotifStatusMsg(''), 4000);
    } catch (err) {
      setNotifStatusMsg(`Notification test: ${err.message}`);
    } finally {
      setTestingNotif(false);
    }
  };

  const handleSaveMonitoringMode = async (newMode) => {
    setMonitoringMode(newMode);
    if (!user) return;
    const updated = {
      ...user,
      monitoringMode: newMode
    };
    setUser(updated);
    try {
      localStorage.setItem('mailmind_user', JSON.stringify(updated));
      addOrUpdateAccount(updated);
    } catch {}

    try {
      const modePayload = JSON.stringify({ monitoringMode: newMode });
      try {
        await fetch('/api/auth/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: modePayload
        });
      } catch {
        await fetch('http://localhost:3002/api/auth/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: modePayload
        });
      }
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mailmind:account-switched', { detail: updated }));
    }

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

      const data = await res.json().catch(() => ({ success: false, error: 'Server returned an invalid response.' }));
      if (res && res.ok && data.success) {
        const count = data.total || data.totalMessages || (Array.isArray(data.emails) ? data.emails.length : 0);
        setTestResult({ success: true, message: `Connected! Server responded with ${count} total messages.` });
      } else {
        setTestResult({ success: false, message: (data && data.error) || 'Connection check failed.' });
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
      router.replace('/onboarding');
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
            <MenuIcon size={16} />
          </button>
          <span className="topbar-title">Settings</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <ThemeToggle showLabel={true} />
            {saved ? (
              <span className="badge badge-low fade-in" style={{ fontSize: 11, padding: '4px 10px' }}>Saved</span>
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSave}
                disabled={saving}
                style={{ fontSize: 12, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 5 }}
                title="Save changes to settings"
              >
                {saving ? (
                  <><span className="spinner" style={{ width: 11, height: 11 }} /> Saving…</>
                ) : (
                  <><CheckIcon size={12} /> Save</>
                )}
              </button>
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
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <ProviderIcon provider={user.provider || user.email} size={14} />
                      {providerLabels[user.provider] || 'Google Account'}
                    </span>
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
                      {showCustomizer ? 'Hide Profile Options' : 'Edit Name and Avatar'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={handleTestConnection}
                    disabled={testingConnection}
                  >
                    {testingConnection ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Testing…</> : 'Test Connection'}
                  </button>
                </div>
              </div>

              {/* Profile Details & Photo Customizer Box */}
              {showCustomizer && (
                <div style={{
                  marginTop: 20,
                  padding: 18,
                  background: 'var(--surface2)',
                  borderRadius: 12,
                  border: '1px solid var(--border)'
                }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 14px 0' }}>
                    Profile Details, Photo &amp; Avatar Color
                  </h3>

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                      Display Name:
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      style={{
                        width: '100%',
                        maxWidth: 380,
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        padding: '8px 12px',
                        color: 'var(--text)',
                        fontSize: 13.5,
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

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
                          Upload Photo
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
                          title="Reset to automatic profile initials"
                        >
                          Reset Avatar
                        </button>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>
                        Avatar Initial Base Color:
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
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              {testResult.success ? <CheckIcon size={16} /> : <CloseIcon size={16} />}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Appearance & Theme Settings Section */}
          <div id="theme-settings" style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <PaletteIcon size={16} /> Appearance and Theme Studio
                </h2>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 3 }}>
                  Warm architectural dark tones, archival paper light mode, and handcrafted artisanal palettes.
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="badge badge-purple" style={{ fontSize: 11, textTransform: 'capitalize' }}>
                  Active: {theme.mode === 'custom' ? (CUSTOM_PRESETS.find(p => p.id === theme.preset)?.name || 'Custom Palette') : `${theme.mode} Mode`}
                </span>
                {theme.mode === THEME_MODES.CUSTOM && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: 11, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
                    onClick={() => setMode(THEME_MODES.DARK)}
                    title="Reset theme to default Dark mode"
                  >
                    <RefreshIcon size={12} /> Reset to Default Dark
                  </button>
                )}
              </div>
            </div>

            <div className="card" style={{ padding: 24 }}>
              {/* Asymmetric Studio Grid: Left = Material Specimen Canvas, Right = Mode & Palette Workbench */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, alignItems: 'start' }}>
                
                {/* Left Panel: Material Specimen & Typography Canvas */}
                <div style={{
                  background: 'var(--surface2)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)' }}>
                      Material Specimen
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10.5, color: 'var(--accent)', background: 'var(--accent-glow)', padding: '2px 8px', borderRadius: 4 }}>
                      Active Root Styles
                    </span>
                  </div>

                  {/* Editorial Typography Specimen */}
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Editorial Display Font (Newsreader)
                    </div>
                    <div style={{ fontFamily: 'var(--font-serif, "Newsreader", Georgia, serif)', fontSize: 22, fontWeight: 500, color: 'var(--text)', lineHeight: 1.25, letterSpacing: '-0.01em' }}>
                      The Art of Thoughtful Correspondence
                    </div>
                  </div>

                  {/* UI Body Specimen */}
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Humanist UI Sans (Plus Jakarta Sans)
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
                      MailMind synthesizes high-signal inbox intelligence with contextual craftsmanship. Natural phrasing, human cadences, and zero generic boilerplate.
                    </p>
                  </div>

                  {/* Live Interactive Sample Email Preview Card */}
                  <div style={{
                    background: 'var(--surface)',
                    borderRadius: 'var(--radius)',
                    padding: 14,
                    border: '1px solid var(--border2)',
                    boxShadow: 'var(--shadow)',
                    marginTop: 4
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'var(--accent)', color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: 13
                        }}>
                          AM
                        </div>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>
                            Alex Morgan
                          </div>
                          <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                            Quarterly Strategy Review
                          </div>
                        </div>
                      </div>
                      <span className="badge badge-low" style={{ fontSize: 10.5 }}>Medium</span>
                    </div>

                    <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                      Reviewed the revised scope. Let us sync tomorrow to finalize delivery checkpoints.
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                      <span className="badge badge-purple" style={{ fontSize: 10.5 }}>Draft Prepared</span>
                      <button type="button" className="btn btn-primary btn-sm" style={{ fontSize: 11.5, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <SendIcon size={12} /> Send Reply
                      </button>
                    </div>
                  </div>

                  {/* Active Tokens Monospace Strip */}
                  <div style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: 10.5,
                    color: 'var(--muted2)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                    paddingTop: 8,
                    borderTop: '1px solid var(--border)'
                  }}>
                    <span>accent: <strong style={{ color: 'var(--text)' }}>{theme.customSettings?.accent || (theme.mode === 'light' ? '#b4512b' : '#c4683c')}</strong></span>
                    <span>radius: <strong style={{ color: 'var(--text)' }}>{theme.customSettings?.radius || '10px'}</strong></span>
                  </div>
                </div>

                {/* Right Panel: Modes & Curated Artisanal Presets */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  
                  {/* Mode Selector Row */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 10 }}>
                      Theme Mode
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                      
                      {/* Dark Mode Tile */}
                      <button
                        type="button"
                        onClick={() => setMode(THEME_MODES.DARK)}
                        style={{
                          background: theme.mode === THEME_MODES.DARK ? 'var(--accent-glow)' : 'var(--surface2)',
                          border: `1.5px solid ${theme.mode === THEME_MODES.DARK ? 'var(--accent)' : 'var(--border)'}`,
                          borderRadius: 'var(--radius)',
                          padding: '12px 10px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 6,
                          textAlign: 'center',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <MoonIcon size={18} style={{ color: theme.mode === THEME_MODES.DARK ? 'var(--accent)' : 'var(--muted)' }} />
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>Graphite Dark</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#131518', border: '1px solid rgba(255,255,255,0.15)' }} />
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#c4683c' }} />
                        </div>
                      </button>

                      {/* Light Mode Tile */}
                      <button
                        type="button"
                        onClick={() => setMode(THEME_MODES.LIGHT)}
                        style={{
                          background: theme.mode === THEME_MODES.LIGHT ? 'var(--accent-glow)' : 'var(--surface2)',
                          border: `1.5px solid ${theme.mode === THEME_MODES.LIGHT ? 'var(--accent)' : 'var(--border)'}`,
                          borderRadius: 'var(--radius)',
                          padding: '12px 10px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 6,
                          textAlign: 'center',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <SunIcon size={18} style={{ color: theme.mode === THEME_MODES.LIGHT ? 'var(--accent)' : 'var(--muted)' }} />
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>Archival Linen</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f6f5f0', border: '1px solid rgba(0,0,0,0.15)' }} />
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#b4512b' }} />
                        </div>
                      </button>

                      {/* Custom Mode Tile */}
                      <button
                        type="button"
                        onClick={() => setMode(THEME_MODES.CUSTOM)}
                        style={{
                          background: theme.mode === THEME_MODES.CUSTOM ? 'var(--accent-glow)' : 'var(--surface2)',
                          border: `1.5px solid ${theme.mode === THEME_MODES.CUSTOM ? 'var(--accent)' : 'var(--border)'}`,
                          borderRadius: 'var(--radius)',
                          padding: '12px 10px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 6,
                          textAlign: 'center',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <SlidersIcon size={18} style={{ color: theme.mode === THEME_MODES.CUSTOM ? 'var(--accent)' : 'var(--muted)' }} />
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>Artisanal Studio</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#388e68' }} />
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#467694' }} />
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#b37930' }} />
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Artisanal Curated Presets */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 10 }}>
                      Curated Palettes
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {CUSTOM_PRESETS.map((p) => {
                        const isSelected = theme.preset === p.id && (!theme.customSettings || theme.customSettings._usePresetValues !== false);
                        return (
                          <div
                            key={p.id}
                            onClick={() => setPreset(p.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 14px',
                              borderRadius: 'var(--radius)',
                              background: isSelected ? 'var(--accent-glow)' : 'var(--surface2)',
                              border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                              <span style={{
                                width: 14, height: 14, borderRadius: '50%',
                                background: p.accent, flexShrink: 0,
                                border: '1px solid rgba(255,255,255,0.2)'
                              }} />
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                                  {p.name}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {p.desc}
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0, marginLeft: 8 }}>
                              <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.bg, border: '1px solid rgba(255,255,255,0.15)' }} />
                              {isSelected && <CheckIcon size={14} style={{ color: 'var(--accent)', marginLeft: 4 }} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Mode Fine-Tuning Controls */}
                  {theme.mode === THEME_MODES.CUSTOM && (
                    <div className="fade-in" style={{
                      background: 'var(--surface2)',
                      borderRadius: 'var(--radius)',
                      padding: 16,
                      border: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14
                    }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>
                        Palette Customizer
                      </div>

                      {/* Accent Color Swatches */}
                      <div>
                        <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 8 }}>
                          Accent Swatch
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 10 }}>
                          {ACCENT_SWATCHES.map((swatch) => {
                            const currentAccent = (theme.customSettings?.accent || '').toLowerCase();
                            const isCur = currentAccent === swatch.hex.toLowerCase();
                            return (
                              <button
                                key={swatch.hex}
                                type="button"
                                onClick={() => {
                                  updateTheme({
                                    mode: THEME_MODES.CUSTOM,
                                    customSettings: {
                                      ...theme.customSettings,
                                      _usePresetValues: false,
                                      accent: swatch.hex,
                                      accentHover: swatch.hex,
                                      accentGlow: hexToRgba(swatch.hex, 0.16)
                                    }
                                  });
                                }}
                                title={swatch.name}
                                style={{
                                  height: 28,
                                  borderRadius: 6,
                                  background: swatch.hex,
                                  border: isCur ? '2px solid var(--text)' : '1px solid rgba(0,0,0,0.2)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#fff'
                                }}
                              >
                                {isCur && <CheckIcon size={12} />}
                              </button>
                            );
                          })}
                        </div>

                        {/* Hex Picker Input */}
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input
                            type="color"
                            value={theme.customSettings?.accent || '#c4683c'}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateTheme({
                                mode: THEME_MODES.CUSTOM,
                                customSettings: {
                                  ...theme.customSettings,
                                  _usePresetValues: false,
                                  accent: val,
                                  accentHover: val,
                                  accentGlow: hexToRgba(val, 0.16)
                                }
                              });
                            }}
                            style={{
                              width: 34,
                              height: 32,
                              padding: 2,
                              borderRadius: 6,
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                              cursor: 'pointer'
                            }}
                            title="Pick custom hex color"
                          />
                          <input
                            type="text"
                            value={theme.customSettings?.accent || '#c4683c'}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateTheme({
                                mode: THEME_MODES.CUSTOM,
                                customSettings: {
                                  ...theme.customSettings,
                                  _usePresetValues: false,
                                  accent: val,
                                  accentHover: val,
                                  accentGlow: hexToRgba(val, 0.16)
                                }
                              });
                            }}
                            placeholder="#c4683c"
                            style={{
                              flex: 1,
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                              borderRadius: 6,
                              padding: '6px 10px',
                              color: 'var(--text)',
                              fontSize: 12,
                              fontFamily: 'var(--font-mono, monospace)'
                            }}
                          />
                        </div>
                      </div>

                      {/* Background Tone Selector */}
                      <div>
                        <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 8 }}>
                          Background Slate Tone
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                          {BACKGROUND_TONES.slice(0, 4).map((tone) => {
                            const isSel = (theme.customSettings?.bgToneId || 'dark-default') === tone.id;
                            return (
                              <button
                                key={tone.id}
                                type="button"
                                onClick={() => {
                                  updateTheme({
                                    mode: THEME_MODES.CUSTOM,
                                    customSettings: {
                                      ...theme.customSettings,
                                      _usePresetValues: false,
                                      bgToneId: tone.id
                                    }
                                  });
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  padding: '6px 10px',
                                  borderRadius: 6,
                                  background: isSel ? 'var(--accent-glow)' : 'var(--surface)',
                                  border: `1px solid ${isSel ? 'var(--accent)' : 'var(--border)'}`,
                                  color: 'var(--text)',
                                  fontSize: 11.5,
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  textAlign: 'left'
                                }}
                              >
                                <span style={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: '50%',
                                  background: tone.color,
                                  border: '1px solid rgba(128,128,128,0.4)',
                                  flexShrink: 0
                                }} />
                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {tone.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

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
                    if (!acc || !acc.email) return null;
                    const isActive = user?.email && acc.email.toLowerCase() === user.email.toLowerCase();
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
                            <div style={{ fontSize: 11.5, color: 'var(--muted)', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                              <ProviderIcon provider={acc.provider || acc.email} size={12} />
                              <span>{acc.email} ({providerLabels[acc.provider] || acc.provider || 'email'})</span>
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
                                try {
                                  await switchActiveAccount(acc);
                                  refreshAccountsList();
                                } catch (switchErr) {
                                  console.error('Failed to switch account:', switchErr);
                                }
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
                              <CloseIcon size={12} />
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

          {/* App Passwords & Security Helper Section */}
          <Section title="App Passwords and Mailbox Security">
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
                    Manual App Password Setup and Security Assistant
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>
                    Generate a 16-character App Password manually inside Google Account Security to keep MailMind connected without errors.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => openAppPasswordModal('generator')}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, padding: '7px 14px' }}
                  >
                    <KeyIcon size={14} /> Generate App Password
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => openAppPasswordModal('recovery')}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, padding: '7px 12px' }}
                  >
                    <RefreshIcon size={14} /> Account Recovery
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => openAppPasswordModal('guide')}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, padding: '7px 12px' }}
                  >
                    <DocumentIcon size={14} /> Setup Guide
                  </button>
                </div>
              </div>

              {/* Google App Passwords Direct Banner */}
              <div style={{
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '14px 18px',
                marginBottom: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap'
              }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <KeyIcon size={15} style={{ color: 'var(--accent)' }} />
                    Google App Password Generator and Setup (Any Email)
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3, lineHeight: 1.45 }}>
                    No email is restricted. Generate a standard 16-character Google-format App Password directly here, or create one in Google Security.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      const pwd = generateAppPassword({ format: 'spaced', length: 16 });
                      setNewAccountPassword(pwd);
                      setShowNewAccountPassword(true);
                      setPwdUpdateSuccess('16-character Google App Password generated. Click "Save Password" below to apply.');
                      setTimeout(() => setPwdUpdateSuccess(''), 4000);
                    }}
                    style={{ fontSize: 12, padding: '7px 14px', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', fontWeight: 600 }}
                  >
                    <KeyIcon size={13} /> Generate Password
                  </button>
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: 12, padding: '7px 14px', borderRadius: 8, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}
                  >
                    <span>Google Console ↗</span>
                  </a>
                </div>
              </div>

              {/* Manual Password Update Form */}
              <div style={{
                background: 'var(--surface2)',
                borderRadius: 'var(--radius)',
                padding: '18px 20px',
                border: '1px solid var(--border)',
                marginBottom: 20
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                  Update Password / App Password for Active Account ({user?.email || 'Current Account'}):
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
                  Paste or generate the 16-character App Password (spaces like <code style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono, monospace)' }}>abcd efgh ijkl mnop</code> will be normalized automatically).
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
                    <input
                      type={showNewAccountPassword ? 'text' : 'password'}
                      placeholder="Paste or generate 16-character code (e.g. abcd efgh ijkl mnop)"
                      value={newAccountPassword}
                      onChange={(e) => setNewAccountPassword(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        padding: '9px 44px 9px 12px',
                        color: 'var(--text)',
                        fontSize: 13.5,
                        fontFamily: showNewAccountPassword ? 'var(--font-mono, monospace)' : 'inherit',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewAccountPassword(!showNewAccountPassword)}
                      style={{
                        position: 'absolute',
                        right: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        color: 'var(--muted)',
                        padding: '2px 4px'
                      }}
                    >
                      {showNewAccountPassword ? 'HIDE' : 'SHOW'}
                    </button>
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      const pwd = generateAppPassword({ format: 'spaced', length: 16 });
                      setNewAccountPassword(pwd);
                      setShowNewAccountPassword(true);
                      setPwdUpdateSuccess('16-character Google App Password generated. Click "Save to Active Account" to apply.');
                      setTimeout(() => setPwdUpdateSuccess(''), 3000);
                    }}
                    style={{ fontSize: 12.5, padding: '8px 14px', borderRadius: 8, whiteSpace: 'nowrap' }}
                  >
                    Quick Generate
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={async () => {
                      const clean = cleanAppPassword(newAccountPassword);
                      if (!clean || !user) {
                        setPwdUpdateError('Please enter a valid password or App Password.');
                        return;
                      }
                      setSavingNewPassword(true);
                      setPwdUpdateError('');
                      setPwdUpdateSuccess('');
                      try {
                        const updatedUser = { ...user, password: clean };
                        setUser(updatedUser);
                        localStorage.setItem('mailmind_user', JSON.stringify(updatedUser));
                        addOrUpdateAccount(updatedUser);
                        updateAccountPassword(user.email, clean);

                        try {
                          await fetch('/api/auth/profile', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ password: clean })
                          });
                        } catch {
                          await fetch('http://localhost:3002/api/auth/profile', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ password: clean })
                          });
                        }

                        setPwdUpdateSuccess(`Applied new App Password (${clean.slice(0, 4)}••••) to ${user.email}`);
                        setNewAccountPassword('');
                        setTimeout(() => setPwdUpdateSuccess(''), 3500);
                      } catch (err) {
                        setPwdUpdateError('Failed to apply password: ' + err.message);
                      } finally {
                        setSavingNewPassword(false);
                      }
                    }}
                    disabled={savingNewPassword || !newAccountPassword.trim()}
                    style={{ fontSize: 12, padding: '9px 16px', borderRadius: 8, fontWeight: 600 }}
                  >
                    {savingNewPassword ? 'Updating…' : 'Save to Active Account'}
                  </button>
                </div>
              </div>

              {/* Password Feedback Banners */}
              {pwdUpdateSuccess && (
                <div style={{
                  background: 'rgba(34, 197, 94, 0.12)',
                  border: '1px solid var(--success)',
                  color: '#86efac',
                  fontSize: 12.5,
                  padding: '9px 14px',
                  borderRadius: 8,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <CheckIcon size={14} /> {pwdUpdateSuccess}
                </div>
              )}
              {pwdUpdateError && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid var(--danger)',
                  color: '#fca5a5',
                  fontSize: 12.5,
                  padding: '9px 14px',
                  borderRadius: 8,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <CloseIcon size={14} /> {pwdUpdateError}
                </div>
              )}

              {/* Direct Provider Links Grid */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                  Official Provider App Password Consoles &amp; Recovery:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                  {PROVIDER_LIST.filter(p => p.appPasswordUrl).map((p) => (
                    <a
                      key={p.id}
                      href={p.appPasswordUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: 'var(--surface2)',
                        borderRadius: 10,
                        border: '1px solid var(--border)',
                        color: 'var(--text)',
                        textDecoration: 'none',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ProviderIcon provider={p.id} size={18} />
                        <span style={{ fontSize: 12.5, fontWeight: 600 }}>{p.shortName || p.name}</span>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--accent)' }}>Open ↗</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {/* Reply Preferences */}
          <Section title="AI Reply Preferences">
            <Row label="Reply tone" desc="Applied to all AI-drafted replies">
              <div style={{ display: 'flex', gap: 8 }}>
                {tones.map(t => (
                  <button
                    key={t.id}
                    type="button"
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

            <Row
              label="Email Signature / Sign-off (Optional)"
              desc="Appended to the bottom of all AI-drafted replies and automated sends"
            >
              <textarea
                value={signature}
                onChange={e => setSignature(e.target.value)}
                placeholder="Best regards,&#10;Alex Morgan"
                rows={3}
                style={{
                  width: '100%',
                  maxWidth: 360,
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  color: 'var(--text)',
                  fontSize: 13,
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
            </Row>
          </Section>

          {/* Monitoring Mode & Agent Reply Policy */}
          <Section title="Agent Monitoring and Reply Policy">
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
                    Inbox Monitoring and Reply Policy
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>
                    Choose whether MailMind must ask for permission before sending replies, or if it can reply autonomously.
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setMonitoringModalOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12.5,
                    padding: '6px 14px',
                    fontWeight: 600
                  }}
                  title="Open pop-up to switch monitoring mode"
                >
                  <SlidersIcon size={14} /> Open Mode Dialog
                </button>
              </div>

              {/* 2 Selectable Mode Cards Directly on Settings Page */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                {/* Option 1: Ask Permission */}
                <div
                  onClick={() => handleSaveMonitoringMode('ask_permission')}
                  style={{
                    background: (monitoringMode !== 'auto_reply' && monitoringMode !== 'without_permission')
                      ? 'var(--accent-glow)'
                      : 'var(--surface2)',
                    border: `1.5px solid ${(monitoringMode !== 'auto_reply' && monitoringMode !== 'without_permission') ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius)',
                    padding: '18px 20px',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 12
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: 'var(--surface)', border: '1px solid var(--border)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <ShieldCheckIcon size={20} style={{ color: 'var(--accent)' }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>
                            Ask Permission
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                            Permission-First Mode
                          </div>
                        </div>
                      </div>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%',
                        border: `1.5px solid ${(monitoringMode !== 'auto_reply' && monitoringMode !== 'without_permission') ? 'var(--accent)' : 'var(--muted)'}`,
                        background: (monitoringMode !== 'auto_reply' && monitoringMode !== 'without_permission') ? 'var(--accent)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 11, fontWeight: 'bold'
                      }}>
                        {(monitoringMode !== 'auto_reply' && monitoringMode !== 'without_permission') ? <CheckIcon size={12} /> : null}
                      </div>
                    </div>
                    <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: 0, lineHeight: 1.45 }}>
                      The AI prepares draft replies. No email is dispatched without your explicit review and one-click approval in your Inbox.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span className="badge badge-low" style={{ fontSize: 10.5 }}>Strict Approval</span>
                    <span className="badge" style={{ fontSize: 10.5, background: 'var(--surface)', border: '1px solid var(--border)' }}>Review Drafts First</span>
                  </div>
                </div>

                {/* Option 2: Reply Without Permission */}
                <div
                  onClick={() => handleSaveMonitoringMode('auto_reply')}
                  style={{
                    background: (monitoringMode === 'auto_reply' || monitoringMode === 'without_permission')
                      ? 'var(--accent-glow)'
                      : 'var(--surface2)',
                    border: `1.5px solid ${(monitoringMode === 'auto_reply' || monitoringMode === 'without_permission') ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius)',
                    padding: '18px 20px',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 12
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: 'var(--surface)', border: '1px solid var(--border)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <SendIcon size={18} style={{ color: 'var(--accent)' }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>
                            Without Permission
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                            Autonomous Mode
                          </div>
                        </div>
                      </div>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%',
                        border: `1.5px solid ${(monitoringMode === 'auto_reply' || monitoringMode === 'without_permission') ? 'var(--accent)' : 'var(--muted)'}`,
                        background: (monitoringMode === 'auto_reply' || monitoringMode === 'without_permission') ? 'var(--accent)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 11, fontWeight: 'bold'
                      }}>
                        {(monitoringMode === 'auto_reply' || monitoringMode === 'without_permission') ? <CheckIcon size={12} /> : null}
                      </div>
                    </div>
                    <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: 0, lineHeight: 1.45 }}>
                      The AI agent continuously monitors your mailbox, creates responses matching your tone, and automatically dispatches replies via SMTP.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span className="badge badge-purple" style={{ fontSize: 10.5 }}>Autonomous Send</span>
                    <span className="badge" style={{ fontSize: 10.5, background: 'var(--surface)', border: '1px solid var(--border)' }}>Instant SMTP Dispatch</span>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* Notifications */}
          <Section title="Notifications and Device Alerts">
            <Row
              label="Device & Desktop Notifications"
              desc="Allow the MailMind agent to send native OS desktop notifications to your device when new emails or drafts arrive"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {browserPermission === 'granted' ? (
                  <span className="badge badge-low" style={{ fontSize: 11, padding: '3px 8px' }}>● Granted</span>
                ) : browserPermission === 'denied' ? (
                  <span className="badge badge-high" style={{ fontSize: 11, padding: '3px 8px' }}>● Blocked in Browser</span>
                ) : (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleRequestPermission}
                    style={{ fontSize: 12, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5 }}
                  >
                    <BellIcon size={13} /> Grant Permission
                  </button>
                )}
                <Toggle value={deviceNotifications} onChange={handleToggleDeviceNotifications} />
              </div>
            </Row>

            <Row
              label="Notification sound chime"
              desc="Play a gentle synthesizer chime alert on your device when notifications arrive"
            >
              <Toggle value={notifSound} onChange={setNotifSound} />
            </Row>

            <Row
              label="Smart notification filter"
              desc="Only send device notifications for actionable emails and high-urgency messages"
            >
              <Toggle value={highUrgencyOnly} onChange={setHighUrgencyOnly} />
            </Row>

            <Row
              label="In-app notification bell"
              desc="Display real-time badge and notification history in the sidebar"
            >
              <Toggle value={inApp} onChange={setInApp} />
            </Row>

            <Row
              label="Daily digest email"
              desc="Morning executive summary sent directly to your inbox"
            >
              <Toggle value={digest} onChange={setDigest} />
            </Row>

            <Row
              label="Test Device Notification"
              desc="Send an instant test notification to verify delivery on this device"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {notifStatusMsg && (
                  <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>
                    {notifStatusMsg}
                  </span>
                )}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleTestNotification}
                  disabled={testingNotif}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}
                >
                  <BellIcon size={14} />
                  <span>{testingNotif ? 'Sending...' : 'Send Test Notification'}</span>
                </button>
              </div>
            </Row>

            <Row
              label="Push Webhook / External Device URL (Optional)"
              desc="Forward notifications to mobile or custom services (e.g. ntfy.sh, Pushover, Discord, Slack webhook)"
            >
              <input
                type="url"
                placeholder="https://ntfy.sh/your-topic or webhook URL"
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
                style={{
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '7px 12px',
                  color: 'var(--text)',
                  fontSize: 13,
                  width: '100%',
                  maxWidth: 320
                }}
              />
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

          {/* Data Governance & Legal Compliance */}
          <Section title="Data Governance and Privacy Protections">
            <Row
              label="Legal Protections & Terms of Service"
              desc="MailMind adheres to strict zero-retention principles. All email data is processed ephemerally in-memory and never used for model training."
            >
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setLegalModalTab('privacy');
                    setLegalModalOpen(true);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}
                >
                  <ShieldCheckIcon size={14} /> Privacy Policy
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setLegalModalTab('terms');
                    setLegalModalOpen(true);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}
                >
                  <DocumentIcon size={14} /> Terms of Service
                </button>
              </div>
            </Row>
            <Row
              label="Client Session & Memory Cache"
              desc="Draft suggestions and temporary vector indices stored in your browser session"
            >
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    sessionStorage.clear();
                    alert('Session cache cleared successfully.');
                  }
                }}
                style={{ fontSize: 12, color: 'var(--muted)' }}
              >
                Clear Local Session
              </button>
            </Row>
          </Section>

          {/* Sticky Save Bar */}
          <div style={{
            position: 'sticky',
            bottom: 0,
            padding: '16px 20px 24px',
            background: 'linear-gradient(to top, var(--bg, #131518) 80%, transparent)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 14,
            zIndex: 10,
            borderTop: '1px solid var(--border)',
            marginTop: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {saved ? (
                <span className="badge badge-low fade-in" style={{ fontSize: 13, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckIcon size={14} /> Settings saved successfully
                </span>
              ) : (
                <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                  Preferences update your profile and AI agent behavior.
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
                style={{
                  minWidth: 150,
                  padding: '10px 22px',
                  fontSize: 14,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                {saving ? (
                  <>
                    <span className="spinner" style={{ width: 14, height: 14 }} />
                    <span>Saving changes…</span>
                  </>
                ) : (
                  <>
                    <CheckIcon size={15} />
                    <span>Save changes</span>
                  </>
                )}
              </button>
            </div>
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

      {monitoringModalOpen && (
        <MonitoringModeModal
          isOpen={monitoringModalOpen}
          currentMode={monitoringMode}
          user={user}
          onClose={() => setMonitoringModalOpen(false)}
          onSave={handleSaveMonitoringMode}
        />
      )}

      {appPasswordModalOpen && (
        <AppPasswordModal
          isOpen={appPasswordModalOpen}
          initialProvider={user?.provider || 'google'}
          initialTab={appPasswordModalTab}
          userEmail={user?.email}
          onClose={() => setAppPasswordModalOpen(false)}
          onSelectPassword={(pwd) => {
            setNewAccountPassword(pwd);
            setPwdUpdateSuccess('App Password applied to field! Click Save to apply.');
            setTimeout(() => setPwdUpdateSuccess(''), 3000);
          }}
        />
      )}

      <LegalModal
        isOpen={legalModalOpen}
        initialTab={legalModalTab}
        onClose={() => setLegalModalOpen(false)}
      />
    </div>
  );
}
