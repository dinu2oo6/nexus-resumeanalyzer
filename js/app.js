/* ===== APP.JS — Router, State, Navigation ===== */

firebase.initializeApp(FIREBASE_CONFIG);
const auth = firebase.auth();
const db = firebase.firestore();
const analytics = firebase.analytics();

const AppState = {
  user: null,
  currentPage: 'dashboard',
  resumes: [],
  currentResume: null,
  analyticsData: { downloads: 0, aiAssists: 0 }
};

const App = {
  navigate(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const pageEl = document.getElementById(`page-${page}`);
    const navEl = document.querySelector(`.nav-item[data-page="${page}"]`);

    if (pageEl) pageEl.classList.add('active');
    if (navEl) navEl.classList.add('active');

    AppState.currentPage = page;

    const titles = {
      dashboard: 'DASHBOARD',
      resumes: 'MY RESUMES',
      builder: 'RESUME BUILDER',
      ai: 'AI FEATURES',
      jobs: 'JOB MATCHER',
      analytics: 'ANALYTICS'
    };

    document.getElementById('topbarTitle').textContent = titles[page] || page.toUpperCase();

    const hideNewBtn = ['builder', 'analytics'];
    document.getElementById('newResumeBtn').style.display = hideNewBtn.includes(page) ? 'none' : '';

    if (page === 'dashboard') App.refreshDashboard();
    if (page === 'resumes') App.refreshResumeList();
    if (page === 'analytics') Analytics.refresh();
  },

  async refreshDashboard() {
    const resumes = AppState.resumes;
    document.getElementById('dash-total').textContent = resumes.length;

    const scores = resumes.filter(r => r.atsScore > 0).map(r => r.atsScore);
    document.getElementById('dash-ats').textContent = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) + '%'
      : '—';

    const analytics = AppState.analyticsData;
    document.getElementById('dash-downloads').textContent = analytics.downloads || 0;
    document.getElementById('dash-assists').textContent = analytics.aiAssists || 0;

    document.getElementById('resumeCountBadge').textContent = resumes.length;

    // Recent activity
    const actEl = document.getElementById('recentActivity');
    if (resumes.length === 0) {
      actEl.innerHTML = '<div class="empty-state" style="padding:20px"><p style="font-size:12px">No activity yet.</p></div>';
    } else {
      const sorted = [...resumes].sort((a, b) => (b.lastModified?.seconds || 0) - (a.lastModified?.seconds || 0)).slice(0, 4);
      actEl.innerHTML = sorted.map(r => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--text)">${r.title || 'Untitled'}</div>
            <div style="font-family:'Space Mono',monospace;font-size:9px;color:var(--text2);margin-top:2px">${formatDate(r.lastModified)}</div>
          </div>
          <div style="font-family:'Orbitron',sans-serif;font-size:13px;color:var(--cyan)">${r.atsScore ? r.atsScore + '%' : '—'}</div>
        </div>
      `).join('');
    }

    // Dashboard resume list (compact)
    const drEl = document.getElementById('dashResumeList');
    if (resumes.length === 0) {
      drEl.innerHTML = '<div class="empty-state" style="padding:20px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:36px;height:36px;opacity:0.3;display:block;margin:0 auto 8px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg><p>No resumes yet</p><button class="btn btn-cyan" onclick="App.navigate(\'builder\'); ResumeBuilder.newResume()">Create First Resume</button></div>';
    } else {
      drEl.innerHTML = '<div class="resume-list">' + resumes.slice(0, 3).map(r => renderResumeCard(r)).join('') + '</div>';
      if (resumes.length > 3) {
        drEl.innerHTML += `<div style="text-align:center;margin-top:12px"><button class="btn btn-sm" style="border-color:var(--border);color:var(--text2)" onclick="App.navigate('resumes')">VIEW ALL ${resumes.length} RESUMES</button></div>`;
      }
    }
  },

  refreshResumeList() {
    const el = document.getElementById('resumeList');
    if (AppState.resumes.length === 0) {
      el.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:48px;height:48px;display:block;margin:0 auto 16px;opacity:0.3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg><p>No resumes found. Create your first one!</p><button class="btn btn-cyan" onclick="App.navigate(\'builder\'); ResumeBuilder.newResume()">Get Started</button></div>';
    } else {
      el.innerHTML = AppState.resumes.map(r => renderResumeCard(r)).join('');
    }
  }
};

function renderResumeCard(r) {
  const score = r.atsScore || 0;
  const date = formatDate(r.lastModified);
  return `
    <div class="resume-card" onclick="ResumeBuilder.loadResume('${r.id}')">
      <div class="resume-card-name">${r.title || 'Untitled Resume'}</div>
      <div class="resume-card-meta">${date} · ${r.template || 'modern'} template</div>
      <div class="resume-card-score">
        <div class="score-bar-track">
          <div class="score-bar-fill" style="width:${score}%"></div>
        </div>
        <div class="score-num">${score ? score + '%' : '—'}</div>
      </div>
      <div class="resume-card-actions">
        <button class="btn btn-cyan btn-sm" onclick="event.stopPropagation(); ResumeBuilder.loadResume('${r.id}')">EDIT</button>
        <button class="btn btn-sm" style="border-color:rgba(0,229,255,0.2);color:var(--text2)" onclick="event.stopPropagation(); PdfExport.downloadById('${r.id}')">PDF</button>
        <button class="btn btn-sm" style="border-color:rgba(247,37,133,0.3);color:var(--text2)" onclick="event.stopPropagation(); AppFS.deleteResume('${r.id}')">DEL</button>
      </div>
    </div>
  `;
}

function formatDate(ts) {
  if (!ts) return 'Unknown';
  const d = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function toast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<div class="toast-dot"></div><span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => el.remove(), 300);
  }, 3500);
}

function showLoader(text = 'PROCESSING...') {
  let el = document.getElementById('loaderOverlay');
  if (!el) {
    el = document.createElement('div');
    el.className = 'loader-overlay';
    el.id = 'loaderOverlay';
    el.innerHTML = `<div class="loader-ring"></div><div class="loader-text">${text}</div>`;
    document.body.appendChild(el);
  }
  el.querySelector('.loader-text').textContent = text;
  el.style.display = 'flex';
}

function hideLoader() {
  const el = document.getElementById('loaderOverlay');
  if (el) el.style.display = 'none';
}

function toggleAccordion(header) {
  header.classList.toggle('open');
  const body = header.nextElementSibling;
  body.classList.toggle('open');
}

// Clock
setInterval(() => {
  const now = new Date();
  const el = document.getElementById('topbarTime');
  if (el) el.textContent = now.toLocaleTimeString('en-US', { hour12: false });
}, 1000);

// Nav clicks
document.querySelectorAll('.nav-item[data-page]').forEach(item => {
  item.addEventListener('click', () => App.navigate(item.dataset.page));
});
