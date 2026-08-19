'use client';
import { useState } from 'react';

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function UrgencyBadge({ urgency }) {
  const map = { high: 'badge-high', medium: 'badge-medium', low: 'badge-low' };
  return <span className={`badge ${map[urgency] || 'badge-low'}`}>● {urgency || 'normal'}</span>;
}

function CategoryChip({ category }) {
  const labels = {
    direct_question: '❓ Question',
    action_request:  '⚡ Action',
    direct_message:  '💬 Direct',
    newsletter:      '📰 Newsletter',
    receipt:         '🧾 Receipt',
    notification:    '🔔 Notification',
    social:          '👥 Social',
    other:           '📌 Other',
  };
  return <span className="chip">{labels[category] || category || '📌 Email'}</span>;
}

function SenderAvatar({ name }) {
  const colors = ['#6c63ff','#a78bfa','#f59e0b','#22c55e','#ef4444','#3b82f6','#ec4899'];
  const safeName = name || 'User';
  const idx = safeName.charCodeAt(0) % colors.length;
  return (
    <div style={{
      width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
      background: colors[idx], display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontWeight: 700, fontSize: 15, color: '#fff',
    }}>{safeName[0]}</div>
  );
}

function EditModal({ email, onClose, onSend }) {
  const initialBody = email.draft?.body || email.draftBody || '';
  const [body, setBody] = useState(initialBody);

  const handleSend = () => {
    onSend(email.id, body);
    onClose();
  };

  const senderName = email.sender_name || email.sender || 'Sender';

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">✏️ Edit reply to {senderName}</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
          Re: {email.subject}
        </div>
        <textarea
          className="input"
          value={body}
          onChange={e => setBody(e.target.value)}
          style={{ minHeight: 220, fontFamily: 'inherit', lineHeight: 1.7 }}
        />
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
          💡 Tip: Replace any <code style={{ background: 'var(--surface2)', padding: '1px 5px', borderRadius: 4 }}>{'{{PLACEHOLDER}}'}</code> text before sending.
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Discard</button>
          <button className="btn btn-primary btn-sm" onClick={handleSend}>Send Reply</button>
        </div>
      </div>
    </div>
  );
}

function FullEmailModal({ email, onClose }) {
  const senderName = email.sender_name || email.sender || 'Sender';
  const senderEmail = email.sender_email || email.senderEmail || '';

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 660 }}>
        <div className="modal-header">📧 {email.subject}</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
          From: {senderName} &lt;{senderEmail}&gt;
        </div>
        <div style={{
          background: 'var(--surface2)', borderRadius: 8, padding: 20,
          fontSize: 14, lineHeight: 1.75, whiteSpace: 'pre-wrap', color: 'var(--text)',
          maxHeight: 450, overflowY: 'auto'
        }}>
          {email.body_plain || email.body || '(No message body)'}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function EmailCard({ email, onAction }) {
  const senderName = email.sender_name || email.sender || 'Unknown';
  const senderEmail = email.sender_email || email.senderEmail || '';
  const receivedAt = email.received_at || email.receivedAt || new Date().toISOString();
  const summary = email.ai_summary || email.summary || 'No summary available.';
  const needsReply = email.needs_reply !== undefined ? email.needs_reply : (email.needsReply || false);
  const draftBody = email.draft?.body || email.draftBody || null;

  const [expanded, setExpanded] = useState(needsReply);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [status, setStatus] = useState(email.draft?.status || email.draftStatus || null);
  const [sending, setSending] = useState(false);

  const isDone = status === 'sent' || status === 'declined';

  const handleSend = (emailId, body) => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setStatus('sent');
      onAction && onAction(emailId, 'sent', body);
    }, 800);
  };

  const handleDecline = () => {
    setStatus('declined');
    onAction && onAction(email.id, 'declined');
  };

  return (
    <>
      <div
        className="card card-hover fade-in"
        style={{
          marginBottom: 16,
          borderLeft: needsReply ? '3px solid var(--accent)' : '3px solid transparent',
          opacity: isDone ? 0.6 : 1,
          transition: 'all 0.3s ease',
        }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <SenderAvatar name={senderName} email={senderEmail} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{senderName}</span>
              <span style={{ fontSize: 12, color: 'var(--muted)', flexShrink: 0 }}>{timeAgo(receivedAt)}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {email.subject}
            </div>
          </div>
        </div>

        {/* Tags row */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0 0' }}>
          <UrgencyBadge urgency={email.urgency} />
          <CategoryChip category={email.category} />
          {needsReply && !isDone && <span className="badge badge-purple">💬 Needs reply</span>}
          {status === 'sent' && <span className="badge badge-low">✅ Replied</span>}
          {status === 'declined' && <span className="badge badge-info">✗ Skipped</span>}
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--border)', margin: '14px 0' }} />

        {/* AI Summary */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>🤖</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>AI Summary</div>
            <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text)' }}>{summary}</p>
          </div>
        </div>

        {/* View full email */}
        <button
          onClick={() => setViewOpen(true)}
          style={{ background: 'none', color: 'var(--muted)', fontSize: 12, padding: '6px 0', cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted', marginTop: 4, display: 'block' }}
        >View original email →</button>

        {/* Draft section */}
        {draftBody && !isDone && (
          <>
            <div style={{ borderTop: '1px solid var(--border)', margin: '14px 0' }} />
            <div
              onClick={() => setExpanded(e => !e)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: expanded ? 12 : 0 }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {expanded ? '▼' : '▶'} Suggested Reply
              </span>
            </div>

            {expanded && (
              <div className="fade-in">
                <div style={{
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: 16, fontSize: 14, lineHeight: 1.75,
                  whiteSpace: 'pre-wrap', color: 'var(--text)', fontStyle: 'normal',
                }}>
                  {draftBody}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => handleSend(email.id, draftBody)}
                    disabled={sending}
                  >
                    {sending ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Sending…</> : '✅ Send as-is'}
                  </button>
                  <button className="btn btn-warning btn-sm" onClick={() => setEditOpen(true)}>
                    ✏️ Edit & send
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={handleDecline}>
                    ✗ Don't send
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* No-reply dismiss */}
        {!needsReply && (
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => onAction && onAction(email.id, 'dismissed')}>
              Dismiss
            </button>
          </div>
        )}
      </div>

      {editOpen && (
        <EditModal email={email} onClose={() => setEditOpen(false)} onSend={handleSend} />
      )}
      {viewOpen && (
        <FullEmailModal email={email} onClose={() => setViewOpen(false)} />
      )}
    </>
  );
}
