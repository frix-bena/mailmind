'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopbarUserButton from '@/components/TopbarUserButton';
import GoogleAccountModal from '@/components/GoogleAccountModal';
import { getActiveUser, isDemoAccount } from '@/lib/account-manager';

const SUGGESTIONS = [
  'Summarize what I missed this week',
  'Find emails about invoices or receipts',
  'Any urgent emails I haven\'t replied to?',
  'Show me all receipts from this month',
  'Who emailed me the most in my history?'
];

const CATEGORIES = [
  { label: '📊 Weekly Summary', query: 'Summarize what I missed this week' },
  { label: '⚡ Urgent Action Required', query: 'Any urgent emails I haven\'t replied to?' },
  { label: '🧾 Invoices & Receipts', query: 'Find emails about invoices or receipts' },
  { label: '👥 Top Senders', query: 'Who emailed me the most in my history?' },
  { label: '🔍 Recent Questions', query: 'Show emails with questions for me' },
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

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [lastQuery, setLastQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [historyScope] = useState('All Email History');

  const handleSearch = async (q) => {
    const finalQ = q || query;
    if (!finalQ || !finalQ.trim()) return;
    setLastQuery(finalQ);
    setLoading(true);
    setAnswer(null);

    try {
      let res;
      const reqBody = JSON.stringify({
        email: user?.email,
        password: user?.password,
        provider: user?.provider,
        question: finalQ
      });

      try {
        res = await fetch('/api/ask-inbox', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: reqBody
        });
      } catch {
        res = await fetch('http://localhost:3002/api/ask-inbox', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: reqBody
        });
      }

      const data = await res.json();
      if (res.ok && data.success && data.answer) {
        setAnswer(data.answer);
      } else {
        setAnswer(data.error || `No emails found in history matching "${finalQ}".`);
      }
    } catch {
      setAnswer(`Unable to query email history.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const stored = getActiveUser();
    if (stored && stored.connected && stored.email && !isDemoAccount(stored)) {
      setUser(stored);
      const qParam = searchParams?.get('q');
      if (qParam) {
        setQuery(qParam);
        handleSearch(qParam);
      }
    } else {
      router.replace('/onboarding');
      return;
    }

    const handleAccountSwitched = (e) => {
      if (e.detail && e.detail.email && !isDemoAccount(e.detail)) {
        setUser(e.detail);
        setAnswer(null);
      } else {
        router.replace('/onboarding');
      }
    };
    window.addEventListener('mailmind:account-switched', handleAccountSwitched);

    return () => {
      window.removeEventListener('mailmind:account-switched', handleAccountSwitched);
    };
  }, [searchParams, router]);

  const handleCopyAnswer = () => {
    if (!answer) return;
    navigator.clipboard.writeText(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          <span className="topbar-title">🔍 Ask AI</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span className="chip hide-on-mobile" style={{ fontSize: 11.5 }}>
              📜 {historyScope}
            </span>
            <TopbarUserButton user={user} onClick={() => setUserModalOpen(true)} />
          </div>
        </div>
        <div className="page-content">
          {/* Hero */}
          <div style={{ textAlign: 'center', paddingTop: 20, marginBottom: 32 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5, marginBottom: 8 }}>
              Ask anything about your emails & history
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>
              Natural language queries over live messages and past email archives for {user?.email || 'your inbox'}.
            </p>
          </div>

          {/* Quick Categories Bar */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.label}
                onClick={() => { setQuery(cat.query); handleSearch(cat.query); }}
                className="chip"
                style={{
                  cursor: 'pointer',
                  background: 'var(--surface2)',
                  borderColor: 'var(--border2)',
                  fontSize: 12.5,
                  padding: '6px 14px'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <input
              className="input"
              placeholder='e.g. "Summarize what I missed this week" or "Find invoice emails"'
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              style={{ paddingRight: 130, fontSize: 15, padding: '14px 130px 14px 16px' }}
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setAnswer(null); }}
                style={{
                  position: 'absolute',
                  right: 104,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  fontSize: 14,
                  padding: 4
                }}
                title="Clear input"
              >
                ✕
              </button>
            )}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  AI Analysis for: "{lastQuery}"
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={handleCopyAnswer}
                  style={{ fontSize: 12, padding: '4px 10px' }}
                  title="Copy analysis"
                >
                  {copied ? '✅ Copied' : '📋 Copy Analysis'}
                </button>
              </div>

              <div className="card agent-card-bg" style={{
                lineHeight: 1.8,
                fontSize: 14,
                border: '1px solid rgba(124, 109, 250, 0.3)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.35)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    backgroundImage: `url("https://plus.unsplash.com/premium_photo-1680404114169-e254afa55a16?w=1920&auto=format&fit=crop&q=80&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NjZ8fHRlY2h8ZW58MHx8MHx8fDA%3D")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: '1.5px solid var(--accent)',
                    boxShadow: '0 0 10px var(--accent-glow)',
                    flexShrink: 0
                  }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                      Agent Intelligence Response
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                      Analyzed across email history
                    </div>
                  </div>
                </div>
                <div style={{ lineHeight: 1.9, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {renderAnswer(answer)}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setAnswer(null); setQuery(''); }}
                >
                  ← Ask another question
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => router.push('/inbox')}
                >
                  📥 Go to Inbox
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {userModalOpen && (
        <GoogleAccountModal
          user={user}
          onClose={() => setUserModalOpen(false)}
          onOpenCompose={() => router.push('/inbox')}
          onDisconnect={async () => {
            try {
              await fetch('/api/auth/disconnect', { method: 'POST' });
            } catch {}
            localStorage.removeItem('mailmind_user');
            router.replace('/onboarding');
          }}
          onUserUpdate={(updated) => setUser(updated)}
          onAccountSwitch={(switched) => {
            setUser(switched);
            setAnswer(null);
          }}
        />
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
