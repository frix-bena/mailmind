'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

const SUGGESTIONS = [
  'Summarize what I missed this week',
  'Find emails about invoices or receipts',
  'Any urgent emails I haven\'t replied to?',
  'Show me all receipts from this month',
  'Who emailed me the most in my history?'
];

function renderAnswer(text) {
  return text.split('\n').map((line, i) => {
    const parts = line.split(/\*\*(.*?)\*\*/g);
    const rendered = parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p);
    if (line.startsWith('•') || line.startsWith('-')) return <div key={i} style={{ paddingLeft: 16, position: 'relative' }}><span style={{ position: 'absolute', left: 0 }}>•</span>{rendered}</div>;
    if (line.startsWith('###')) return <div key={i} style={{ fontWeight: 700, fontSize: 15, marginTop: 8, marginBottom: 4, color: 'var(--text)' }}>{line.replace('###', '')}</div>;
    if (!line.trim()) return <div key={i} style={{ height: 12 }} />;
    return <div key={i}>{rendered}</div>;
  });
}

export default function SearchPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [lastQuery, setLastQuery] = useState('');
  const [historyScope] = useState('All Email History');

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('mailmind_user') || 'null');
      if (stored && stored.connected && stored.email) {
        setUser(stored);
      } else {
        router.replace('/onboarding');
      }
    } catch {
      router.replace('/onboarding');
    }
  }, [router]);

  const handleSearch = async (q) => {
    const finalQ = q || query;
    if (!finalQ.trim()) return;
    setLastQuery(finalQ);
    setLoading(true);
    setAnswer(null);

    try {
      const res = await fetch('http://localhost:3002/api/ask-inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user?.email,
          password: user?.password,
          provider: user?.provider,
          question: finalQ
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.answer) {
        setAnswer(data.answer);
      } else {
        setAnswer(data.error || `No emails found in history matching "${finalQ}". Ensure your email account is connected and synced.`);
      }
    } catch {
      setAnswer(`Unable to reach the email bridge API. Ensure the bridge is running ('npm run api' or 'npm run agent') to query your email history for "${finalQ}".`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar user={user} />
      <div className="main-area">
        <div className="topbar">
          <span className="topbar-title">🔍 Ask your inbox & email history</span>
          <span className="chip" style={{ fontSize: 12 }}>
            📜 {historyScope}
          </span>
        </div>
        <div className="page-content">
          {/* Hero */}
          <div style={{ textAlign: 'center', paddingTop: 24, marginBottom: 36 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5, marginBottom: 8 }}>
              Ask anything about your emails & history
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: 15 }}>
              Natural language queries over live messages and past email archives for {user?.email || 'your inbox'}.
            </p>
          </div>

          {/* Search box */}
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <input
              className="input"
              placeholder='e.g. "Summarize what I missed this week" or "Find invoice emails"'
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
              {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Asking…</> : 'Ask AI →'}
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
            <div className="card fade-in" style={{ padding: 36, textAlign: 'center' }}>
              <div className="spinner" style={{ width: 28, height: 28, margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>Accessing email history and analyzing messages for {user?.email}…</p>
            </div>
          )}

          {/* Answer */}
          {answer && !loading && (
            <div className="fade-in">
              <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
                AI Analysis for: "{lastQuery}"
              </div>
              <div className="card" style={{ lineHeight: 1.8, fontSize: 14 }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: 22 }}>🤖</span>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px', paddingTop: 4 }}>Agent Intelligence Response</div>
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
                ← Ask another question
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
