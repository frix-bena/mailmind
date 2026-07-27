'use client';
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { mockUser, mockEmails } from '@/lib/mockData';

const SUGGESTIONS = [
  'Summarize what I missed this week',
  'Find emails about the Johnson contract',
  'Any urgent emails I haven\'t replied to?',
  'Show me all receipts from this month',
];

function generateAnswer(query, emails) {
  const q = query.toLowerCase();

  if (q.includes('week') || q.includes('miss')) {
    const total = emails.length;
    const needsReply = emails.filter(e => e.needs_reply);
    const newsletters = emails.filter(e => e.category === 'newsletter' || e.category === 'receipt' || e.category === 'notification');
    return `Here's your inbox summary:\n\nYou received **${total} emails** total. Here's what stands out:\n\n${needsReply.map(e => `• **${e.sender_name}** — ${e.ai_summary}`).join('\n')}\n\n📰 ${newsletters.length} newsletters/receipts/notifications that needed no action.\n\nYou have **${needsReply.length} emails still waiting for a reply**.`;
  }

  if (q.includes('johnson') || q.includes('contract')) {
    const match = emails.find(e => e.subject.toLowerCase().includes('johnson') || e.ai_summary.toLowerCase().includes('contract'));
    if (match) return `Found 1 email about the Johnson contract:\n\n**From:** ${match.sender_name}\n**Subject:** ${match.subject}\n\n${match.ai_summary}\n\nThis email is marked as **${match.urgency} urgency** and is waiting for your reply.`;
    return 'No emails matching "Johnson contract" found in the current inbox window.';
  }

  if (q.includes('urgent') || q.includes('reply')) {
    const urgent = emails.filter(e => e.needs_reply && e.draft?.status === 'pending_approval');
    if (!urgent.length) return '✅ You\'re all caught up! No urgent unanswered emails right now.';
    return `You have **${urgent.length} emails waiting for a reply**:\n\n${urgent.map(e => `• **${e.sender_name}** (${e.urgency} urgency) — ${e.ai_summary}`).join('\n')}`;
  }

  if (q.includes('receipt') || q.includes('invoice')) {
    const receipts = emails.filter(e => e.category === 'receipt');
    if (!receipts.length) return 'No receipts found in your current inbox window.';
    return `Found **${receipts.length} receipt(s)**:\n\n${receipts.map(e => `• **${e.sender_name}** — ${e.ai_summary}`).join('\n')}`;
  }

  // Generic fallback
  const relevant = emails.filter(e =>
    e.subject.toLowerCase().includes(q) ||
    e.sender_name.toLowerCase().includes(q) ||
    e.ai_summary.toLowerCase().includes(q)
  );
  if (relevant.length) {
    return `Found **${relevant.length} related email(s)**:\n\n${relevant.map(e => `• **${e.sender_name}** — ${e.ai_summary}`).join('\n')}`;
  }
  return `I searched through your inbox but couldn't find anything specifically about "${query}". Try rephrasing — e.g. "find emails from [name]" or "any invoices this month".`;
}

function renderAnswer(text) {
  // Simple markdown-lite: bold, line breaks, bullets
  return text.split('\n').map((line, i) => {
    const parts = line.split(/\*\*(.*?)\*\*/g);
    const rendered = parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p);
    if (line.startsWith('•')) return <div key={i} style={{ paddingLeft: 16, position: 'relative' }}><span style={{ position: 'absolute', left: 0 }}>•</span>{rendered}</div>;
    if (!line.trim()) return <div key={i} style={{ height: 12 }} />;
    return <div key={i}>{rendered}</div>;
  });
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [lastQuery, setLastQuery] = useState('');

  const handleSearch = (q) => {
    const finalQ = q || query;
    if (!finalQ.trim()) return;
    setLastQuery(finalQ);
    setLoading(true);
    setAnswer(null);
    // Simulate n8n webhook call + AI response
    setTimeout(() => {
      setAnswer(generateAnswer(finalQ, mockEmails));
      setLoading(false);
    }, 1400);
  };

  return (
    <div className="app-shell">
      <Sidebar user={mockUser} />
      <div className="main-area">
        <div className="topbar">
          <span className="topbar-title">🔍 Ask your inbox</span>
        </div>
        <div className="page-content">
          {/* Hero */}
          <div style={{ textAlign: 'center', paddingTop: 24, marginBottom: 40 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5, marginBottom: 8 }}>
              Ask anything about your inbox
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: 15 }}>
              Natural language queries — get plain-English answers, not raw email dumps.
            </p>
          </div>

          {/* Search box */}
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <input
              className="input"
              placeholder='e.g. "Summarize what I missed this week" or "Find emails about the Johnson contract"'
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              style={{ paddingRight: 120, fontSize: 15, padding: '14px 120px 14px 16px' }}
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={() => handleSearch()}
              disabled={loading || !query.trim()}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}
            >
              {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Searching</> : 'Ask →'}
            </button>
          </div>

          {/* Suggestions */}
          {!answer && !loading && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
                Try asking…
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 40 }}>
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    className="chip"
                    onClick={() => { setQuery(s); handleSearch(s); }}
                    style={{ cursor: 'pointer', transition: 'all 0.2s', fontSize: 13 }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="card fade-in" style={{ padding: 32, textAlign: 'center' }}>
              <div className="spinner" style={{ width: 28, height: 28, margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>Searching through your emails…</p>
            </div>
          )}

          {/* Answer */}
          {answer && !loading && (
            <div className="fade-in">
              <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
                Answer for: "{lastQuery}"
              </div>
              <div className="card" style={{ lineHeight: 1.8, fontSize: 14 }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: 22 }}>🤖</span>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px', paddingTop: 4 }}>AI Analysis</div>
                </div>
                <div style={{ lineHeight: 1.9, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {renderAnswer(answer)}
                </div>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => { setAnswer(null); setQuery(''); }}
                style={{ marginTop: 16 }}
              >
                ← Ask something else
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
