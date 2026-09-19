'use client';

import React, { useState } from 'react';
import { CloseIcon, ShieldCheckIcon, LockIcon, DocumentIcon } from '@/components/Icons';

export default function LegalModal({ isOpen, initialTab = 'terms', onClose }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 680, maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'var(--accent-subtle)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheckIcon size={18} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '-0.2px' }}>
                Legal and Data Governance
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                Plain-language transparency for MailMind users
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            aria-label="Close dialog"
            style={{ padding: '6px 8px' }}
          >
            <CloseIcon size={14} />
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setActiveTab('terms')}
            style={{
              background: activeTab === 'terms' ? 'var(--surface2)' : 'transparent',
              color: activeTab === 'terms' ? 'var(--text)' : 'var(--muted)',
              border: `1px solid ${activeTab === 'terms' ? 'var(--border2)' : 'transparent'}`,
              borderRadius: 6,
              fontSize: 12.5,
              fontWeight: 600,
              padding: '6px 14px'
            }}
          >
            <DocumentIcon size={14} style={{ marginRight: 6 }} />
            Terms of Service
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setActiveTab('privacy')}
            style={{
              background: activeTab === 'privacy' ? 'var(--surface2)' : 'transparent',
              color: activeTab === 'privacy' ? 'var(--text)' : 'var(--muted)',
              border: `1px solid ${activeTab === 'privacy' ? 'var(--border2)' : 'transparent'}`,
              borderRadius: 6,
              fontSize: 12.5,
              fontWeight: 600,
              padding: '6px 14px'
            }}
          >
            <LockIcon size={14} style={{ marginRight: 6 }} />
            Privacy Policy
          </button>
        </div>

        {/* Content body */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 6, fontSize: 13.5, lineHeight: 1.7, color: 'var(--text)' }}>
          {activeTab === 'terms' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 6px', color: 'var(--text)' }}>1. Permission-First Operational Model</h4>
                <p style={{ margin: 0, color: 'var(--muted)' }}>
                  MailMind functions as an intelligent drafting and indexing companion. By default, MailMind operates in permission-first mode: no electronic mail is transmitted or dispatched to any recipient without explicit, verifiable user approval in the review interface.
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 6px', color: 'var(--text)' }}>2. User Account Ownership and Control</h4>
                <p style={{ margin: 0, color: 'var(--muted)' }}>
                  You maintain 100% legal ownership of your email address, mail data, drafts, and sender identity. MailMind claims no intellectual property, copyright, or commercial rights over communications processed through your connected mail host.
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 6px', color: 'var(--text)' }}>3. Protocol Credentials and Access Tokens</h4>
                <p style={{ margin: 0, color: 'var(--muted)' }}>
                  Access to your mailbox is negotiated via standard protocols (IMAP/SMTP with App Passwords or OAuth 2.0 bearer tokens). You may revoke application access at any time via your mail host account security console (such as Google Account Security or Microsoft Security Center), which immediately terminates MailMind synchronization.
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 6px', color: 'var(--text)' }}>4. Autonomous Mode Liability</h4>
                <p style={{ margin: 0, color: 'var(--muted)' }}>
                  If you elect to switch your monitoring profile to Autonomous Mode, you acknowledge that automated replies will be dispatched without per-message confirmation. You are solely responsible for configuring whitelist filters and reviewing outgoing logs periodically.
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 6px', color: 'var(--text)' }}>5. Warranty and Service Availability</h4>
                <p style={{ margin: 0, color: 'var(--muted)' }}>
                  MailMind is provided on an &quot;as-is&quot; basis. MailMind does not guarantee uninterrupted synchronization during mail host outages, protocol rate limiting, or network degradation.
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 6px', color: 'var(--text)' }}>1. Zero Model Training Policy</h4>
                <p style={{ margin: 0, color: 'var(--muted)' }}>
                  Your private email messages, sender metadata, attachments, and generated replies are strictly isolated. MailMind does not use customer email contents to train foundation models or public artificial intelligence systems.
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 6px', color: 'var(--text)' }}>2. Ephemeral In-Memory Processing</h4>
                <p style={{ margin: 0, color: 'var(--muted)' }}>
                  Message bodies fetched during live IMAP polling are kept in memory for classification, summarization, and draft generation. No persistent third-party database holds your archive copies; your messages remain stored on your own email provider&apos;s servers.
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 6px', color: 'var(--text)' }}>3. Credential Storage and Local State</h4>
                <p style={{ margin: 0, color: 'var(--muted)' }}>
                  Connection parameters, theme configurations, and notification preferences are saved locally on your device in browser localStorage and secure session cookies. You can flush all stored session data with a single click via Settings &gt; Disconnect Account.
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 6px', color: 'var(--text)' }}>4. Third-Party Network Services</h4>
                <p style={{ margin: 0, color: 'var(--muted)' }}>
                  When generating drafts or answering search queries, sanitized context snippets are transmitted directly over encrypted TLS connections to the designated language model API endpoint. We do not sell, rent, or monetize your inbox records.
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 6px', color: 'var(--text)' }}>5. Your Rights (GDPR and CCPA)</h4>
                <p style={{ margin: 0, color: 'var(--muted)' }}>
                  You hold the absolute right to inspect, export, and delete all local state data at any time. Terminating your connection immediately wipes cached credentials and notification registrations from the local environment.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 18, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
            Effective as of 2026. Certified permission-first architecture.
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={onClose} style={{ padding: '6px 16px' }}>
            Acknowledge &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
}
