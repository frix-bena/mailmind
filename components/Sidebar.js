'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import EmailAvatar from '@/components/EmailAvatar';
import ComposeModal from '@/components/ComposeModal';
import GoogleAccountModal from '@/components/GoogleAccountModal';
import LegalModal from '@/components/LegalModal';
import ProviderIcon from '@/components/ProviderIcon';
import { extractDisplayName } from '@/lib/avatar-utils';
import { getActiveUser, isDemoAccount } from '@/lib/account-manager';
import { useTheme, THEME_MODES, CUSTOM_PRESETS } from '@/lib/theme-manager';
import { sendUnifiedDeviceNotification } from '@/lib/browser-notifications';
import {
  InboxIcon,
  SearchIcon,
  SettingsIcon,
  ComposeIcon,
  BellIcon,
  MailIcon,
  CheckIcon,
  CloseIcon,
  SunIcon,
  MoonIcon,
  PaletteIcon,
  ShieldCheckIcon,
  TerminalIcon
} from '@/components/Icons';

export default function Sidebar({ user: propUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(propUser || null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { theme, mode, preset, toggleNextMode } = useTheme();
  const [notifications, setNotifications] = useState([
    { id: 'n1', type: 'connected', text: 'Inbox connected and monitoring', time: 'Just now', read: false },
    { id: 'n2', type: 'system', text: 'Permission-first reply protection active', time: 'Just now', read: false }
  ]);

  useEffect(() => {
    if (propUser && propUser.email && !isDemoAccount(propUser)) {
      setUser(propUser);
    } else {
      const stored = getActiveUser();
      if (stored && stored.email && !isDemoAccount(stored)) {
        setUser(stored);
      }

      fetch('/api/auth/status')
        .then(res => res.json())
        .then(data => {
          if (data && data.connected && data.email && !isDemoAccount(data)) {
            setUser(prev => ({
              ...(prev || {}),
              ...data,
              name: prev?.name || data.name,
              avatar: prev?.avatar || prev?.picture || data.avatar || data.picture,
              picture: prev?.picture || prev?.avatar || data.picture || data.avatar,
              avatarColor: prev?.avatarColor || prev?.color || data.avatarColor || data.color,
              color: prev?.color || prev?.avatarColor || data.color || data.avatarColor
            }));
          }
        })
        .catch(() => {});
    }
  }, [propUser]);

  // Listen for global custom events from mobile hamburger buttons
  useEffect(() => {
    const handleToggle = () => setDrawerOpen(prev => !prev);
    const handleClose = () => setDrawerOpen(false);
    const handleOpenCompose = () => setComposeOpen(true);
    const handleAccountSwitched = (e) => {
      if (e.detail && e.detail.email) {
        setUser(e.detail);
      }
    };

    window.addEventListener('mailmind:toggle-drawer', handleToggle);
    window.addEventListener('mailmind:close-drawer', handleClose);
    window.addEventListener('mailmind:open-compose', handleOpenCompose);
    window.addEventListener('mailmind:account-switched', handleAccountSwitched);

    return () => {
      window.removeEventListener('mailmind:toggle-drawer', handleToggle);
      window.removeEventListener('mailmind:close-drawer', handleClose);
      window.removeEventListener('mailmind:open-compose', handleOpenCompose);
      window.removeEventListener('mailmind:account-switched', handleAccountSwitched);
    };
  }, []);

  // Prefetch main routes so clicks are instant
  useEffect(() => {
    router.prefetch('/inbox');
    router.prefetch('/terminal');
    router.prefetch('/search');
    router.prefetch('/settings');
  }, [router]);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const unread = notifications.filter(n => !n.read).length;

  const nav = [
    { href: '/inbox',    icon: InboxIcon,    label: 'Inbox',    badge: null },
    { href: '/terminal', icon: TerminalIcon, label: 'AI Agent', badge: 'Live' },
    { href: '/search',   icon: SearchIcon,   label: 'Ask AI',   badge: null },
    { href: '/settings', icon: SettingsIcon, label: 'Settings', badge: null },
  ];

  const markAllRead = () => setNotifications(n => n.map(x => ({ ...x, read: true })));
  const clearNotifications = () => setNotifications([]);

  const handleDisconnect = async () => {
    if (window.confirm('Disconnect your email account and log out?')) {
      try {
        try {
          await fetch('/api/auth/disconnect', { method: 'POST' });
        } catch {
          await fetch('http://localhost:3002/api/auth/disconnect', { method: 'POST' });
        }
      } catch {}
      localStorage.removeItem('mailmind_user');
      router.replace('/onboarding');
    }
  };

  const displayName = extractDisplayName(user?.name, user?.email);
  const userAvatarSrc = user?.avatar || user?.picture || user?.photoUrl || user?.image || null;
  const userAvatarColor = user?.avatarColor || user?.color || null;

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {drawerOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Navigation Sidebar / Drawer */}
      <aside className={`sidebar${drawerOpen ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <div
            onClick={() => { router.push('/inbox'); setDrawerOpen(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flex: 1 }}
            title="Go to Inbox"
          >
            <div className="sidebar-logo-icon">
              <MailIcon size={16} />
            </div>
            <div className="sidebar-logo-text">Mail<span>Mind</span></div>
          </div>
          {/* Mobile Close Button */}
          <button
            className="sidebar-close-btn"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation drawer"
          >
            <CloseIcon size={14} />
          </button>
        </div>

        {/* Quick Compose Action Button */}
        <div style={{ padding: '16px 12px 0' }}>
          <button
            className="btn btn-primary"
            onClick={() => { setComposeOpen(true); setDrawerOpen(false); }}
            style={{ width: '100%', fontSize: 13, padding: '9px 14px', borderRadius: 'var(--radius-sm)' }}
          >
            <ComposeIcon size={14} style={{ marginRight: 6 }} />
            New Email
          </button>
        </div>

        <nav className="sidebar-nav">
          {nav.map(item => {
            const IconComp = item.icon;
            const isActive = pathname === item.href;
            return (
              <a
                key={item.href}
                className={`nav-item${isActive ? ' active' : ''}`}
                href={item.href}
                onClick={e => {
                  e.preventDefault();
                  setDrawerOpen(false);
                  router.push(item.href);
                }}
              >
                <span className="nav-icon">
                  <IconComp size={16} />
                </span>
                {item.label}
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </a>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          {/* Notification bell */}
          <div style={{ position: 'relative', marginBottom: 6 }}>
            <div
              className="nav-item"
              onClick={() => setNotifOpen(o => !o)}
              style={{ cursor: 'pointer' }}
            >
              <span className="nav-icon">
                <BellIcon size={15} />
              </span>
              Notifications
              {unread > 0 && <span className="nav-badge">{unread}</span>}
            </div>
            {notifOpen && (
              <div style={{
                position: 'absolute', bottom: '110%', left: 0, right: 0,
                background: 'var(--surface)', border: '1px solid var(--border2)',
                borderRadius: 'var(--radius)', padding: 14,
                boxShadow: 'var(--shadow-lg)', zIndex: 200,
                minWidth: 260,
                maxWidth: 'calc(100vw - 32px)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>Notifications</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      style={{ background: 'none', border: 'none', fontSize: 11, color: 'var(--accent)', cursor: 'pointer' }}
                      onClick={markAllRead}
                    >
                      Mark read
                    </button>
                    <button
                      style={{ background: 'none', border: 'none', fontSize: 11, color: 'var(--muted)', cursor: 'pointer' }}
                      onClick={clearNotifications}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {notifications.length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: '12px 0' }}>
                    No notifications
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => setNotifications(list => list.map(item => item.id === n.id ? { ...item, read: true } : item))}
                      style={{
                        display: 'flex', gap: 8, padding: '8px 0',
                        borderBottom: '1px solid var(--border)',
                        opacity: n.read ? 0.55 : 1,
                        cursor: 'pointer',
                        alignItems: 'center'
                      }}
                    >
                      <span style={{ color: n.type === 'sent' ? 'var(--success)' : 'var(--accent)', flexShrink: 0 }}>
                        {n.type === 'sent' ? <CheckIcon size={14} /> : <MailIcon size={14} />}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: n.read ? 400 : 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.text}</div>
                        <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>{n.time}</div>
                      </div>
                      {!n.read && <span className="notif-dot" style={{ marginLeft: 'auto' }} />}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Quick Theme Switcher item */}
          <div
            className="nav-item"
            onClick={toggleNextMode}
            title={`Current theme: ${mode === THEME_MODES.CUSTOM ? (CUSTOM_PRESETS.find(p => p.id === preset)?.name || 'Custom') : mode}. Click to cycle Light / Dark / Custom.`}
            style={{ cursor: 'pointer', marginBottom: 6, padding: '7px 12px', borderRadius: 'var(--radius-sm)' }}
          >
            <span className="nav-icon">
              {mode === THEME_MODES.LIGHT ? (
                <SunIcon size={15} />
              ) : mode === THEME_MODES.CUSTOM ? (
                <PaletteIcon size={15} />
              ) : (
                <MoonIcon size={15} />
              )}
            </span>
            <span style={{ fontSize: 12.5, fontWeight: 500 }}>
              Theme: {mode === THEME_MODES.LIGHT ? 'Light' : mode === THEME_MODES.CUSTOM ? (CUSTOM_PRESETS.find(p => p.id === preset)?.name.split(' ')[0] || 'Custom') : 'Dark'}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--muted)', opacity: 0.8 }}>cycle</span>
          </div>

          {/* Real Legal & Privacy Policy shortcut */}
          <div
            className="nav-item"
            onClick={() => setLegalModalOpen(true)}
            style={{ cursor: 'pointer', marginBottom: 8, padding: '7px 12px', borderRadius: 'var(--radius-sm)', fontSize: 12 }}
            title="View Terms of Service and Privacy Policy"
          >
            <span className="nav-icon">
              <ShieldCheckIcon size={14} />
            </span>
            <span>Terms &amp; Privacy</span>
          </div>

          {/* User profile clickable chip */}
          {user && user.email && (
            <div
              className="user-chip"
              onClick={() => { setUserModalOpen(true); setDrawerOpen(false); }}
              title="Account settings and profile"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer'
              }}
            >
              <EmailAvatar
                src={userAvatarSrc}
                email={user.email}
                name={displayName}
                size={34}
                isUser={true}
                color={userAvatarColor}
                showTooltip={false}
                style={{
                  border: '1px solid var(--border2)'
                }}
              />
              <div className="user-info">
                <div className="user-name">
                  {displayName}
                </div>
                <div className="user-email" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <ProviderIcon provider={user.provider || user.email} size={11} />
                  <span>{user.email}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Android Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        <button
          type="button"
          className={`mobile-bottom-item${pathname === '/inbox' ? ' active' : ''}`}
          onClick={() => router.push('/inbox')}
          aria-label="Inbox"
        >
          <span className="mobile-bottom-icon">
            <InboxIcon size={17} />
          </span>
          <span className="mobile-bottom-label">Inbox</span>
          {unread > 0 && <span className="mobile-bottom-dot" />}
        </button>

        <button
          type="button"
          className={`mobile-bottom-item${pathname === '/terminal' || pathname === '/agent' ? ' active' : ''}`}
          onClick={() => router.push('/terminal')}
          aria-label="AI Agent"
        >
          <span className="mobile-bottom-icon">
            <TerminalIcon size={17} />
          </span>
          <span className="mobile-bottom-label">Agent</span>
        </button>

        <button
          type="button"
          className={`mobile-bottom-item${pathname === '/search' ? ' active' : ''}`}
          onClick={() => router.push('/search')}
          aria-label="Ask AI"
        >
          <span className="mobile-bottom-icon">
            <SearchIcon size={17} />
          </span>
          <span className="mobile-bottom-label">Ask AI</span>
        </button>

        <button
          type="button"
          className="mobile-bottom-compose-btn"
          onClick={() => setComposeOpen(true)}
          aria-label="New Email"
          title="Compose New Email"
        >
          <ComposeIcon size={17} />
        </button>

        <button
          type="button"
          className={`mobile-bottom-item${pathname === '/settings' ? ' active' : ''}`}
          onClick={() => router.push('/settings')}
          aria-label="Settings"
        >
          <span className="mobile-bottom-icon">
            <SettingsIcon size={17} />
          </span>
          <span className="mobile-bottom-label">Settings</span>
        </button>
      </nav>

      {userModalOpen && (
        <GoogleAccountModal
          user={user}
          onClose={() => setUserModalOpen(false)}
          onOpenCompose={() => setComposeOpen(true)}
          onDisconnect={handleDisconnect}
          onUserUpdate={(updatedUser) => {
            setUser(updatedUser);
          }}
          onAccountSwitch={(switchedUser) => {
            setUser(switchedUser);
          }}
        />
      )}

      {legalModalOpen && (
        <LegalModal
          isOpen={legalModalOpen}
          initialTab="terms"
          onClose={() => setLegalModalOpen(false)}
        />
      )}

      {composeOpen && (
        <ComposeModal
          user={user}
          onClose={() => setComposeOpen(false)}
          onSent={() => {
            setNotifications(n => [
              { id: `n_${Date.now()}`, type: 'sent', text: 'Email sent successfully via SMTP', time: 'Just now', read: false },
              ...n
            ]);
            sendUnifiedDeviceNotification({
              title: 'Email Sent',
              message: 'Your email was successfully sent via SMTP.',
              urgency: 'normal',
              category: 'reply',
              sound: false
            });
          }}
        />
      )}
    </>
  );
}
