'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import EmailCard from '@/components/EmailCard';
import { mockEmails, mockUser } from '@/lib/mockData';

const FILTERS = ['All', 'Needs Reply', 'No Reply Needed', 'Replied'];

export default function InboxPage() {
  const [emails, setEmails] = useState(mockEmails);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [newBanner, setNewBanner] = useState(true);
  const [pollingBadge, setPollingBadge] = useState('Checking…');

  // Simulate polling status
  useEffect(() => {
    const timers = [
      setTimeout(() => setPollingBadge('Up to date'), 2000),
      setTimeout(() => {
        // Simulate a new email arriving
        setPollingBadge('1 new email'),
        setTimeout(() => setPollingBadge('Up to date'), 4000);
      }, 12000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleAction = (emailId, action) => {
    setEmails(prev => prev.map(e =>
      e.id === emailId
        ? { ...e, draft: e.draft ? { ...e.draft, status: action === 'sent' ? 'sent' : 'declined' } : e.draft }
        : e
    ));
  };

  const filtered = emails.filter(e => {
    const matchSearch = !search || [e.subject, e.sender_name, e.ai_summary].some(s => s.toLowerCase().includes(search.toLowerCase()));
    if (!matchSearch) return false;
    if (filter === 'Needs Reply')    return e.needs_reply && e.draft?.status === 'pending_approval';
    if (filter === 'No Reply Needed') return !e.needs_reply;
    if (filter === 'Replied')        return e.draft?.status === 'sent';
    return true;
  });

  const pending = emails.filter(e => e.needs_reply && e.draft?.status === 'pending_approval').length;

  return (
    <div className="app-shell">
      <Sidebar user={mockUser} />
      <div className="main-area">
        <div className="topbar">
          <span className="topbar-title">📥 Inbox</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="chip" style={{ fontSize: 12 }}>
              <span className="notif-dot" style={{ width: 6, height: 6 }} />
              {pollingBadge}
            </span>
            {pending > 0 && (
              <span className="badge badge-purple">
                {pending} awaiting approval
              </span>
            )}
          </div>
        </div>

        <div className="page-content">
          {/* New-email banner */}
          {newBanner && (
            <div className="fade-in" style={{
              background: 'var(--accent-glow)', border: '1px solid var(--accent)',
              borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: 18 }}>📬</span>
              <div style={{ flex: 1, fontSize: 14 }}>
                <strong>6 new emails</strong> arrived. 2 need your reply — drafts are ready below.
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setNewBanner(false)}>Dismiss</button>
            </div>
          )}

          {/* Search bar */}
          <input
            className="input"
            placeholder='🔍  Search emails…'
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ marginBottom: 16 }}
          />

          {/* Filter chips */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="btn btn-sm"
                style={{
                  background: filter === f ? 'var(--accent)' : 'var(--surface)',
                  color: filter === f ? '#fff' : 'var(--muted)',
                  border: `1px solid ${filter === f ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 20, padding: '6px 16px',
                }}
              >{f}</button>
            ))}
          </div>

          {/* Email list */}
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <h3>No emails match this filter</h3>
              <p>Try a different filter or search term.</p>
            </div>
          ) : (
            filtered.map(email => (
              <EmailCard key={email.id} email={email} onAction={handleAction} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
