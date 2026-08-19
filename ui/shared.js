// ─── Shared data & utilities ───────────────────────────────────────────

function getUser() {
  try { return JSON.parse(localStorage.getItem('mailmind_user')) || null; }
  catch { return null; }
}

const MOCK_EMAILS = [];


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

// ─── Sidebar renderer ─────────────────────────────────────────────────────────

function renderSidebar(activePage) {
  const user = getUser();
  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'User');
  const initial = displayName ? displayName[0].toUpperCase() : 'U';
  const navItems = [
    { href:'inbox.html', icon:'📥', label:'Inbox', badge:null, id:'inbox' },
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
      ${user && user.email ? `
      <div class="user-chip" onclick="window.location.href='settings.html'">
        <div class="avatar" style="background:${avatarColor(displayName)}">${initial}</div>
        <div>
          <div class="user-name">${displayName}</div>
          <div class="user-email">${user.email}</div>
        </div>
      </div>` : ''}
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
  {icon:'📩',text:'Email inbox monitoring active',time:'Just now',read:false},
  {icon:'🛡️',text:'Permission-first reply protection enabled',time:'Just now',read:false},
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
