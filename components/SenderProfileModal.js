'use client';
import { useState } from 'react';
import EmailAvatar from '@/components/EmailAvatar';
import { getSenderProfile } from '@/lib/avatar-utils';

export default function SenderProfileModal({ email, onClose, onReply, onSearchSender }) {
  const [copied, setCopied] = useState(false);

  const senderName = email.sender_name || email.sender || '';
  const senderEmail = email.sender_email || email.senderEmail || '';
  const profile = getSenderProfile(senderName, senderEmail, email);

  const handleCopyEmail = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(profile.email || senderEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyContact = (e) => {
    e.stopPropagation();
    const formatted = `${profile.name} <${profile.email}>`;
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 520, padding: 28 }}>
        {/* Profile Card Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, marginBottom: 20 }}>
          <EmailAvatar
            name={profile.name}
            email={profile.email}
            size={68}
            className="shadow-md"
            style={{ border: '2px solid var(--border2)' }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                {profile.name}
              </h2>
              {profile.organization && (
                <span className="badge badge-purple" style={{ fontSize: 10 }}>
                  🏢 {profile.organization}
                </span>
              )}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 4,
              fontSize: 13,
              color: 'var(--muted)'
            }}>
              <span style={{ fontFamily: 'monospace' }}>{profile.email}</span>
              <button
                onClick={handleCopyEmail}
                className="btn btn-ghost btn-sm"
                style={{ padding: '2px 8px', fontSize: 11, borderRadius: 4 }}
                title="Copy email address"
              >
                {copied ? '✅ Copied' : '📋 Copy'}
              </button>
            </div>

            {profile.websiteUrl && (
              <div style={{ marginTop: 6 }}>
                <a
                  href={profile.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: 12,
                    color: 'var(--accent)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    textDecoration: 'underline'
                  }}
                >
                  🌐 Visit {profile.domain} ↗
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Profile Details List */}
        <div style={{
          background: 'var(--surface2)',
          borderRadius: 'var(--radius-sm)',
          padding: '14px 16px',
          marginBottom: 20,
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          fontSize: 13
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--muted)' }}>Account Type:</span>
            <span style={{ fontWeight: 600 }}>
              {profile.isFreeProvider ? 'Personal Webmail (Free)' : `Custom Domain (${profile.domain})`}
            </span>
          </div>

          {email.subject && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ color: 'var(--muted)', flexShrink: 0 }}>Recent Subject:</span>
              <span style={{
                fontWeight: 500,
                textAlign: 'right',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 260
              }}>
                {email.subject}
              </span>
            </div>
          )}

          {email.category && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>Category:</span>
              <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>
                {email.category.replace('_', ' ')}
              </span>
            </div>
          )}

          {email.urgency && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>Priority:</span>
              <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>
                {email.urgency}
              </span>
            </div>
          )}
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              onClose();
              onReply && onReply(email);
            }}
          >
            ✉️ Compose / Reply
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              onClose();
              onSearchSender && onSearchSender(profile.email || profile.name);
            }}
          >
            🔍 Search Emails
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleCopyContact}
          >
            📋 Copy Contact Card
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={onClose}
          >
            ❌ Close
          </button>
        </div>

        <div className="modal-footer" style={{ marginTop: 0 }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
