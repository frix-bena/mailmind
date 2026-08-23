'use client';
import { useState } from 'react';
import EmailAvatar from '@/components/EmailAvatar';
import SenderProfileModal from '@/components/SenderProfileModal';
import {
  extractDisplayName,
  extractCleanEmail,
  extractOrganization,
  isVerifiedSender,
  extractDomain,
  formatEmailDate
} from '@/lib/avatar-utils';

function UrgencyBadge({ urgency, onClick }) {
  const map = { high: 'badge-high', medium: 'badge-medium', low: 'badge-low' };
  return (
    <button
      onClick={onClick}
      className={`badge ${map[urgency] || 'badge-low'}`}
      style={{ cursor: onClick ? 'pointer' : 'default', border: 'none' }}
      title={`Urgency: ${urgency || 'normal'}`}
    >
      ● {urgency || 'normal'}
    </button>
  );
}

function CategoryChip({ category, onClick }) {
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
  return (
    <button
      onClick={onClick}
      className="chip"
      style={{ cursor: onClick ? 'pointer' : 'default', background: 'var(--surface2)' }}
      title={`Category: ${category || 'Email'}`}
    >
      {labels[category] || category || '📌 Email'}
    </button>
  );
}

function EditModal({ email, onClose, onSend }) {
  const initialBody = email.draft?.body || email.draftBody || '';
  const [body, setBody] = useState(initialBody);

  const handleSend = () => {
    onSend(email.id, body);
    onClose();
  };

  const senderName = extractDisplayName(email.sender_name || email.sender, email.sender_email || email.senderEmail);

  const insertClosing = () => {
    setBody(prev => `${prev.trim()}\n\nBest regards,\nMe`);
  };

  const insertGreeting = () => {
    const firstName = senderName.split(' ')[0] || 'there';
    setBody(prev => `Hi ${firstName},\n\n${prev.replace(/^Hi\s+[^\n]+,\n*/i, '')}`);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 620 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="modal-header" style={{ margin: 0 }}>✏️ Edit reply to {senderName}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '4px 8px' }}>✕</button>
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>
          Re: {email.subject}
        </div>

        {/* Quick Helper buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 11, padding: '3px 8px' }}
            onClick={insertGreeting}
          >
            👋 Insert Greeting
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 11, padding: '3px 8px' }}
            onClick={insertClosing}
          >
            ✍️ Insert Closing
          </button>
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
          <button className="btn btn-primary btn-sm" onClick={handleSend}>Send Reply 🚀</button>
        </div>
      </div>
    </div>
  );
}

function FullEmailModal({ email, onClose, onReply, onOpenProfile }) {
  const [copied, setCopied] = useState(false);
  const senderEmail = extractCleanEmail(email.sender_email || email.senderEmail || '');
  const senderName = extractDisplayName(email.sender_name || email.sender, senderEmail);
  const domain = extractDomain(senderEmail);
  const isVerified = isVerifiedSender(senderEmail, domain);
  const dateInfo = formatEmailDate(email.received_at || email.receivedAt);

  const handleCopyBody = () => {
    const text = email.body_plain || email.body || '';
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 700 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div className="modal-header" style={{ margin: 0, fontSize: 18, flex: 1, paddingRight: 12, lineHeight: 1.4 }}>
            {email.subject}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '4px 8px' }}>✕</button>
        </div>

        {/* Real Email Client Sender Header Bar */}
        <div style={{
          marginBottom: 16,
          background: 'var(--surface2)',
          padding: '14px 16px',
          borderRadius: 12,
          border: '1px solid var(--border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div
              onClick={onOpenProfile}
              style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', flexShrink: 0 }}
              title="Click to view full sender profile"
            >
              <EmailAvatar name={senderName} email={senderEmail} size={40} showVerifiedBadge={true} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                    {senderName}
                  </span>
                  {isVerified && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: '#1a73e8',
                        color: '#ffffff',
                        flexShrink: 0
                      }}
                      title="Google verified sender (BIMI / Authenticated Domain)"
                    >
                      <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 500 }}>
                    (👤 Profile)
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'monospace', marginTop: 1 }}>
                  &lt;{senderEmail}&gt;
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleCopyBody}
                style={{ fontSize: 11, padding: '4px 8px' }}
                title="Copy email message text"
              >
                {copied ? '✅ Copied' : '📋 Copy Text'}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={handlePrint}
                style={{ fontSize: 11, padding: '4px 8px' }}
                title="Print email"
              >
                🖨️ Print
              </button>
            </div>
          </div>

          {/* Timestamp and Security Metadata Line */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 10,
            paddingTop: 8,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            fontSize: 11.5,
            color: 'var(--muted)',
            flexWrap: 'wrap',
            gap: 8
          }}>
            <div>
              <span>📅 {dateInfo.full || 'Recent'}</span>
              {dateInfo.relative && <span style={{ marginLeft: 6 }}>({dateInfo.relative})</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>to: <strong>me</strong></span>
              <span style={{ color: 'var(--success)' }}>🔒 TLS Encrypted</span>
            </div>
          </div>
        </div>

        {/* Email Body */}
        <div style={{
          background: 'var(--surface2)', borderRadius: 10, padding: 20,
          fontSize: 14, lineHeight: 1.75, whiteSpace: 'pre-wrap', color: 'var(--text)',
          maxHeight: 420, overflowY: 'auto', border: '1px solid var(--border)'
        }}>
          {email.body_plain || email.body || '(No message body)'}
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18 }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              onClose();
              onReply && onReply(email);
            }}
          >
            ✉️ Reply to Sender
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function EmailCard({ email, onAction, onFilterTag, onAskAI }) {
  const senderEmail = extractCleanEmail(email.sender_email || email.senderEmail || '');
  const senderName = extractDisplayName(email.sender_name || email.sender, senderEmail);
  const organization = extractOrganization(senderEmail, senderName);
  const domain = extractDomain(senderEmail);
  const isVerified = isVerifiedSender(senderEmail, domain);
  const receivedAt = email.received_at || email.receivedAt || new Date().toISOString();
  const dateInfo = formatEmailDate(receivedAt);
  const summary = email.ai_summary || email.summary || 'No summary available.';
  const needsReply = email.needs_reply !== undefined ? email.needs_reply : (email.needsReply || false);
  const draftBody = email.draft?.body || email.draftBody || null;

  const [expanded, setExpanded] = useState(needsReply);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [status, setStatus] = useState(email.draft?.status || email.draftStatus || null);
  const [sending, setSending] = useState(false);
  const [starred, setStarred] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

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

  const handleCopySummary = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
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
          position: 'relative'
        }}
      >
        {/* Header row: Real sender profile with avatar and verified status */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div
            onClick={() => setProfileOpen(true)}
            style={{ cursor: 'pointer', position: 'relative', flexShrink: 0 }}
            title={`Click to view ${senderName}'s full profile`}
          >
            <EmailAvatar
              name={senderName}
              email={senderEmail}
              size={40}
              showTooltip={true}
              showVerifiedBadge={true}
            />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              {/* Sender Name, Verified Badge, Email Address, and Organization */}
              <div
                onClick={() => setProfileOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  flexWrap: 'wrap'
                }}
                title={`Click to view sender profile for ${senderName}`}
              >
                <span style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--text)', letterSpacing: '-0.2px' }}>
                  {senderName}
                </span>

                {isVerified && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: '#1a73e8',
                      color: '#ffffff',
                      flexShrink: 0
                    }}
                    title="Google verified sender (BIMI / Authenticated Domain)"
                  >
                    <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}

                {senderEmail && senderName !== senderEmail && (
                  <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'monospace' }}>
                    &lt;{senderEmail}&gt;
                  </span>
                )}

                {organization && (
                  <span className="badge badge-purple" style={{ fontSize: 10, padding: '1px 7px' }}>
                    🏢 {organization}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Star Button */}
                <button
                  onClick={() => setStarred(s => !s)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 16,
                    cursor: 'pointer',
                    color: starred ? '#f59e0b' : 'var(--muted)',
                    padding: '2px 4px',
                    lineHeight: 1
                  }}
                  title={starred ? 'Unstar email' : 'Star this email'}
                >
                  {starred ? '★' : '☆'}
                </button>
                <span
                  style={{ fontSize: 12, color: 'var(--muted)', flexShrink: 0 }}
                  title={dateInfo.full || ''}
                >
                  {dateInfo.relative || 'recently'}
                </span>
              </div>
            </div>

            <div style={{
              fontSize: 13.5,
              fontWeight: 500,
              color: 'var(--text)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginTop: 3
            }}>
              {email.subject}
            </div>
          </div>
        </div>

        {/* Tags row */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0 0', alignItems: 'center' }}>
          <UrgencyBadge urgency={email.urgency} onClick={() => onFilterTag && onFilterTag(email.urgency)} />
          <CategoryChip category={email.category} onClick={() => onFilterTag && onFilterTag(email.category)} />
          {needsReply && !isDone && <span className="badge badge-purple">💬 Needs reply</span>}
          {status === 'sent' && <span className="badge badge-low">✅ Replied</span>}
          {status === 'declined' && <span className="badge badge-info">✗ Skipped</span>}
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--border)', margin: '14px 0' }} />

        {/* AI Summary Section with Copy and Ask AI buttons */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>🤖</span>
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 4
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                AI Summary
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={handleCopySummary}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: 10, padding: '2px 6px', height: 20 }}
                  title="Copy summary"
                >
                  {copiedSummary ? '✅ Copied' : '📋 Copy'}
                </button>
              </div>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text)' }}>{summary}</p>
          </div>
        </div>

        {/* Action bar: View original email & Profile shortcuts */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => setViewOpen(true)}
            style={{
              background: 'none',
              color: 'var(--muted)',
              fontSize: 12,
              padding: '4px 0',
              cursor: 'pointer',
              textDecoration: 'underline',
              textDecorationStyle: 'dotted'
            }}
          >
            View original email →
          </button>

          <button
            onClick={() => setProfileOpen(true)}
            style={{
              background: 'none',
              color: 'var(--accent)',
              fontSize: 12,
              padding: '4px 0',
              cursor: 'pointer',
              textDecoration: 'underline',
              textDecorationStyle: 'dotted'
            }}
          >
            👤 View Sender Profile & History →
          </button>
        </div>

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

      {profileOpen && (
        <SenderProfileModal
          email={email}
          onClose={() => setProfileOpen(false)}
          onReply={() => setEditOpen(true)}
          onSearchSender={(senderTerm) => onAskAI && onAskAI(senderTerm)}
        />
      )}
      {editOpen && (
        <EditModal email={email} onClose={() => setEditOpen(false)} onSend={handleSend} />
      )}
      {viewOpen && (
        <FullEmailModal
          email={email}
          onClose={() => setViewOpen(false)}
          onReply={() => { setViewOpen(false); setEditOpen(true); }}
          onOpenProfile={() => { setViewOpen(false); setProfileOpen(true); }}
        />
      )}
    </>
  );
}

