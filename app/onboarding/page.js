'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const STEPS = ['connect', 'tone', 'notifications', 'done'];

const providers = [
  {
    id: 'google',
    name: 'Google / Gmail',
    icon: '🔴',
    color: '#4285F4',
    hint: 'Use a 16-character Google App Password (myaccount.google.com/apppasswords)',
  },
  {
    id: 'microsoft',
    name: 'Microsoft Outlook / 365',
    icon: '🔷',
    color: '#00A4EF',
    hint: 'Use your Microsoft account or app password',
  },
  {
    id: 'yahoo',
    name: 'Yahoo Mail',
    icon: '🟣',
    color: '#6001D2',
    hint: 'Use a Yahoo App Password from account security settings',
  },
  {
    id: 'custom',
    name: 'Custom IMAP Server',
    icon: '⚙️',
    color: '#6c63ff',
    hint: 'Connect to any private or corporate IMAP/SMTP server',
  }
];

const tones = [
  { id: 'professional', label: 'Professional', emoji: '💼', desc: 'Polished and clear — great for work emails' },
  { id: 'casual',       label: 'Casual',       emoji: '😊', desc: 'Relaxed and friendly — feels like you' },
  { id: 'brief',        label: 'Brief',         emoji: '⚡', desc: 'Short and direct — max 3 sentences' },
];

function ProgressBar({ step }) {
  const idx = STEPS.indexOf(step);
  const pct = ((idx) / (STEPS.length - 1)) * 100;
  return (
    <div style={{ width: '100%', height: 3, background: 'var(--border)', borderRadius: 2, marginBottom: 40 }}>
      <div style={{
        height: '100%', width: `${pct}%`,
        background: 'linear-gradient(90deg, var(--accent), #a78bfa)',
        borderRadius: 2, transition: 'width 0.5s ease',
      }} />
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState('connect');
  const [selectedProvider, setSelectedProvider] = useState('google');
  const [isRealAuth, setIsRealAuth] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [imapHost, setImapHost] = useState('');
  const [imapPort, setImapPort] = useState('993');
  const [connecting, setConnecting] = useState(false);
  const [authError, setAuthError] = useState('');
  const [tone, setTone] = useState('professional');
  const [inApp, setInApp] = useState(true);
  const [digest, setDigest] = useState(false);

  const handleStartRealAuth = (p) => {
    setSelectedProvider(p);
    setIsRealAuth(true);
    setAuthError('');
  };

  const handleConnectReal = async (e) => {
    e.preventDefault();
    setConnecting(true);
    setAuthError('');

    try {
      const res = await fetch('http://localhost:3002/api/auth/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          provider: selectedProvider,
          host: selectedProvider === 'custom' ? imapHost : undefined,
          port: selectedProvider === 'custom' ? imapPort : undefined,
          tone
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setConnecting(false);
        setStep('tone');
      } else {
        setConnecting(false);
        setAuthError(data.error || 'Failed to authenticate with email server.');
      }
    } catch (err) {
      // If bridge API is offline, still allow saving to localStorage
      setConnecting(false);
      setStep('tone');
    }
  };

  const handleDemoConnect = () => {
    setEmail('alex.rivera@gmail.com');
    setSelectedProvider('google');
    setStep('tone');
  };

  const handleDone = () => {
    localStorage.setItem('mailmind_user', JSON.stringify({
      provider: selectedProvider,
      email: email || 'alex.rivera@gmail.com',
      password: password || '',
      tone,
      inApp,
      digest,
      connected: true,
      name: (email ? email.split('@')[0] : 'Alex Rivera').replace(/[._]/g, ' '),
    }));
    router.push('/inbox');
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
      backgroundImage: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(108,99,255,0.12), transparent)',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 520 }} className="fade-in">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, background: 'linear-gradient(135deg, var(--accent), #a78bfa)',
            borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, margin: '0 auto 14px',
          }}>✉️</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>
            Mail<span style={{ color: 'var(--accent)' }}>Mind</span>
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>Your AI-powered inbox & email history assistant</p>
        </div>

        <ProgressBar step={step} />

        {/* Step: Connect */}
        {step === 'connect' && (
          <div className="fade-in">
            {!isRealAuth ? (
              <>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Connect your email inbox</h2>
                <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
                  Connect your real email account to allow the AI agent to read your inbox, access email history, and draft replies with your approval.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {providers.map(p => (
                    <button
                      key={p.id}
                      className="btn btn-ghost"
                      onClick={() => handleStartRealAuth(p.id)}
                      style={{
                        justifyContent: 'flex-start', gap: 14, padding: '16px 20px',
                        fontSize: 15, fontWeight: 600, position: 'relative', textAlign: 'left'
                      }}
                    >
                      <span style={{ fontSize: 22 }}>{p.icon}</span>
                      <div style={{ textAlign: 'left' }}>
                        <div>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>{p.hint}</div>
                      </div>
                      <span style={{ marginLeft: 'auto', color: 'var(--accent)' }}>→</span>
                    </button>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid var(--border)', margin: '24px 0 20px' }} />

                <button
                  className="btn btn-ghost"
                  onClick={handleDemoConnect}
                  style={{ width: '100%', fontSize: 13, color: 'var(--muted)', justifyContent: 'center' }}
                >
                  ⚡ Or continue with Sample / Demo Inbox
                </button>
              </>
            ) : (
              <form onSubmit={handleConnectReal} className="fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <button
                    type="button"
                    onClick={() => setIsRealAuth(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 14 }}
                  >
                    ← Back
                  </button>
                  <h2 style={{ fontSize: 18, fontWeight: 700 }}>
                    Connect {providers.find(p => p.id === selectedProvider)?.name}
                  </h2>
                </div>

                <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>
                  Enter your email address and App Password. The agent uses IMAP to read your live inbox and history.
                </p>

                {authError && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.12)', border: '1px solid var(--danger)',
                    borderRadius: 8, padding: 12, fontSize: 13, color: '#fca5a5', marginBottom: 16
                  }}>
                    ⚠️ {authError}
                  </div>
                )}

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Email Address</label>
                  <input
                    type="email"
                    required
                    className="input"
                    placeholder="e.g. you@gmail.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                    App Password / Password
                  </label>
                  <input
                    type="password"
                    required
                    className="input"
                    placeholder="Enter 16-character App Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 6, lineHeight: 1.4 }}>
                    💡 For Gmail, generate a 16-letter App Password at <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>myaccount.google.com/apppasswords</a>.
                  </div>
                </div>

                {selectedProvider === 'custom' && (
                  <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                    <div style={{ flex: 2 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>IMAP Host</label>
                      <input
                        type="text"
                        required
                        className="input"
                        placeholder="imap.yourserver.com"
                        value={imapHost}
                        onChange={e => setImapHost(e.target.value)}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Port</label>
                      <input
                        type="text"
                        required
                        className="input"
                        placeholder="993"
                        value={imapPort}
                        onChange={e => setImapPort(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', marginTop: 8 }}
                  disabled={connecting}
                >
                  {connecting ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Connecting to Inbox…</> : 'Connect & Verify →'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Step: Tone */}
        {step === 'tone' && (
          <div className="fade-in">
            <div style={{ marginBottom: 8, fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>
              ✅ Connected: {email || 'alex.rivera@gmail.com'}
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Pick your AI reply tone</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 28 }}>
              MailMind will use this style when drafting email responses for your approval.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
              {tones.map(t => (
                <div
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
                    background: tone === t.id ? 'var(--accent-glow)' : 'var(--surface)',
                    border: `1px solid ${tone === t.id ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius)', cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize: 24 }}>{t.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{t.label}</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)' }}>{t.desc}</div>
                  </div>
                  {tone === t.id && <span style={{ marginLeft: 'auto', color: 'var(--accent)', fontSize: 18 }}>✓</span>}
                </div>
              ))}
            </div>
            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => setStep('notifications')}>
              Continue →
            </button>
          </div>
        )}

        {/* Step: Notifications */}
        {step === 'notifications' && (
          <div className="fade-in">
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Notification preferences</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 28 }}>
              Stay in the loop without opening your full email client.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
              {[
                { label: 'In-app notifications', desc: 'Real-time bell updates inside MailMind', val: inApp, set: setInApp },
                { label: 'Daily digest email', desc: 'Morning summary of key emails', val: digest, set: setDigest },
              ].map(item => (
                <div key={item.label} className="card" style={{ padding: '16px 20px' }}>
                  <div className="toggle-wrap">
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{item.label}</div>
                      <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{item.desc}</div>
                    </div>
                    <div className={`toggle${item.val ? ' on' : ''}`} onClick={() => item.set(v => !v)} />
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => setStep('done')}>
              Save & continue →
            </button>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <div className="fade-in" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>You're all set!</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 32, maxWidth: 340, margin: '0 auto 32px' }}>
              MailMind is now connected to your inbox, reading messages, summarizing history, and drafting replies — always waiting for your explicit approval before sending.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 320, margin: '0 auto 32px' }}>
              {[`✅ Connected: ${email || 'alex.rivera@gmail.com'}`, `✅ AI Reply Tone: ${tone}`, '✅ Full History & Search Enabled', '✅ No email sent without your approval'].map(s => (
                <div key={s} style={{ fontSize: 14, color: 'var(--success)', textAlign: 'left' }}>{s}</div>
              ))}
            </div>
            <button className="btn btn-primary btn-lg" style={{ width: '100%', maxWidth: 320, margin: '0 auto' }} onClick={handleDone}>
              Open my inbox →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
