// ─── Shared mock data & utilities ───────────────────────────────────────────

const MOCK_USER = {
  name: 'Alex Rivera', email: 'alex.rivera@gmail.com',
  provider: 'google', tone: 'professional', connected: true,
};

const MOCK_EMAILS = [
  {
    id:'em_001', sender:'Sarah Chen', senderEmail:'sarah.chen@designco.com',
    subject:'Q3 mockups ready for your review',
    receivedAt: new Date(Date.now()-8*60000).toISOString(),
    needsReply:true, category:'action_request', urgency:'high',
    summary:"Sarah's asking you to review the Q3 design mockups and share feedback before this Friday's team meeting.",
    senderType:'colleague',
    body:`Hi Alex,<br><br>The Q3 mockups are finally done and uploaded to Figma. Could you take a look before Friday? We need your sign-off before the team meeting.<br><br>Here's a quick preview:<br><img src="https://images.unsplash.com/photo-1618761714954-0b8cd0026356?auto=format&fit=crop&w=600&q=80" style="max-width:100%; border-radius:8px; margin:12px 0; display:block;" alt="Design Mockup"><br>Let me know if you have any questions!<br><br>Best,<br>Sarah`,
    draft:`Hi Sarah,\n\nThanks for sending these over — I'll take a look at the Q3 mockups in Figma and get you my feedback before Friday.\n\nIf anything stands out that needs a quick call to discuss, I'll ping you.\n\nBest,\nAlex`,
    draftStatus:'pending',
  },
  {
    id:'em_002', sender:'Mark Johnson', senderEmail:'mark.johnson@clientcorp.com',
    subject:'Re: Johnson Contract — final terms',
    receivedAt: new Date(Date.now()-35*60000).toISOString(),
    needsReply:true, category:'direct_question', urgency:'high',
    summary:"Mark is following up on the contract final terms and asking if you can hop on a call this week to align before signing.",
    senderType:'client',
    body:`Alex,<br><br>Following up on the contract we discussed. We've reviewed the updated terms and we're mostly aligned. Can we set up a 30-min call this week to go over the last two points before we sign?<br><br>Works best for me: Wednesday or Thursday afternoon.<br><br>Regards,<br>Mark`,
    draft:`Hi Mark,\n\nGreat to hear the terms are mostly aligned — we're getting close! Thursday afternoon works well for me. How does 2:00 PM sound? I'll send a calendar invite.\n\nLooking forward to wrapping this up.\n\nBest,\nAlex`,
    draftStatus:'pending',
  },
  {
    id:'em_003', sender:'Stripe', senderEmail:'receipts@stripe.com',
    subject:'Your July invoice is ready — $49.00',
    receivedAt: new Date(Date.now()-2*3600000).toISOString(),
    needsReply:false, category:'receipt', urgency:'low',
    summary:"Your Stripe subscription invoice for $49 in July has been processed. No action needed.",
    senderType:'automated',
    body:`Invoice #INV-2026-0742<br>Amount: $49.00<br>Status: Paid<br>Date: July 27, 2026`,
    draft:null, draftStatus:null,
  },
  {
    id:'em_004', sender:'Priya Mehta', senderEmail:'p.mehta@startup.io',
    subject:'Quick question about the API integration',
    receivedAt: new Date(Date.now()-4*3600000).toISOString(),
    needsReply:true, category:'direct_question', urgency:'medium',
    summary:"Priya has a quick question about authenticating with your API — she's getting a 401 error and wants to know if there's a step she's missing.",
    senderType:'colleague',
    body:`Hey Alex,<br><br>I'm trying to connect to the API using the token you shared last week, but I keep getting a 401 Unauthorized. Am I missing an additional header or scope?<br><br>Thanks,<br>Priya`,
    draft:`Hey Priya,\n\nThe 401 usually means the Authorization header format is off. Make sure you're sending it as:\nAuthorization: Bearer <your-token>\n\nAlso double-check that the token hasn't expired — they rotate every 24 hours. If you're still stuck, share the request headers and I can take a look.\n\nAlex`,
    draftStatus:'pending',
  },
  {
    id:'em_005', sender:'GitHub', senderEmail:'noreply@github.com',
    subject:'[GitHub] A new device signed in to your account',
    receivedAt: new Date(Date.now()-6*3600000).toISOString(),
    needsReply:false, category:'notification', urgency:'low',
    summary:"GitHub let you know a new device signed into your account. Likely you — but worth checking if it wasn't.",
    senderType:'automated',
    body:`A new device signed in to your GitHub account at 08:14 UTC.<br>Device: Chrome on Linux<br><br>If this was you, no action is needed. If not, secure your account immediately.`,
    draft:null, draftStatus:null,
  },
  {
    id:'em_006', sender:'TechCrunch Daily', senderEmail:'newsletter@techcrunch.com',
    subject:"Today's top stories: AI funding rounds hit record highs",
    receivedAt: new Date(Date.now()-8*3600000).toISOString(),
    needsReply:false, category:'newsletter', urgency:'low',
    summary:"TechCrunch's daily digest. AI startup funding hit a new quarterly record of $40B. No action needed.",
    senderType:'automated',
    body:`Today's headlines from TechCrunch.<br><br>• AI funding rounds reach $40B this quarter<br>• OpenAI announces new enterprise features<br>• 5 startups to watch this week`,
    draft:null, draftStatus:null,
  },
];

// ─── Utilities ───────────────────────────────────────────────────────────────

function timeAgo(iso) {
  const d = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (d < 1) return 'just now';
  if (d < 60) return `${d}m ago`;
  const h = Math.floor(d / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}

function avatarColor(name) {
  const colors = ['#7c6dfa','#a78bfa','#f59e0b','#22c55e','#f43f5e','#38bdf8','#ec4899','#fb923c'];
  return colors[name.charCodeAt(0) % colors.length];
}

function categoryLabel(c) {
  return {direct_question:'❓ Question',action_request:'⚡ Action',newsletter:'📰 Newsletter',
    receipt:'🧾 Receipt',notification:'🔔 Notification',social:'👥 Social',other:'📌 Other'}[c] || c;
}

function urgencyClass(u) {
  return {high:'badge-high',medium:'badge-medium',low:'badge-low'}[u] || 'badge-muted';
}

function el(tag, cls, html='') {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

function getUser() {
  try { return JSON.parse(localStorage.getItem('mailmind_user')) || MOCK_USER; }
  catch { return MOCK_USER; }
}

// ─── Sidebar renderer ─────────────────────────────────────────────────────────

function renderSidebar(activePage) {
  const user = getUser();
  const initial = user.name?.[0] || 'A';
  const navItems = [
    { href:'inbox.html', icon:'📥', label:'Inbox', badge:3, id:'inbox' },
    { href:'search.html', icon:'🔍', label:'Ask Inbox', badge:null, id:'search' },
    { href:'terminal.html', icon:'💻', label:'Terminal', badge:null, id:'terminal' },
    { href:'settings.html', icon:'⚙️', label:'Settings', badge:null, id:'settings' },
  ];
  const navHTML = navItems.map(n => `
    <a href="${n.href}" class="nav-item${activePage===n.id?' active':''}">
      <span class="nav-icon">${n.icon}</span>
      <span class="nav-label">${n.label}</span>
      ${n.badge ? `<span class="nav-badge">${n.badge}</span>` : ''}
    </a>`).join('');

  return `
  <aside class="sidebar" id="sidebar">
    <div class="sidebar-logo">
      <div class="logo-icon">✉️</div>
      <div class="logo-text">Mail<span>Mind</span></div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section-label">Navigation</div>
      ${navHTML}
      <div class="nav-section-label" style="margin-top:12px">Tools</div>
      <div class="nav-item" id="notif-toggle" style="position:relative">
        <span class="nav-icon">🔔</span>
        <span class="nav-label">Notifications</span>
        <span class="nav-badge" id="notif-count">2</span>
      </div>
    </nav>
    <div class="sidebar-bottom">
      <div class="user-chip" onclick="window.location.href='settings.html'">
        <div class="avatar" style="background:${avatarColor(user.name)}">${initial}</div>
        <div>
          <div class="user-name">${user.name}</div>
          <div class="user-email">${user.email}</div>
        </div>
      </div>
    </div>
  </aside>
  <!-- Notification panel -->
  <div id="notif-panel" style="display:none;position:fixed;left:248px;bottom:80px;z-index:300;width:300px;">
    <div class="card" style="box-shadow:var(--shadow-lg);border-color:var(--border2)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <span style="font-weight:700;font-size:14px">Notifications</span>
        <span style="font-size:12px;color:var(--accent);cursor:pointer" onclick="markAllRead()">Mark all read</span>
      </div>
      <div id="notif-list"></div>
    </div>
  </div>`;
}

const NOTIFS = [
  {icon:'📩',text:'New email from Sarah Chen',time:'8m ago',read:false},
  {icon:'📩',text:'Mark Johnson replied about the contract',time:'35m ago',read:false},
  {icon:'✅',text:'Reply sent to Priya Mehta',time:'2h ago',read:true},
];

function initSidebar() {
  document.getElementById('notif-toggle').addEventListener('click', () => {
    const p = document.getElementById('notif-panel');
    const open = p.style.display === 'none';
    p.style.display = open ? 'block' : 'none';
    if (open) renderNotifs();
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('#notif-toggle') && !e.target.closest('#notif-panel'))
      document.getElementById('notif-panel').style.display = 'none';
  });
}
function renderNotifs() {
  document.getElementById('notif-list').innerHTML = NOTIFS.map(n => `
    <div style="display:flex;gap:10px;padding:9px 0;border-bottom:1px solid var(--border);opacity:${n.read?.5:1}">
      <span style="font-size:16px;flex-shrink:0">${n.icon}</span>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:${n.read?400:600}">${n.text}</div>
        <div style="font-size:11px;color:var(--muted)">${n.time}</div>
      </div>
      ${!n.read ? '<span class="dot dot-green" style="margin-top:6px;flex-shrink:0"></span>' : ''}
    </div>`).join('');
}
function markAllRead() {
  NOTIFS.forEach(n => n.read = true);
  document.getElementById('notif-count').style.display = 'none';
  renderNotifs();
}
