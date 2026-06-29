// GATE 27 Prep Tracker — All interactive features
const STORE = 'gate27_data';
const BACKUP_FILENAME = 'gate27_backup.json';

// --- File System Access API handle (persists during session) ---
let _fileHandle = null;
let _lastBackupTime = null;

const SUBJECTS = [
  // General Aptitude (15 marks)
  {id:'apt',name:'General Aptitude',topics:[
    'Verbal Ability — English grammar & sentence completion',
    'Verbal Ability — Verbal analogies & word groups',
    'Verbal Ability — Critical reasoning & reading comprehension',
    'Numerical Ability — Numerical computation & estimation',
    'Numerical Ability — Data interpretation (graphs, charts, tables)',
    'Numerical Ability — Quantitative reasoning & aptitude'
  ]},

  // Section 1: Engineering Mathematics — Discrete Mathematics
  {id:'dm',name:'Discrete Mathematics',topics:[
    'Propositional Logic',
    'First Order Logic (Predicate Logic)',
    'Sets, Relations & Functions',
    'Partial Orders & Lattices',
    'Monoids & Groups',
    'Graphs — Connectivity & Matching',
    'Graphs — Colouring',
    'Combinatorics — Counting',
    'Recurrence Relations',
    'Generating Functions'
  ]},

  // Section 1: Engineering Mathematics — Linear Algebra
  {id:'la',name:'Linear Algebra',topics:[
    'Matrices & Determinants',
    'System of Linear Equations',
    'Eigenvalues & Eigenvectors',
    'LU Decomposition'
  ]},

  // Section 1: Engineering Mathematics — Calculus
  {id:'calc',name:'Calculus',topics:[
    'Limits, Continuity & Differentiability',
    'Maxima & Minima',
    'Mean Value Theorem',
    'Integration'
  ]},

  // Section 1: Engineering Mathematics — Probability & Statistics
  {id:'prob',name:'Probability & Statistics',topics:[
    'Random Variables',
    'Uniform & Normal Distributions',
    'Exponential & Poisson Distributions',
    'Binomial Distribution',
    'Mean, Median, Mode & Standard Deviation',
    'Conditional Probability & Bayes Theorem'
  ]},

  // Section 2: Digital Logic
  {id:'dl',name:'Digital Logic',topics:[
    'Boolean Algebra',
    'Combinational Circuits',
    'Sequential Circuits',
    'Minimization (K-maps, QM)',
    'Number Representations (fixed & floating point)',
    'Computer Arithmetic'
  ]},

  // Section 3: Computer Organization & Architecture
  {id:'coa',name:'Computer Organization & Architecture',topics:[
    'Machine Instructions & Addressing Modes',
    'ALU, Data-path & Control Unit',
    'Instruction Pipelining',
    'Pipeline Hazards',
    'Cache Memory',
    'Main Memory & Secondary Storage',
    'I/O Interface — Interrupt & DMA Mode'
  ]},

  // Section 4: Programming and Data Structures
  {id:'pds',name:'Programming & Data Structures',topics:[
    'Programming in C (pointers, structs, scope)',
    'Recursion',
    'Arrays',
    'Stacks & Queues',
    'Linked Lists',
    'Trees & Binary Search Trees',
    'Binary Heaps',
    'Graphs (representation & traversal basics)'
  ]},

  // Section 5: Algorithms
  {id:'algo',name:'Algorithms',topics:[
    'Searching & Sorting',
    'Hashing',
    'Asymptotic Worst-case Time & Space Complexity',
    'Greedy Algorithms',
    'Dynamic Programming',
    'Divide & Conquer',
    'Graph Traversals (BFS, DFS)',
    'Minimum Spanning Trees (Prim, Kruskal)',
    'Shortest Paths (Dijkstra, Bellman-Ford)'
  ]},

  // Section 6: Theory of Computation
  {id:'toc',name:'Theory of Computation',topics:[
    'Regular Expressions',
    'Finite Automata (DFA & NFA)',
    'Regular Languages & Pumping Lemma',
    'Context-free Grammars',
    'Push-down Automata',
    'Context-free Languages & Pumping Lemma',
    'Turing Machines',
    'Undecidability'
  ]},

  // Section 7: Compiler Design
  {id:'cd',name:'Compiler Design',topics:[
    'Lexical Analysis',
    'Parsing (LL, LR, SLR, LALR)',
    'Syntax-Directed Translation',
    'Runtime Environments',
    'Intermediate Code Generation',
    'Local Optimization',
    'Data Flow Analyses (constant propagation, liveness, CSE)'
  ]},

  // Section 8: Operating System
  {id:'os',name:'Operating Systems',topics:[
    'System Calls',
    'Processes & Threads',
    'Inter-process Communication',
    'Concurrency & Synchronization',
    'Deadlock',
    'CPU Scheduling',
    'I/O Scheduling',
    'Memory Management & Virtual Memory',
    'File Systems'
  ]},

  // Section 9: Databases
  {id:'dbms',name:'Databases',topics:[
    'ER Model',
    'Relational Algebra',
    'Tuple Calculus',
    'SQL (joins, nested queries, aggregation)',
    'Integrity Constraints',
    'Normal Forms (1NF → BCNF)',
    'File Organization & Indexing (B & B+ Trees)',
    'Transactions & Concurrency Control'
  ]},

  // Section 10: Computer Networks
  {id:'cn',name:'Computer Networks',topics:[
    'OSI & TCP/IP Protocol Stacks',
    'Packet, Circuit & Virtual Circuit Switching',
    'Data Link — Framing & Error Detection',
    'Medium Access Control & Ethernet Bridging',
    'Routing — Shortest Path, Flooding, DV & LS',
    'Fragmentation & IP Addressing (IPv4, CIDR)',
    'IP Support Protocols (ARP, DHCP, ICMP)',
    'Network Address Translation (NAT)',
    'Transport — Flow Control & Congestion Control',
    'TCP, UDP & Sockets',
    'Application Layer (DNS, SMTP, HTTP, FTP, Email)'
  ]}
];

const PHASES = [
  {name:'Phase 1 — Foundation',start:'2026-06-01',end:'2026-07-31',color:'#7c6cf0'},
  {name:'Phase 2 — Core Subjects',start:'2026-08-01',end:'2026-09-30',color:'#22d3a0'},
  {name:'Phase 3 — Complete Coverage',start:'2026-10-01',end:'2026-11-30',color:'#f0a832'},
  {name:'Phase 4 — Intensive Revision',start:'2026-12-01',end:'2027-01-31',color:'#f06060'},
  {name:'Phase 5 — Exam Week',start:'2027-02-01',end:'2027-02-15',color:'#60b4f0'}
];

const GATE_DATE = new Date('2027-02-07T09:30:00+05:30');

// --- IST date helper (avoids UTC date mismatch at night) ---
function toIST(date) {
  const d = date || new Date();
  // Get IST offset: UTC+5:30 = 330 minutes
  const ist = new Date(d.getTime() + (330 + d.getTimezoneOffset()) * 60000);
  const y = ist.getFullYear();
  const m = String(ist.getMonth() + 1).padStart(2, '0');
  const day = String(ist.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// --- Data persistence (dual-layer: localStorage + file backup) ---
function load() {
  try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch { return {}; }
}
function save(d) {
  localStorage.setItem(STORE, JSON.stringify(d));
  // Auto-backup to file (non-blocking)
  autoBackupToFile(d);
}
function getData() {
  const d = load();
  if (!d.topics) d.topics = {};
  if (!d.mocks) d.mocks = [];
  if (!d.hours) d.hours = {};
  if (!d.pyq) d.pyq = {};
  if (!d.weak) d.weak = [];
  return d;
}

// --- File Backup System (with persistent handle via IndexedDB) ---

// IndexedDB helpers for storing the file handle across sessions
function openHandleDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('gate27_backup_db', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('handles');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveHandleToDB(handle) {
  try {
    const db = await openHandleDB();
    const tx = db.transaction('handles', 'readwrite');
    tx.objectStore('handles').put(handle, 'backupFile');
    await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej; });
  } catch (e) { console.warn('Could not persist handle:', e); }
}

async function loadHandleFromDB() {
  try {
    const db = await openHandleDB();
    const tx = db.transaction('handles', 'readonly');
    const req = tx.objectStore('handles').get('backupFile');
    return new Promise((res) => { req.onsuccess = () => res(req.result || null); req.onerror = () => res(null); });
  } catch (e) { return null; }
}

// Try to restore the saved file handle on page load
async function restoreBackupHandle() {
  if (!window.showSaveFilePicker) return; // Not supported
  const handle = await loadHandleFromDB();
  if (!handle) return;
  try {
    // Request permission (browser may grant silently or show a prompt)
    const perm = await handle.requestPermission({ mode: 'readwrite' });
    if (perm === 'granted') {
      _fileHandle = handle;
      _lastBackupTime = new Date(); // approximate — we know it was connected before
      updateBackupStatus();
    }
  } catch (e) {
    console.warn('Could not restore backup handle:', e);
  }
}

// Write to file using File System Access API (Chromium only)
async function autoBackupToFile(data) {
  if (!_fileHandle) return; // No handle yet — user hasn't granted access
  try {
    const writable = await _fileHandle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
    _lastBackupTime = new Date();
    updateBackupStatus();
  } catch (e) {
    console.warn('Auto-backup failed:', e);
    // Handle might have become stale — clear it
    _fileHandle = null;
    updateBackupStatus();
  }
}

// Connect to a backup file (one-time setup — persists across sessions)
async function connectBackupFile() {
  if (!window.showSaveFilePicker) {
    // Fallback: just do a download-based export
    exportDataDownload();
    return;
  }
  try {
    _fileHandle = await window.showSaveFilePicker({
      suggestedName: BACKUP_FILENAME,
      types: [{
        description: 'JSON Backup',
        accept: { 'application/json': ['.json'] }
      }]
    });
    // Save handle to IndexedDB so it persists across reloads
    await saveHandleToDB(_fileHandle);
    // Immediately write current data
    const d = getData();
    const writable = await _fileHandle.createWritable();
    await writable.write(JSON.stringify(d, null, 2));
    await writable.close();
    _lastBackupTime = new Date();
    updateBackupStatus();
    showToast('✅ Backup connected! Will auto-save on every change.');
  } catch (e) {
    if (e.name !== 'AbortError') console.warn('Failed to connect backup file:', e);
  }
}

// Export data as a downloaded JSON file (fallback / manual)
function exportDataDownload() {
  const d = getData();
  const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = BACKUP_FILENAME;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  _lastBackupTime = new Date();
  updateBackupStatus();
  showToast('💾 Backup exported as ' + BACKUP_FILENAME);
}

// Import data from a JSON file
function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const imported = JSON.parse(reader.result);
        // Validate basic structure
        if (typeof imported !== 'object') throw new Error('Invalid format');
        // Save to localStorage (skip file backup for now)
        localStorage.setItem(STORE, JSON.stringify(imported));
        // Hide recovery banner
        const banner = document.getElementById('recovery-banner');
        if (banner) banner.style.display = 'none';
        showToast('📂 Data restored! Setting up auto-backup...');
        // Auto-prompt to connect backup file after a short delay
        setTimeout(async () => {
          await connectBackupFile();
          location.reload();
        }, 1000);
      } catch (err) {
        alert('❌ Invalid backup file. Make sure it\'s a valid gate27_backup.json file.');
      }
    };
    reader.readAsText(file);
  });
  input.click();
}

// Check if localStorage is empty and show recovery prompt
function checkForDataLoss() {
  const raw = localStorage.getItem(STORE);
  const isEmpty = !raw || raw === '{}' || raw === 'null';
  const bar = document.getElementById('data-bar');
  if (isEmpty) {
    // Show prominent recovery banner
    const banner = document.getElementById('recovery-banner');
    if (banner) {
      banner.style.display = 'flex';
    }
  }
}

// Update the backup status indicator in the UI
function updateBackupStatus() {
  const el = document.getElementById('backup-status');
  if (!el) return;
  if (_fileHandle) {
    const time = _lastBackupTime ? _lastBackupTime.toLocaleTimeString() : '—';
    el.innerHTML = `<span style="color:var(--accent2)">● Auto-saving</span> · Last: ${time}`;
  } else if (_lastBackupTime) {
    el.innerHTML = `<span style="color:var(--accent3)">● Manual</span> · Exported: ${_lastBackupTime.toLocaleTimeString()}`;
  } else {
    // Check if data exists in localStorage
    const raw = localStorage.getItem(STORE);
    const hasData = raw && raw !== '{}' && raw !== 'null';
    if (hasData) {
      el.innerHTML = `<span style="color:var(--accent3)">● Data loaded</span> · Click Auto-Backup to protect it`;
    } else {
      el.innerHTML = `<span style="color:var(--muted)">○ No backup connected</span>`;
    }
  }
}

// Show a toast notification
function showToast(msg) {
  let toast = document.getElementById('data-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'data-toast';
    toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1e1e24;border:1px solid rgba(124,108,240,0.4);color:#f0eff4;padding:10px 20px;border-radius:10px;font-size:13px;z-index:9999;opacity:0;transition:opacity 0.3s;font-family:"DM Sans",sans-serif;box-shadow:0 4px 20px rgba(0,0,0,0.4)';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast._tid);
  toast._tid = setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}

// --- Countdown timer ---
function updateCountdown() {
  const now = new Date();
  const diff = GATE_DATE - now;
  if (diff <= 0) {
    document.getElementById('cd-days').textContent = '🎯';
    document.getElementById('cd-hrs').textContent = '';
    document.getElementById('cd-min').textContent = '';
    document.getElementById('cd-sec').textContent = '';
    return;
  }
  const days = Math.floor(diff / 864e5);
  const hrs = Math.floor((diff % 864e5) / 36e5);
  const min = Math.floor((diff % 36e5) / 6e4);
  const sec = Math.floor((diff % 6e4) / 1e3);
  document.getElementById('cd-days').textContent = days;
  document.getElementById('cd-hrs').textContent = String(hrs).padStart(2, '0');
  document.getElementById('cd-min').textContent = String(min).padStart(2, '0');
  document.getElementById('cd-sec').textContent = String(sec).padStart(2, '0');
}

function updatePhaseIndicator() {
  const now = new Date();
  const today = toIST(now);
  let current = null, idx = -1;
  for (let i = 0; i < PHASES.length; i++) {
    if (today >= PHASES[i].start && today <= PHASES[i].end) { current = PHASES[i]; idx = i; break; }
  }
  const nameEl = document.getElementById('pi-name');
  const fillEl = document.getElementById('pi-fill');
  const indEl = document.getElementById('phase-ind');
  if (current) {
    nameEl.textContent = current.name;
    nameEl.style.color = current.color;
    const s = new Date(current.start), e = new Date(current.end);
    const pct = Math.min(100, Math.round(((now - s) / (e - s)) * 100));
    fillEl.style.width = pct + '%';
    fillEl.style.background = `linear-gradient(90deg, ${current.color}, ${current.color}88)`;
    indEl.style.borderColor = current.color + '44';
    // Highlight current phase card
    document.querySelectorAll('.phase').forEach((el, i) => {
      if (i === idx) el.classList.add('active-phase');
      else el.classList.remove('active-phase');
    });
  } else if (today < PHASES[0].start) {
    nameEl.textContent = 'Prep starts soon!';
    nameEl.style.color = '#7c6cf0';
    fillEl.style.width = '0%';
  } else {
    nameEl.textContent = 'Exam period';
    nameEl.style.color = '#60b4f0';
    fillEl.style.width = '100%';
  }
}

function renderProgress() {
  const d = getData();
  const grid = document.getElementById('sp-grid');
  const openCards = new Set();
  grid.querySelectorAll('details[open]').forEach(c => openCards.add(c.dataset.id));

  grid.innerHTML = '';
  let totalTopics = 0, totalDone = 0;

  SUBJECTS.forEach(sub => {
    const done = sub.topics.filter((_, i) => d.topics[sub.id + '-' + i]).length;
    totalTopics += sub.topics.length;
    totalDone += done;
    const pct = Math.round((done / sub.topics.length) * 100);

    const details = document.createElement('details');
    details.className = 'sp-card';
    details.dataset.id = sub.id;
    if (openCards.has(sub.id)) details.open = true;

    const summary = document.createElement('summary');
    summary.className = 'sp-hd';
    summary.innerHTML = `<span class="sp-n">${sub.name}</span><span class="sp-p">${pct}%</span>`;

    const bar = document.createElement('div');
    bar.className = 'pbar';
    bar.innerHTML = `<div class="pfill pfill-p" style="width:${pct}%"></div>`;

    const topicsDiv = document.createElement('div');
    topicsDiv.className = 'sp-topics';
    topicsDiv.style.display = 'block';
    sub.topics.forEach((t, i) => {
      const lbl = document.createElement('label');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.dataset.key = sub.id + '-' + i;
      cb.checked = !!d.topics[sub.id + '-' + i];
      cb.addEventListener('change', function() { toggleTopic(this); });
      lbl.appendChild(cb);
      lbl.appendChild(document.createTextNode(' ' + t));
      topicsDiv.appendChild(lbl);
    });

    details.appendChild(summary);
    details.appendChild(bar);
    details.appendChild(topicsDiv);
    grid.appendChild(details);
  });

  const overallPct = totalTopics ? Math.round((totalDone / totalTopics) * 100) : 0;
  document.getElementById('overall-pct').textContent = overallPct + '%';
  document.getElementById('overall-fill').style.width = overallPct + '%';
}

function toggleTopic(el) {
  const d = getData();
  d.topics[el.dataset.key] = el.checked;
  save(d);
  const card = el.closest('.sp-card');
  const subId = card.dataset.id;
  const sub = SUBJECTS.find(s => s.id === subId);
  const done = sub.topics.filter((_, i) => d.topics[sub.id + '-' + i]).length;
  const pct = Math.round((done / sub.topics.length) * 100);
  card.querySelector('.sp-p').textContent = pct + '%';
  card.querySelector('.pfill').style.width = pct + '%';
  let totalDone = 0, totalTopics = 0;
  SUBJECTS.forEach(s => {
    totalTopics += s.topics.length;
    totalDone += s.topics.filter((_, i) => d.topics[s.id + '-' + i]).length;
  });
  const overallPct = Math.round((totalDone / totalTopics) * 100);
  document.getElementById('overall-pct').textContent = overallPct + '%';
  document.getElementById('overall-fill').style.width = overallPct + '%';
}

// --- Study heatmap ---
function renderHeatmap() {
  const d = getData();
  const grid = document.getElementById('hm-grid');
  grid.innerHTML = '';
  const tip = document.getElementById('hm-tip');
  const startDate = new Date('2026-06-01');
  const endDate = new Date('2027-02-15');
  const todayStr = toIST();
  let streak = 0, totalHrs = 0;

  // Calculate all dates
  const dates = [];
  for (let dt = new Date(startDate); dt <= endDate; dt.setDate(dt.getDate() + 1)) {
    dates.push(new Date(dt));
  }

  // Calculate total hours
  dates.forEach(dt => {
    const key = toIST(dt);
    totalHrs += (d.hours[key] || 0);
  });

  // Calculate streak (backwards from today, allow today to be in-progress)
  const checkDate = new Date();
  const todayKey = toIST(checkDate);
  if (!d.hours[todayKey] || d.hours[todayKey] <= 0) {
    checkDate.setDate(checkDate.getDate() - 1); // start from yesterday if today not logged
  }
  while (checkDate >= startDate) {
    const key = toIST(checkDate);
    if (d.hours[key] && d.hours[key] > 0) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else break;
  }

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = toIST(yesterdayDate);

  dates.forEach(dt => {
    const key = toIST(dt);
    const isFuture = key > todayStr;
    const isLocked = key < yesterdayStr; // before yesterday = locked
    const hrs = d.hours[key] || 0;
    const cell = document.createElement('div');
    cell.className = 'hm-cell';
    if (hrs >= 7) cell.classList.add('l4');
    else if (hrs >= 5) cell.classList.add('l3');
    else if (hrs >= 3) cell.classList.add('l2');
    else if (hrs > 0) cell.classList.add('l1');
    if (isFuture) { cell.style.opacity = '0.3'; cell.style.cursor = 'default'; }
    if (isLocked) { cell.style.cursor = 'default'; }

    cell.addEventListener('mouseenter', e => {
      const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      tip.textContent = `${dayNames[dt.getDay()]}, ${key} — ${hrs}h`;
      tip.style.display = 'block';
      tip.style.left = e.clientX + 12 + 'px';
      tip.style.top = e.clientY - 30 + 'px';
    });
    cell.addEventListener('mouseleave', () => { tip.style.display = 'none'; });
    cell.addEventListener('click', () => {
      if (isFuture) return;
      if (isLocked) { showToast('🔒 Can only edit today and yesterday'); return; }
      const val = prompt(`Hours studied on ${key}:`, hrs || '');
      if (val !== null && !isNaN(val)) {
        d.hours[key] = parseFloat(val) || 0;
        save(d);
        renderHeatmap();
      }
    });
    grid.appendChild(cell);
  });

  document.getElementById('hm-streak').textContent = streak;
  document.getElementById('hm-total').textContent = totalHrs.toFixed(1);
}

function logHours() {
  const d = getData();
  const hrs = parseFloat(document.getElementById('hm-hrs').value);
  if (isNaN(hrs) || hrs < 0) return;
  const today = toIST();
  d.hours[today] = hrs;
  save(d);
  document.getElementById('hm-hrs').value = '';
  renderHeatmap();
}

// --- Mock score tracker ---
function addMock() {
  const d = getData();
  const date = document.getElementById('mk-date').value;
  const score = parseFloat(document.getElementById('mk-score').value);
  const total = parseFloat(document.getElementById('mk-total').value) || 100;
  const type = document.getElementById('mk-type').value;
  if (!date || isNaN(score)) { alert('Please fill date and score'); return; }
  d.mocks.push({ date, score, total, type });
  d.mocks.sort((a, b) => a.date.localeCompare(b.date));
  save(d);
  document.getElementById('mk-score').value = '';
  renderMocks();
}

function deleteMock(idx) {
  const d = getData();
  d.mocks.splice(idx, 1);
  save(d);
  renderMocks();
}

function renderMocks() {
  const d = getData();
  renderMockChart(d.mocks);
  renderMockHistory(d.mocks);
}

function renderMockChart(mocks) {
  const canvas = document.getElementById('mock-canvas');
  const wrap = document.getElementById('mock-chart-wrap');
  if (mocks.length < 1) {
    wrap.innerHTML = '<div class="mock-empty">No mock scores yet. Add your first mock above ↑</div>';
    return;
  }
  if (!wrap.querySelector('canvas')) {
    wrap.innerHTML = '<canvas id="mock-canvas"></canvas>';
  }
  const cvs = document.getElementById('mock-canvas');
  const ctx = cvs.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = cvs.getBoundingClientRect();
  cvs.width = rect.width * dpr;
  cvs.height = 200 * dpr;
  cvs.style.height = '200px';
  ctx.scale(dpr, dpr);
  const W = rect.width, H = 200;
  ctx.clearRect(0, 0, W, H);

  const pad = { t: 20, r: 20, b: 30, l: 40 };
  const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b;
  const maxScore = Math.max(100, ...mocks.map(m => m.score));

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (ch / 4) * i;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
    ctx.fillStyle = '#8b8a99';
    ctx.font = '10px DM Sans';
    ctx.textAlign = 'right';
    ctx.fillText(Math.round(maxScore - (maxScore / 4) * i), pad.l - 6, y + 3);
  }

  // Target line at 50
  const targetY = pad.t + ch * (1 - 50 / maxScore);
  ctx.strokeStyle = 'rgba(240,168,50,0.4)';
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(pad.l, targetY); ctx.lineTo(W - pad.r, targetY); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#f0a832';
  ctx.font = '10px Syne';
  ctx.textAlign = 'left';
  ctx.fillText('Target: 50', W - pad.r - 55, targetY - 5);

  // Data points
  const pts = mocks.map((m, i) => ({
    x: pad.l + (mocks.length === 1 ? cw / 2 : (cw / (mocks.length - 1)) * i),
    y: pad.t + ch * (1 - m.score / maxScore),
    score: m.score, date: m.date
  }));

  // Line
  ctx.strokeStyle = '#7c6cf0';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  pts.forEach((p, i) => { i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); });
  ctx.stroke();

  // Gradient fill under line
  const grad = ctx.createLinearGradient(0, pad.t, 0, H - pad.b);
  grad.addColorStop(0, 'rgba(124,108,240,0.2)');
  grad.addColorStop(1, 'rgba(124,108,240,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  pts.forEach((p, i) => { i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); });
  ctx.lineTo(pts[pts.length - 1].x, H - pad.b);
  ctx.lineTo(pts[0].x, H - pad.b);
  ctx.closePath();
  ctx.fill();

  // Dots + labels
  pts.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#7c6cf0';
    ctx.fill();
    ctx.fillStyle = '#f0eff4';
    ctx.font = 'bold 10px Syne';
    ctx.textAlign = 'center';
    ctx.fillText(p.score, p.x, p.y - 10);
  });

  // Date labels
  ctx.fillStyle = '#8b8a99';
  ctx.font = '9px DM Sans';
  ctx.textAlign = 'center';
  pts.forEach(p => {
    ctx.fillText(p.date.slice(5), p.x, H - pad.b + 14);
  });
}

function renderMockHistory(mocks) {
  const el = document.getElementById('mock-hist');
  if (mocks.length === 0) { el.innerHTML = ''; return; }
  const avg = (mocks.reduce((s, m) => s + m.score, 0) / mocks.length).toFixed(1);
  el.innerHTML = `<table>
    <thead><tr><th>Date</th><th>Score</th><th>Type</th><th>Avg: ${avg}</th></tr></thead>
    <tbody>${mocks.map((m, i) => {
      const color = m.score >= 50 ? '#22d3a0' : m.score >= 40 ? '#f0a832' : '#f06060';
      return `<tr><td>${m.date}</td><td><span class="score-v" style="color:${color}">${m.score}/${m.total}</span></td><td>${m.type}</td><td><button class="del-btn" onclick="deleteMock(${i})">✕</button></td></tr>`;
    }).join('')}</tbody></table>`;
}

// --- PYQ accuracy tracker ---
function renderPYQ() {
  const d = getData();
  const grid = document.getElementById('pyq-grid');
  grid.innerHTML = '';
  SUBJECTS.forEach(sub => {
    const stats = d.pyq[sub.id] || { attempted: 0, correct: 0 };
    const acc = stats.attempted > 0 ? Math.round((stats.correct / stats.attempted) * 100) : 0;
    const color = acc >= 70 ? '#22d3a0' : acc >= 50 ? '#f0a832' : acc > 0 ? '#f06060' : 'var(--muted)';
    const card = document.createElement('div');
    card.className = 'pyq-card';
    card.innerHTML = `
      <div class="pn">${sub.name}</div>
      <div class="pa" style="color:${color}">${stats.attempted > 0 ? acc + '%' : '—'}</div>
      <div class="ps">${stats.correct}/${stats.attempted} correct</div>
      <div class="pbar" style="margin-bottom:8px"><div class="pfill" style="width:${acc}%;background:${color}"></div></div>
      <div class="pyq-row">
        <input type="number" class="ctrl-input" placeholder="✓" min="0" id="pyq-c-${sub.id}">
        <input type="number" class="ctrl-input" placeholder="Total" min="0" id="pyq-a-${sub.id}">
        <button class="ctrl-btn green" onclick="addPYQ('${sub.id}')">+</button>
      </div>`;
    grid.appendChild(card);
  });
}

function addPYQ(id) {
  const d = getData();
  const correct = parseInt(document.getElementById('pyq-c-' + id).value) || 0;
  const attempted = parseInt(document.getElementById('pyq-a-' + id).value) || 0;
  if (attempted <= 0) return;
  if (!d.pyq[id]) d.pyq[id] = { attempted: 0, correct: 0 };
  d.pyq[id].attempted += attempted;
  d.pyq[id].correct += Math.min(correct, attempted);
  save(d);
  renderPYQ();
}

// --- Weak topics journal ---
function initWeakSubjectDropdown() {
  const sel = document.getElementById('wk-subj');
  sel.innerHTML = SUBJECTS.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
}

function renderWeak() {
  const d = getData();
  const el = document.getElementById('weak-list');
  if (d.weak.length === 0) {
    el.innerHTML = '<div class="weak-empty">No weak topics logged yet. Add topics you keep getting wrong.</div>';
    return;
  }
  // Sort by count descending
  const sorted = [...d.weak].sort((a, b) => b.count - a.count);
  el.innerHTML = '<div class="weak-list">' + sorted.map((w, i) => {
    const origIdx = d.weak.indexOf(w);
    return `<div class="wk-item">
      <div class="wi-left">
        <span class="wi-count">×${w.count}</span>
        <div><div class="wi-topic">${w.topic}</div><div class="wi-subj">${SUBJECTS.find(s => s.id === w.subject)?.name || w.subject}</div></div>
      </div>
      <div>
        <button class="ctrl-btn" style="padding:3px 8px;font-size:11px;margin-right:4px" onclick="bumpWeak(${origIdx})">+1</button>
        <button class="wi-del" onclick="deleteWeak(${origIdx})">✕</button>
      </div>
    </div>`;
  }).join('') + '</div>';
}

function addWeak() {
  const d = getData();
  const topic = document.getElementById('wk-topic').value.trim();
  const subject = document.getElementById('wk-subj').value;
  if (!topic) return;
  // Check if same topic exists
  const existing = d.weak.find(w => w.topic.toLowerCase() === topic.toLowerCase() && w.subject === subject);
  if (existing) { existing.count++; }
  else { d.weak.push({ topic, subject, count: 1, date: toIST() }); }
  save(d);
  document.getElementById('wk-topic').value = '';
  renderWeak();
}

function bumpWeak(idx) {
  const d = getData();
  d.weak[idx].count++;
  save(d);
  renderWeak();
}

function deleteWeak(idx) {
  const d = getData();
  d.weak.splice(idx, 1);
  save(d);
  renderWeak();
}

// --- Init ---
async function init() {
  // Check if data was lost (show recovery banner if needed)
  checkForDataLoss();
  updateBackupStatus();

  // Try to restore previously connected backup file
  await restoreBackupHandle();

  // Set today's date as default for mock form
  document.getElementById('mk-date').value = toIST();

  updateCountdown();
  setInterval(updateCountdown, 1000);
  updatePhaseIndicator();

  renderProgress();
  renderHeatmap();
  renderMocks();
  renderPYQ();
  initWeakSubjectDropdown();
  renderWeak();
}

// --- Page navigation ---
function showPage(pageId) {
  // Hide all sections
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  // Show target section
  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.add('active');
  // Update nav tabs
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(t => {
    if (t.textContent.toLowerCase().replace(/\s+/g, '').includes(pageId.replace('studyplan','studyplan').replace('syllabus','fullsyllabus').replace('resources','resources'))) {
      t.classList.add('active');
    }
  });
  // Simpler: match by onclick attribute
  tabs.forEach(t => {
    const onclick = t.getAttribute('onclick') || '';
    if (onclick.includes("'" + pageId + "'")) t.classList.add('active');
  });
  // Update URL hash
  window.location.hash = pageId;
  // Scroll to top
  window.scrollTo(0, 0);
  // Re-render charts if switching to analytics (canvas needs visible container)
  if (pageId === 'analytics') {
    const d = getData();
    renderMockChart(d.mocks);
  }
}

document.addEventListener('DOMContentLoaded', init);
// Restore page from URL hash
window.addEventListener('DOMContentLoaded', () => {
  const hash = window.location.hash.slice(1);
  if (hash && document.getElementById('page-' + hash)) {
    showPage(hash);
  }
});
// Redraw mock chart on resize
window.addEventListener('resize', () => { const d = getData(); renderMockChart(d.mocks); });
