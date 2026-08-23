'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import EmailAvatar from '@/components/EmailAvatar';
import ComposeModal from '@/components/ComposeModal';
import GoogleAccountModal from '@/components/GoogleAccountModal';
import { extractDisplayName } from '@/lib/avatar-utils';

export default function Sidebar({ user: propUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(propUser || null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 'n1', type: 'connected', text: 'Email inbox connected & monitoring', time: 'Just now', read: false },
    { id: 'n2', type: 'system', text: 'Permission-first reply protection active', time: 'Just now', read: false }
  ]);

  useEffect(() => {
    if (propUser && propUser.email) {
      setUser(propUser);
    } else {
      try {
        const stored = JSON.parse(localStorage.getItem('mailmind_user') || 'null');
        if (stored && stored.email) {
          setUser(stored);
        }
      } catch {
        // ignore
      }

      fetch('/api/auth/status')
        .then(res => res.json())
        .then(data => {
          if (data && data.connected && data.email) {
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

  const unread = notifications.filter(n => !n.read).length;

  const nav = [
    { href: '/inbox',    icon: '📥', label: 'Inbox',     badge: null },
    { href: '/terminal', icon: '🤖', label: 'AI Agent',  badge: 'Live' },
    { href: '/search',   icon: '🔍', label: 'Ask Inbox', badge: null },
    { href: '/settings', icon: '⚙️',  label: 'Settings',  badge: null },
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
      <aside className="sidebar">
        <div
          className="sidebar-logo"
          onClick={() => router.push('/inbox')}
          style={{ cursor: 'pointer' }}
          title="Go to Inbox"
        >
          <div className="sidebar-logo-icon">✉️</div>
          <div className="sidebar-logo-text">Mail<span>Mind</span></div>
        </div>

        {/* Quick Compose Action Button */}
        <div style={{ padding: '16px 12px 0' }}>
          <button
            className="btn btn-primary"
            onClick={() => setComposeOpen(true)}
            style={{ width: '100%', fontSize: 13, padding: '9px 14px', borderRadius: 8 }}
          >
            ✏️ New Email
          </button>
        </div>

        <nav className="sidebar-nav">
          {nav.map(item => (
            <a
              key={item.href}
              className={`nav-item${pathname === item.href ? ' active' : ''}`}
              href={item.href}
              onClick={e => { e.preventDefault(); router.push(item.href); }}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </a>
          ))}
        </nav>

        <div className="sidebar-bottom">
          {/* Notification bell */}
          <div style={{ position: 'relative', marginBottom: 8 }}>
            <div
              className="nav-item"
              onClick={() => setNotifOpen(o => !o)}
              style={{ cursor: 'pointer' }}
            >
              <span className="nav-icon">🔔</span>
              Notifications
              {unread > 0 && <span className="nav-badge">{unread}</span>}
            </div>
            {notifOpen && (
              <div style={{
                position: 'absolute', bottom: '110%', left: 0, right: 0,
                background: 'var(--surface)', border: '1px solid var(--border2)',
                borderRadius: 'var(--radius)', padding: 16,
                boxShadow: 'var(--shadow-lg)', zIndex: 200,
                minWidth: 280,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>Notifications</span>
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
                        display: 'flex', gap: 10, padding: '8px 0',
                        borderBottom: '1px solid var(--border)',
                        opacity: n.read ? 0.55 : 1,
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{n.type === 'sent' ? '✅' : '📩'}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: n.read ? 400 : 600 }}>{n.text}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{n.time}</div>
                      </div>
                      {!n.read && <span className="notif-dot" style={{ marginLeft: 'auto', marginTop: 6 }} />}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* User profile clickable chip with real Gmail avatar and Google Account modal */}
          {user && user.email && (
            <div
              className="user-chip"
              onClick={() => setUserModalOpen(true)}
              title="Google Account: Click to customize profile picture and view details"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 12,
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
            >
              <EmailAvatar
                src={userAvatarSrc}
                email={user.email}
                name={displayName}
                size={36}
                isUser={true}
                color={userAvatarColor}
                showTooltip={false}
                style={{
                  border: '1.5px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.25)'
                }}
              />
              <div className="user-info">
                <div className="user-name" style={{ fontFamily: '"Google Sans", "Product Sans", Roboto, system-ui, sans-serif' }}>
                  {displayName}
                </div>
                <div className="user-email">{user.email}</div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {userModalOpen && (
        <GoogleAccountModal
          user={user}
          onClose={() => setUserModalOpen(false)}
          onOpenCompose={() => setComposeOpen(true)}
          onDisconnect={handleDisconnect}
          onUserUpdate={(updatedUser) => {
            setUser(updatedUser);
          }}
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
          }}
        />
      )}
    </>
  );
}
