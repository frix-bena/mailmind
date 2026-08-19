'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { mockNotifications } from '@/lib/mockData';

export default function Sidebar({ user }) {
  const pathname = usePathname();
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);

  const unread = notifications.filter(n => !n.read).length;

  const nav = [
    { href: '/inbox',    icon: '📥', label: 'Inbox',    badge: 3 },
    { href: '/search',   icon: '🔍', label: 'Ask Inbox', badge: null },
    { href: '/terminal', icon: '💻', label: 'Terminal',  badge: null },
    { href: '/settings', icon: '⚙️',  label: 'Settings',  badge: null },
  ];

  const markAllRead = () => setNotifications(n => n.map(x => ({ ...x, read: true })));

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">✉️</div>
          <div className="sidebar-logo-text">Mail<span>Mind</span></div>
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
                  <span
                    style={{ fontSize: 12, color: 'var(--accent)', cursor: 'pointer' }}
                    onClick={markAllRead}
                  >Mark all read</span>
                </div>
                {notifications.map(n => (
                  <div key={n.id} style={{
                    display: 'flex', gap: 10, padding: '8px 0',
                    borderBottom: '1px solid var(--border)',
                    opacity: n.read ? 0.55 : 1,
                  }}>
                    <span style={{ fontSize: 16 }}>{n.type === 'sent' ? '✅' : '📩'}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: n.read ? 400 : 600 }}>{n.text}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{n.time}</div>
                    </div>
                    {!n.read && <span className="notif-dot" style={{ marginLeft: 'auto', marginTop: 6 }} />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {user && (
            <div className="user-chip">
              <div className="user-avatar">{user.name[0]}</div>
              <div className="user-info">
                <div className="user-name">{user.name}</div>
                <div className="user-email">{user.email}</div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
