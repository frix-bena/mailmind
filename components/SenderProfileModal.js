'use client';
import { useState } from 'react';
import EmailAvatar from '@/components/EmailAvatar';
import { getSenderProfile } from '@/lib/avatar-utils';

export default function SenderProfileModal({ email, onClose, onReply, onSearchSender }) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedCard, setCopiedCard] = useState(false);
  const [isVip, setIsVip] = useState(false);

  const senderName = email.sender_name || email.sender || '';
  const senderEmail = email.sender_email || email.senderEmail || '';
  const profile = getSenderProfile(senderName, senderEmail, email);

  const handleCopyEmail = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(profile.email || senderEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopyContact = (e) => {
    e.stopPropagation();
    const formatted = profile.name && profile.name !== profile.email
      ? `"${profile.name}" <${profile.email}>`
      : profile.email;
    navigator.clipboard.writeText(formatted);
    setCopiedCard(true);
    setTimeout(() => setCopiedCard(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div
        className="modal fade-in"
        style={{
          maxWidth: 540,
          padding: 0,
          overflow: 'hidden',
          borderRadius: 20,
          border: '1px solid var(--border2)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.65)'
        }}
      >
        {/* Colorful Gradient Header Banner */}
        <div
          style={{
            background: profile.color?.gradient
              ? `linear-gradient(135deg, ${profile.color.hex}44 0%, var(--surface2) 100%)`
              : 'linear-gradient(135deg, var(--accent-glow) 0%, var(--surface2) 100%)',
            height: 90,
            position: 'relative',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--muted)' }}>
              Sender Profile & Identity
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setIsVip(v => !v)}
              className="btn btn-ghost btn-sm"
              style={{
                padding: '4px 10px',
                fontSize: 13,
                background: 'rgba(0,0,0,0.3)',
                borderColor: isVip ? '#f59e0b' : 'rgba(255,255,255,0.15)',
                color: isVip ? '#f59e0b' : 'var(--text)',
                borderRadius: 20
              }}
              title={isVip ? 'Sender marked as VIP' : 'Mark sender as VIP'}
            >
              {isVip ? '★ VIP Sender' : '☆ Star VIP'}
            </button>

            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm"
              style={{
                padding: '4px 10px',
                fontSize: 13,
                background: 'rgba(0,0,0,0.3)',
                borderColor: 'rgba(255,255,255,0.15)',
                color: 'var(--text)',
                borderRadius: 20
              }}
              title="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Main Profile Info Section */}
        <div style={{ padding: '0 24px 24px', marginTop: -40 }}>
          {/* Avatar and Main Header */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, marginBottom: 16 }}>
            <div style={{ position: 'relative' }}>
              <EmailAvatar
                name={profile.name}
                email={profile.email}
                size={76}
                showVerifiedBadge={true}
                style={{
                  border: '3px solid var(--surface)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.45)'
                }}
              />
            </div>

            <div style={{ flex: 1, minWidth: 0, paddingBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--text)', letterSpacing: '-0.3px' }}>
                  {profile.name}
                </h2>
                {profile.isVerified && (
                  <span
                    style={{
                      background: 'rgba(29, 155, 240, 0.15)',
                      border: '1px solid rgba(29, 155, 240, 0.35)',
                      color: '#38bdf8',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 12,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    ✓ Verified Sender
                  </span>
                )}
              </div>

              {profile.organization && (
                <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--accent)' }}>
                  <span style={{ fontWeight: 600 }}>🏢 {profile.organization}</span>
                  {profile.websiteUrl && (
                    <a
                      href={profile.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: 11,
                        color: 'var(--muted)',
                        textDecoration: 'underline',
                        textDecorationStyle: 'dotted'
                      }}
                      title={`Visit ${profile.domain}`}
                    >
                      ({profile.domain} ↗)
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Email Address Pill with 1-Click Copy */}
          <div
            style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
              <span style={{ fontSize: 14 }}>✉️</span>
              <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text)', wordBreak: 'break-all' }}>
                {profile.email}
              </span>
            </div>

            <button
              onClick={handleCopyEmail}
              className="btn btn-ghost btn-sm"
              style={{
                padding: '4px 10px',
                fontSize: 11,
                borderRadius: 6,
                background: copiedEmail ? 'rgba(34,197,94,0.15)' : 'var(--surface)',
                color: copiedEmail ? 'var(--success)' : 'var(--text)'
              }}
              title="Copy clean email address"
            >
              {copiedEmail ? '✅ Copied!' : '📋 Copy'}
            </button>
          </div>

          {/* Security & Authentication Trust Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
              marginBottom: 18,
              fontSize: 11
            }}
          >
            <div style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '8px 10px',
              textAlign: 'center'
            }}>
              <div style={{ color: 'var(--success)', fontWeight: 700 }}>🔒 TLS Encrypted</div>
              <div style={{ color: 'var(--muted)', marginTop: 2, fontSize: 10 }}>Transport Security</div>
            </div>

            <div style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '8px 10px',
              textAlign: 'center'
            }}>
              <div style={{ color: profile.isVerified ? 'var(--info)' : 'var(--muted)', fontWeight: 700 }}>
                {profile.isVerified ? '🛡️ SPF & DKIM' : '🛡️ Standard Mail'}
              </div>
              <div style={{ color: 'var(--muted)', marginTop: 2, fontSize: 10 }}>
                {profile.isVerified ? 'Authenticated' : 'Standard Delivery'}
              </div>
            </div>

            <div style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '8px 10px',
              textAlign: 'center'
            }}>
              <div style={{ color: 'var(--accent)', fontWeight: 700 }}>
                {profile.isFreeProvider ? '👤 Webmail' : '🏢 Custom Domain'}
              </div>
              <div style={{ color: 'var(--muted)', marginTop: 2, fontSize: 10 }}>Account Type</div>
            </div>
          </div>

          {/* Email Context & Recent Interaction Details */}
          <div
            style={{
              background: 'var(--surface2)',
              borderRadius: 10,
              padding: '14px 16px',
              marginBottom: 20,
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              fontSize: 13
            }}
          >
            {profile.dateInfo?.full && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--muted)' }}>Received At:</span>
                <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: 12 }}>
                  📅 {profile.dateInfo.full} ({profile.dateInfo.relative})
                </span>
              </div>
            )}

            {email.subject && (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: 'var(--muted)', flexShrink: 0 }}>Latest Subject:</span>
                <span style={{
                  fontWeight: 600,
                  textAlign: 'right',
                  color: 'var(--text)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: 280
                }}>
                  {email.subject}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ color: 'var(--muted)' }}>Classification:</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {email.category && (
                  <span className="chip" style={{ fontSize: 11, padding: '2px 8px' }}>
                    {email.category.replace('_', ' ')}
                  </span>
                )}
                {email.urgency && (
                  <span className={`badge ${email.urgency === 'high' ? 'badge-high' : email.urgency === 'medium' ? 'badge-medium' : 'badge-low'}`} style={{ fontSize: 10 }}>
                    ● {email.urgency}
                  </span>
                )}
              </div>
            </div>

            {profile.aiSummary && (
              <div style={{
                marginTop: 4,
                padding: '10px 12px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.05)',
                fontSize: 12.5,
                lineHeight: 1.55,
                color: 'var(--text)'
              }}>
                <span style={{ fontWeight: 700, color: 'var(--accent)', marginRight: 6 }}>🤖 AI Note:</span>
                {profile.aiSummary}
              </div>
            )}
          </div>

          {/* Quick Action Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                onClose();
                onReply && onReply(email);
              }}
              style={{ fontSize: 13, padding: '9px 14px', borderRadius: 8 }}
            >
              ✉️ Reply / Compose
            </button>

            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                onClose();
                onSearchSender && onSearchSender(profile.email || profile.name);
              }}
              style={{ fontSize: 13, padding: '9px 14px', borderRadius: 8 }}
            >
              🔍 Search All Emails
            </button>

            <button
              className="btn btn-ghost btn-sm"
              onClick={handleCopyContact}
              style={{ fontSize: 12, padding: '8px 12px', borderRadius: 8 }}
            >
              {copiedCard ? '✅ Contact Copied!' : '📋 Copy Contact Card'}
            </button>

            {profile.websiteUrl ? (
              <a
                href={profile.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 12, padding: '8px 12px', borderRadius: 8, textDecoration: 'none', textAlign: 'center' }}
              >
                🌐 Visit {profile.domain} ↗
              </a>
            ) : (
              <button
                className="btn btn-ghost btn-sm"
                onClick={onClose}
                style={{ fontSize: 12, padding: '8px 12px', borderRadius: 8 }}
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

