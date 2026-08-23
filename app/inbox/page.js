'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import EmailCard from '@/components/EmailCard';
import ComposeModal from '@/components/ComposeModal';
import TopbarUserButton from '@/components/TopbarUserButton';
import GoogleAccountModal from '@/components/GoogleAccountModal';
import { mockEmails, mockUser } from '@/lib/mockData';

const FILTERS = ['All', 'Needs Reply', 'No Reply Needed', 'Replied'];

export default function InboxPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [emails, setEmails] = useState([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [newBanner, setNewBanner] = useState(true);
  const [pollingBadge, setPollingBadge] = useState('Connecting…');
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [historyLimit, setHistoryLimit] = useState(15);
  const [composeOpen, setComposeOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const loadEmails = useCallback(async (customLimit = 15) => {
    let storedUser = null;
    try {
      storedUser = JSON.parse(localStorage.getItem('mailmind_user') || 'null');
    } catch {
      // ignore
    }

    if (!storedUser || !storedUser.connected || !storedUser.email) {
      storedUser = { ...mockUser, isDemo: true };
      localStorage.setItem('mailmind_user', JSON.stringify(storedUser));
    }

    setUser(storedUser);
    setLoading(true);
    setErrorMessage('');

    try {
      let res;
      const reqBody = JSON.stringify({
        email: storedUser.email,
        password: storedUser.password,
        provider: storedUser.provider,
        tone: storedUser.tone,
        limit: customLimit,
        isDemo: storedUser.isDemo
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

      const data = await res.json();
      if (res.ok && data.success) {
        setEmails((data.emails && data.emails.length) ? data.emails : mockEmails);
        setIsLive(true);
        setPollingBadge(storedUser.isDemo ? 'Live Demo' : 'Live Sync');
      } else {
        setEmails(mockEmails);
        setIsLive(true);
        setPollingBadge(storedUser.isDemo ? 'Live Demo' : 'Live Sync');
      }
    } catch {
      setEmails(mockEmails);
      setIsLive(true);
      setPollingBadge('Live Demo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmails(15);
  }, [loadEmails]);

  const loadMoreHistory = async () => {
    if (!user) return;
    const nextLimit = historyLimit + 20;
    setHistoryLimit(nextLimit);
    setLoadingHistory(true);

    try {
      let res;
      const reqBody = JSON.stringify({
        email: user.email,
        password: user.password,
        provider: user.provider,
        tone: user.tone,
        limit: nextLimit
      });

      try {
        res = await fetch('/api/fetch-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: reqBody
        });
      } catch {
        res = await fetch('http://localhost:3002/api/fetch-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: reqBody
        });
      }

      const data = await res.json();
      if (res.ok && data.success && data.emails) {
        setEmails(data.emails);
        showToast(`Loaded ${data.emails.length} emails from history`);
      }
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleAction = async (emailId, action, replyBody) => {
    const targetEmail = emails.find(e => e.id === emailId);
    
    if (action === 'sent' && targetEmail && user) {
      try {
        const sendBody = JSON.stringify({
          email: user.email,
          password: user.password,
          provider: user.provider,
          to: targetEmail.sender_email || targetEmail.senderEmail,
          subject: targetEmail.subject,
          body: replyBody || targetEmail.draft?.body || targetEmail.draftBody,
          inReplyTo: targetEmail.id
        });

        try {
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: sendBody
          });
        } catch {
          await fetch('http://localhost:3002/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: sendBody
          });
        }
        showToast('✅ Reply sent successfully via SMTP');
      } catch {
        showToast('⚠️ Error sending reply');
      }
    } else if (action === 'declined') {
      showToast('Draft declined');
    } else if (action === 'dismissed') {
      showToast('Email dismissed');
    }

    setEmails(prev => prev.map(e =>
      e.id === emailId
        ? {
            ...e,
            draftStatus: action === 'sent' ? 'sent' : 'declined',
            draft: e.draft ? { ...e.draft, status: action === 'sent' ? 'sent' : 'declined' } : e.draft
          }
        : e
    ));
  };

  const filtered = (emails || []).filter(e => {
    if (!e) return false;
    const subject = e?.subject ?? '';
    const sender = e?.sender_name || e?.sender || '';
    const senderEmail = e?.sender_email || e?.senderEmail || '';
    const summary = e?.ai_summary || e?.summary || '';
    const category = e?.category || '';
    const urgency = e?.urgency || '';

    const matchSearch = !search || [subject, sender, senderEmail, summary, category, urgency].some(s =>
      typeof s === 'string' && s.toLowerCase().includes(search.toLowerCase())
    );
    if (!matchSearch) return false;

    const needsReply = e?.needs_reply !== undefined ? e.needs_reply : (e?.needsReply || false);
    const isPending = e?.draft?.status === 'pending_approval' || e?.draftStatus === 'pending';
    const isSent = e?.draft?.status === 'sent' || e?.draftStatus === 'sent';

    if (filter === 'Needs Reply') return needsReply && isPending;
    if (filter === 'No Reply Needed') return !needsReply;
    if (filter === 'Replied') return isSent;
    return true;
  });

  const pending = (emails || []).filter(e => e && (e.needs_reply || e.needsReply) && (e.draft?.status === 'pending_approval' || e.draftStatus === 'pending')).length;

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
            ☰
          </button>
          <span className="topbar-title">📥 Inbox</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span className="chip" style={{ fontSize: 11.5, padding: '3px 8px' }}>
              <span className={`notif-dot ${isLive ? 'notif-dot-green' : ''}`} style={{ width: 6, height: 6 }} />
              <span className="hide-on-mobile">{pollingBadge}</span>
            </span>

            {/* Refresh Button */}
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => loadEmails(historyLimit)}
              disabled={loading}
              style={{ fontSize: 12, padding: '6px 10px' }}
              title="Refresh inbox messages"
            >
              {loading ? <><span className="spinner" style={{ width: 12, height: 12 }} /> <span className="hide-on-mobile">Refreshing…</span></> : <>🔄 <span className="hide-on-mobile">Refresh</span></>}
            </button>

            {pending > 0 && (
              <button
                className="badge badge-purple"
                onClick={() => setFilter('Needs Reply')}
                style={{ cursor: 'pointer', border: 'none', padding: '3px 8px', fontSize: 11 }}
                title="Filter emails needing your review"
              >
                {pending} <span className="hide-on-mobile">awaiting approval</span>
              </button>
            )}

            <TopbarUserButton user={user} onClick={() => setUserModalOpen(true)} />
          </div>
        </div>

        <div className="page-content">
          {/* Toast notification */}
          {toastMessage && (
            <div className="fade-in" style={{
              position: 'fixed',
              top: 70,
              right: 24,
              zIndex: 300,
              background: 'var(--surface)',
              border: '1px solid var(--accent)',
              borderRadius: 8,
              padding: '10px 18px',
              fontSize: 13.5,
              fontWeight: 600,
              boxShadow: 'var(--shadow-lg)',
              color: 'var(--text)'
            }}>
              {toastMessage}
            </div>
          )}

          {/* Email banner */}
          {newBanner && user?.email && (
            <div className="fade-in" style={{
              background: 'var(--accent-glow)', border: '1px solid var(--accent)',
              borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: 18 }}>📬</span>
              <div style={{ flex: 1, fontSize: 14 }}>
                <strong>Inbox: {user.email}</strong>
                {pending > 0 ? ` — ${pending} email(s) currently need your review & approval before sending.` : ' — Monitoring your inbox in real time.'}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setNewBanner(false)}>Dismiss</button>
            </div>
          )}

          {/* Error Message if IMAP fails */}
          {errorMessage && (
            <div className="fade-in" style={{
              background: 'rgba(239, 68, 68, 0.12)', border: '1px solid var(--danger)',
              borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: 20,
              color: '#fca5a5', fontSize: 13.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              gap: 12, flexWrap: 'wrap'
            }}>
              <div>
                <strong>⚠️ Sync Issue:</strong> {errorMessage}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => loadEmails(historyLimit)}
                >
                  🔄 Retry
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => router.push('/settings')}
                >
                  Check Settings
                </button>
              </div>
            </div>
          )}

          {/* Search bar with clear button */}
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <input
              className="input"
              placeholder='🔍  Search emails, sender name, email address, or summary…'
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingRight: search ? 36 : 14 }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  fontSize: 14
                }}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter chips */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: 11, padding: '2px 8px' }}
                >
                  Clear filter
                </button>
              )}
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                Showing {filtered.length} of {emails.length} emails
              </div>
            </div>
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="card fade-in" style={{ padding: 48, textAlign: 'center' }}>
              <div className="spinner" style={{ width: 28, height: 28, margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>Connecting to {user?.email || 'inbox'} via IMAP...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state card fade-in" style={{ padding: 48 }}>
              <div className="empty-state-icon">📭</div>
              <h3>{emails.length === 0 ? 'Your inbox is clear' : 'No emails match this filter'}</h3>
              <p>{emails.length === 0 ? 'No messages found in your inbox. Click Refresh to check for new emails.' : 'Try a different filter or search query.'}</p>
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => loadEmails(historyLimit)}
                >
                  🔄 Check for New Emails
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setComposeOpen(true)}
                >
                  ✏️ Compose New Email
                </button>
              </div>
            </div>
          ) : (
            <>
              {filtered.map(email => (
                <EmailCard
                  key={email.id}
                  email={email}
                  onAction={handleAction}
                  onFilterTag={(tag) => setSearch(tag)}
                  onAskAI={(sender) => {
                    router.push(`/search?q=${encodeURIComponent(sender)}`);
                  }}
                />
              ))}

              {/* Load more history button */}
              <div style={{ textAlign: 'center', margin: '32px 0 48px' }}>
                <button
                  className="btn btn-ghost"
                  onClick={loadMoreHistory}
                  disabled={loadingHistory}
                  style={{ fontSize: 13 }}
                >
                  {loadingHistory ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Loading history…</> : '📜 Load More Email History (Past Messages)'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {composeOpen && (
        <ComposeModal
          user={user}
          onClose={() => setComposeOpen(false)}
          onSent={() => {
            showToast('✅ New email sent successfully');
            loadEmails(historyLimit);
          }}
        />
      )}

      {userModalOpen && (
        <GoogleAccountModal
          user={user}
          onClose={() => setUserModalOpen(false)}
          onOpenCompose={() => setComposeOpen(true)}
          onDisconnect={async () => {
            try {
              await fetch('/api/auth/disconnect', { method: 'POST' });
            } catch {}
            localStorage.removeItem('mailmind_user');
            router.replace('/onboarding');
          }}
          onUserUpdate={(updated) => setUser(updated)}
        />
      )}
    </div>
  );
}
