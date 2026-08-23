'use client';
import { useState } from 'react';

export default function ComposeModal({
  user,
  initialTo = '',
  initialSubject = '',
  initialBody = '',
  inReplyTo = null,
  onClose,
  onSent
}) {
  const [to, setTo] = useState(initialTo);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleGenerateAI = () => {
    setGenerating(true);
    setTimeout(() => {
      const myName = (user?.name || (user?.email ? user.email.split('@')[0] : 'Me')).replace(/[._]/g, ' ');
      const cleanSubj = subject ? subject.replace(/^(re:\s*|fwd:\s*)+/i, '').trim() : 'our discussion';
      const recipientName = to ? (to.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())) : 'there';

      let aiDraft = '';
      if (user?.tone === 'brief') {
        aiDraft = `Hi ${recipientName},\n\nI'm writing regarding ${cleanSubj}. Please let me know when you have a moment to connect on next steps.\n\nBest,\n${myName}`;
      } else if (user?.tone === 'casual') {
        aiDraft = `Hey ${recipientName},\n\nHope you're having a great week! Wanted to quickly reach out regarding ${cleanSubj}.\n\nLooking forward to catching up soon!\n\nCheers,\n${myName}`;
      } else {
        aiDraft = `Dear ${recipientName},\n\nI hope this email finds you well.\n\nI am writing to you regarding ${cleanSubj}. Please let me know your thoughts on this matter and your availability for any follow-up discussions.\n\nThank you for your time and consideration.\n\nSincerely,\n${myName}`;
      }

      setBody(prev => (prev ? `${prev}\n\n${aiDraft}` : aiDraft));
      setGenerating(false);
    }, 400);
  };

  const handleInsertTemplate = (templateType) => {
    const myName = (user?.name || (user?.email ? user.email.split('@')[0] : 'Me')).replace(/[._]/g, ' ');
    const recipientName = to ? (to.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())) : 'there';

    let text = '';
    if (templateType === 'thanks') {
      text = `Hi ${recipientName},\n\nThank you so much for following up and for your support. I really appreciate your time and assistance.\n\nBest regards,\n${myName}`;
    } else if (templateType === 'followup') {
      text = `Hi ${recipientName},\n\nJust following up on our previous conversation regarding ${subject || 'our project'}. Looking forward to hearing your feedback whenever you get a chance.\n\nBest regards,\n${myName}`;
    } else if (templateType === 'intro') {
      text = `Hi ${recipientName},\n\nIt is great to connect with you. I wanted to introduce myself and explore potential opportunities to collaborate.\n\nLooking forward to staying in touch.\n\nBest,\n${myName}`;
    }

    setBody(text);
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!to || !to.includes('@')) {
      setError('Please provide a valid recipient email address.');
      return;
    }
    if (!subject.trim()) {
      setError('Please provide a subject line.');
      return;
    }
    if (!body.trim()) {
      setError('Message body cannot be empty.');
      return;
    }

    setSending(true);
    setError('');

    try {
      const payload = {
        email: user?.email,
        password: user?.password,
        provider: user?.provider,
        to,
        subject,
        body,
        inReplyTo
      };

      let res;
      try {
        res = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch {
        res = await fetch('http://localhost:3002/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSent && onSent({ to, subject, body });
          onClose();
        }, 1200);
      } else {
        setError(data.error || 'Failed to send email. Check your SMTP settings and credentials.');
      }
    } catch (err) {
      setError('Network error while sending email: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 640 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
            {inReplyTo ? '↩️ Reply to Email' : '✉️ Compose New Email'}
          </h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '4px 8px' }}>
            ✕
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid var(--danger)',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 13,
            color: '#fca5a5',
            marginBottom: 16
          }}>
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid var(--success)',
            borderRadius: 8,
            padding: '12px 14px',
            fontSize: 14,
            color: '#86efac',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            ✅ Email sent successfully!
          </div>
        )}

        <form onSubmit={handleSend}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>
              To:
            </label>
            <input
              type="email"
              required
              className="input"
              placeholder="recipient@example.com"
              value={to}
              onChange={e => setTo(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>
              Subject:
            </label>
            <input
              type="text"
              required
              className="input"
              placeholder="Enter subject..."
              value={subject}
              onChange={e => setSubject(e.target.value)}
            />
          </div>

          {/* Quick AI & Template Toolbar */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Quick Draft:
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 11, padding: '3px 10px', background: 'var(--accent-glow)', color: 'var(--accent)', borderColor: 'var(--accent)' }}
              onClick={handleGenerateAI}
              disabled={generating}
            >
              {generating ? '✨ Generating…' : '✨ AI Draft Assistant'}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 11, padding: '3px 8px' }}
              onClick={() => handleInsertTemplate('followup')}
            >
              ⚡ Follow-up
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 11, padding: '3px 8px' }}
              onClick={() => handleInsertTemplate('thanks')}
            >
              🙏 Thank You
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 11, padding: '3px 8px' }}
              onClick={() => handleInsertTemplate('intro')}
            >
              🤝 Introduction
            </button>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>
              Message:
            </label>
            <textarea
              required
              className="input"
              rows={8}
              placeholder="Write your email message here..."
              value={body}
              onChange={e => setBody(e.target.value)}
              style={{ minHeight: 180, lineHeight: 1.6 }}
            />
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
              disabled={sending}
            >
              Discard
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={sending || success}
              >
                {sending ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Sending…</> : '🚀 Send Email'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
