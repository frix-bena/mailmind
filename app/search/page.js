'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopbarUserButton from '@/components/TopbarUserButton';
import ThemeToggle from '@/components/ThemeToggle';
import GoogleAccountModal from '@/components/GoogleAccountModal';
import { getActiveUser, isDemoAccount } from '@/lib/account-manager';
import {
  SearchIcon,
  DocumentIcon,
  CopyIcon,
  CheckIcon,
  CloseIcon,
  InboxIcon,
  ChevronRightIcon,
  MenuIcon
} from '@/components/Icons';

const SUGGESTIONS = [
  'Summarize what I missed this week',
  'Find emails about invoices or receipts',
  'Any urgent emails I haven\'t replied to?',
  'Show me all receipts from this month',
  'Who emailed me the most in my history?'
];

const CATEGORIES = [
  { label: 'Weekly Summary', query: 'Summarize what I missed this week' },
  { label: 'Pending Actions', query: 'Any urgent emails I haven\'t replied to?' },
  { label: 'Invoices & Receipts', query: 'Find emails about invoices or receipts' },
  { label: 'Top Senders', query: 'Who emailed me the most in my history?' },
  { label: 'Unanswered Questions', query: 'Show emails with questions for me' },
];

function renderAnswer(text) {
  return text.split('\n').map((line, i) => {
    const parts = line.split(/\*\*(.*?)\*\*/g);
    const rendered = parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p);
    if (line.startsWith('•') || line.startsWith('-')) {
      return (
        <div key={i} style={{ paddingLeft: 16, position: 'relative', margin: '3px 0' }}>
          <span style={{ position: 'absolute', left: 0, color: 'var(--accent)' }}>•</span>
          {rendered}
        </div>
      );
    }
    if (line.startsWith('###')) {
      return (
        <div key={i} style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, marginTop: 12, marginBottom: 4, color: 'var(--text)' }}>
          {line.replace('###', '')}
        </div>
      );
    }
    if (!line.trim()) return <div key={i} style={{ height: 10 }} />;
    return <div key={i} style={{ margin: '2px 0' }}>{rendered}</div>;
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
  const [historyScope] = useState('All Archives');

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
      router.prefetch('/inbox');
      router.prefetch('/settings');
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
            <MenuIcon size={16} />
          </button>
          <span className="topbar-title">Ask AI</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span className="chip hide-on-mobile" style={{ fontSize: 11.5 }}>
              Scope: {historyScope}
            </span>
            <ThemeToggle />
            <TopbarUserButton user={user} onClick={() => setUserModalOpen(true)} />
          </div>
        </div>
        <div className="page-content">
          {/* Header */}
          <div style={{ textAlign: 'center', paddingTop: 16, marginBottom: 28 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.3px', marginBottom: 8 }}>
              Query your inbox archives
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: 13.5, maxWidth: 520, margin: '0 auto' }}>
              Synthesize past threads, trace action items, and extract key decisions across your message history for {user?.email || 'your mailbox'}.
            </p>
          </div>

          {/* Curated Topic Filters */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.label}
                onClick={() => { setQuery(cat.query); handleSearch(cat.query); }}
                className="chip"
                style={{
                  cursor: 'pointer',
                  background: 'var(--surface2)',
                  fontSize: 12,
                  padding: '5px 12px'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div style={{ position: 'relative', marginBottom: 24 }}>
            <input
              className="input"
              placeholder="e.g. 'Summarize decisions made this week' or 'Find recent invoices'"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              style={{ paddingRight: 110, fontSize: 14, padding: '13px 110px 13px 14px' }}
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setAnswer(null); }}
                style={{
                  position: 'absolute',
                  right: 90,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Clear input"
              >
                <CloseIcon size={13} />
              </button>
            )}
            <button
              className="btn btn-primary btn-sm"
              onClick={() => handleSearch()}
              disabled={loading || !query.trim()}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', padding: '6px 14px' }}
            >
              {loading ? (
                <><span className="spinner" style={{ width: 13, height: 13 }} /> Analyzing…</>
              ) : (
                'Search'
              )}
            </button>
          </div>

          {/* Suggestions */}
          {!answer && !loading && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>
                Suggested inquiries
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 40 }}>
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    className="chip"
                    onClick={() => { setQuery(s); handleSearch(s); }}
                    style={{ cursor: 'pointer', fontSize: 12.5, padding: '6px 12px' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading state: Real skeleton card */}
          {loading && (
            <div className="card fade-in" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 6 }} />
                <div>
                  <div className="skeleton" style={{ width: 180, height: 14, marginBottom: 6 }} />
                  <div className="skeleton" style={{ width: 130, height: 11 }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="skeleton" style={{ width: '96%', height: 13 }} />
                <div className="skeleton" style={{ width: '92%', height: 13 }} />
                <div className="skeleton" style={{ width: '88%', height: 13 }} />
                <div className="skeleton" style={{ width: '75%', height: 13 }} />
              </div>
            </div>
          )}

          {/* Answer section */}
          {answer && !loading && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  Analysis for &quot;{lastQuery}&quot;
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={handleCopyAnswer}
                  style={{ fontSize: 11.5, padding: '4px 9px', display: 'flex', alignItems: 'center', gap: 5 }}
                  title="Copy analysis"
                >
                  {copied ? <><CheckIcon size={12} /> Copied</> : <><CopyIcon size={12} /> Copy Analysis</>}
                </button>
              </div>

              <div className="card" style={{
                lineHeight: 1.75,
                fontSize: 14,
                padding: 24
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: 'var(--accent-subtle)',
                    color: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <DocumentIcon size={16} />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                      Inbox Intelligence Synthesis
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                      Extracted across historical messages
                    </div>
                  </div>
                </div>

                <div style={{ lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--text)' }}>
                  {renderAnswer(answer)}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setAnswer(null); setQuery(''); }}
                >
                  New inquiry
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => router.push('/inbox')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <InboxIcon size={13} /> Back to Inbox
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
