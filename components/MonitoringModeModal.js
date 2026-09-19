'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheckIcon, SendIcon, CheckIcon, CloseIcon } from '@/components/Icons';

/**
 * MonitoringModeModal - A sleek pop-up bar dialog for configuring
 * the agent's email monitoring and autonomous reply policy.
 */
export default function MonitoringModeModal({
  isOpen,
  currentMode = 'ask_permission',
  user,
  onClose,
  onSave
}) {
  const [selectedMode, setSelectedMode] = useState(currentMode);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedMode(currentMode || 'ask_permission');
      setSaving(false);
    }
  }, [isOpen, currentMode]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !saving) {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, saving, onClose]);

  if (!isOpen) return null;

  const isAuto = selectedMode === 'auto_reply' || selectedMode === 'without_permission';

  const handleApply = async () => {
    setSaving(true);
    try {
      if (onSave) {
        await onSave(selectedMode);
      }
      onClose?.();
    } catch (err) {
      console.error('Failed to save monitoring mode:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) {
          onClose?.();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="monitoring-modal-title"
    >
      <div
        className="modal fade-in"
        style={{
          maxWidth: 620,
          padding: 0,
          overflow: 'hidden',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow)',
          background: 'var(--surface)'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            background: 'var(--surface2)',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
                flexShrink: 0
              }}
            >
              {isAuto ? <SendIcon size={20} /> : <ShieldCheckIcon size={20} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2
                  id="monitoring-modal-title"
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    margin: 0,
                    color: 'var(--text)'
                  }}
                >
                  Change Monitoring Mode
                </h2>
                <span
                  className={isAuto ? 'badge badge-purple' : 'badge badge-low'}
                  style={{ fontSize: 11, padding: '2px 8px' }}
                >
                  {isAuto ? 'Autonomous' : 'Permission-First'}
                </span>
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '3px 0 0 0' }}>
                Select how MailMind acts upon incoming messages in your inbox.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="btn btn-ghost btn-sm"
            style={{ padding: '4px 8px' }}
          >
            <CloseIcon size={14} />
          </button>
        </div>

        {/* Modal Body / Mode Options */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>
            Choose an agent response policy:
          </div>

          {/* Option 1: Ask Permission */}
          <div
            onClick={() => setSelectedMode('ask_permission')}
            style={{
              background: !isAuto ? 'var(--accent-glow)' : 'var(--surface2)',
              border: `1.5px solid ${!isAuto ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)',
              padding: '16px 18px',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 2
                  }}
                >
                  <ShieldCheckIcon size={20} style={{ color: 'var(--accent)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
                      Ask Permission (Permission-First)
                    </span>
                    <span className="badge badge-low" style={{ fontSize: 10.5, padding: '2px 7px' }}>
                      Strict Approval
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                    Human-in-the-loop mode · Requires manual approval before sending
                  </div>
                  <p style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.45, margin: '8px 0 0 0', opacity: 0.9 }}>
                    The AI agent continuously reads incoming emails, categorizes them, and generates high-quality drafts. <strong>No email is ever sent without your explicit review and click.</strong>
                  </p>
                  <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span className="chip" style={{ fontSize: 11, padding: '2px 8px' }}>
                      Drafts await approval
                    </span>
                    <span className="chip" style={{ fontSize: 11, padding: '2px 8px' }}>
                      Zero unapproved sends
                    </span>
                    <span className="chip" style={{ fontSize: 11, padding: '2px 8px' }}>
                      Full user control
                    </span>
                  </div>
                </div>
              </div>

              {/* Radio Indicator */}
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  border: `1.5px solid ${!isAuto ? 'var(--accent)' : 'var(--muted)'}`,
                  background: !isAuto ? 'var(--accent)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  flexShrink: 0,
                  marginTop: 2
                }}
              >
                {!isAuto && <CheckIcon size={12} />}
              </div>
            </div>
          </div>

          {/* Option 2: Reply Without Permission */}
          <div
            onClick={() => setSelectedMode('auto_reply')}
            style={{
              background: isAuto ? 'var(--accent-glow)' : 'var(--surface2)',
              border: `1.5px solid ${isAuto ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)',
              padding: '16px 18px',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 2
                  }}
                >
                  <SendIcon size={18} style={{ color: 'var(--accent)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
                      Reply Without Permission (Autonomous)
                    </span>
                    <span className="badge badge-purple" style={{ fontSize: 10.5, padding: '2px 7px' }}>
                      Autonomous Mode
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                    Fully autonomous mode · Instant SMTP automated dispatch
                  </div>
                  <p style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.45, margin: '8px 0 0 0', opacity: 0.9 }}>
                    The AI agent monitors incoming emails, generates context-aware responses matching your configured tone, and <strong>sends replies automatically via SMTP without waiting for confirmation.</strong>
                  </p>
                  <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span className="chip" style={{ fontSize: 11, padding: '2px 8px' }}>
                      Instant auto-dispatch
                    </span>
                    <span className="chip" style={{ fontSize: 11, padding: '2px 8px' }}>
                      Real-time SMTP send
                    </span>
                    <span className="chip" style={{ fontSize: 11, padding: '2px 8px' }}>
                      Hands-free inbox
                    </span>
                  </div>
                </div>
              </div>

              {/* Radio Indicator */}
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  border: `1.5px solid ${isAuto ? 'var(--accent)' : 'var(--muted)'}`,
                  background: isAuto ? 'var(--accent)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  flexShrink: 0,
                  marginTop: 2
                }}
              >
                {isAuto && <CheckIcon size={12} />}
              </div>
            </div>
          </div>

          {/* Active Policy Notice Strip */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius)',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              fontSize: 12.5,
              color: 'var(--text)',
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              {isAuto ? <SendIcon size={16} style={{ color: 'var(--accent)' }} /> : <ShieldCheckIcon size={16} style={{ color: 'var(--accent)' }} />}
            </span>
            <div>
              <strong>Policy Summary: </strong>
              {isAuto
                ? 'Actionable incoming emails will be replied to automatically in real time using your designated reply tone.'
                : 'All AI-generated replies will wait for your explicit review and one-click approval in your Inbox.'}
            </div>
          </div>
        </div>

        {/* Pop-up Bar Bottom Footer Bar */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border)',
            background: 'var(--surface2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap'
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            Account: <strong style={{ color: 'var(--text)' }}>{user?.email || 'Active Mailbox'}</strong>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
              disabled={saving}
              style={{ fontSize: 13, padding: '7px 16px' }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleApply}
              disabled={saving}
              style={{
                fontSize: 13,
                padding: '7px 20px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              {saving ? (
                <>
                  <span className="spinner" style={{ width: 12, height: 12 }} />
                  Applying…
                </>
              ) : (
                <>
                  <CheckIcon size={14} />
                  Save & Apply Mode
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
