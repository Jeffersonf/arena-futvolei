'use strict';

const STORE_KEY = 'fv_school_state_v2';
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const todayISO = () => new Date().toISOString().slice(0, 10);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const starter = {
  students: [
    { id: 's1', nome: 'Ana Souza', telefone: '(15) 99999-0001', email: '', plano_nome: '2x semana', mensalidade: 220, status: 'Ativo', nivel: 'Intermediario', observacao: 'Prefere turma da noite', pago_ate: todayISO() },
    { id: 's2', nome: 'Bruno Lima', telefone: '(15) 99999-0002', email: '', plano_nome: '1x semana', mensalidade: 160, status: 'Experimental', nivel: 'Iniciante', observacao: 'Aula experimental', pago_ate: '' }
  ],
  plans: [
    { id: 'p1', nome: '1x semana', preco: 160, aulas_semana: 1, descricao: 'Plano inicial', ativo: 1 },
    { id: 'p2', nome: '2x semana', preco: 220, aulas_semana: 2, descricao: 'Mais ritmo e evolucao', ativo: 1 },
    { id: 'p3', nome: 'Livre', preco: 300, aulas_semana: 4, descricao: 'Acesso amplo as turmas', ativo: 1 },
    { id: 'p4', nome: 'Avulso', preco: 60, aulas_semana: 0, descricao: 'Aula avulsa', ativo: 1 }
  ],
  classes: [
    { id: 'c1', data: todayISO(), horario: '18:30', turma: 'Iniciantes', professor: 'Jefferson', capacidade: 8, status: 'Marcada', aluno_ids: ['s1', 's2'], presencas: { s1: true, s2: false } }
  ],
  waitlist: []
};

let apiMode = false;
let state = loadLocalState();

function loadLocalState() {
  try {
    return { ...structuredClone(starter), ...JSON.parse(localStorage.getItem(STORE_KEY)) };
  } catch {
    return structuredClone(starter);
  }
}

function saveLocalState() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body) headers['Content-Type'] = 'application/json';
  const res = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

async function detectServer() {
  if (location.protocol === 'file:') return false;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 900);
    const res = await fetch('/health', { signal: controller.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

async function loadData() {
  apiMode = await detectServer();
  if (!apiMode) {
    document.getElementById('modeStatus').textContent = 'Local no navegador';
    render();
    return;
  }
  document.getElementById('modeStatus').textContent = 'Servidor Node + SQLite';
  const [students, classes, plans, waitlist] = await Promise.all([
    api('/api/students'),
    api('/api/classes'),
    api('/api/plans'),
    api('/api/waitlist')
  ]);
  state = {
    students: students.items || [],
    classes: classes.items || [],
    plans: plans.items || [],
    waitlist: waitlist.items || []
  };
  render();
}

function studentById(id) {
  return state.students.find((student) => String(student.id) === String(id));
}

function planById(id) {
  return state.plans.find((plan) => String(plan.id) === String(id));
}

function isPaid(student) {
  return Boolean(student.pago_ate && student.pago_ate >= todayISO());
}

function formatDate(value) {
  if (!value) return '-';
  const [year, month, day] = String(value).slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

function addMonthsIso(dateIso, months = 1) {
  const date = dateIso ? new Date(`${dateIso}T12:00:00`) : new Date();
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
}

function toast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 2200);
}

function setPage(page) {
  document.querySelectorAll('.page').forEach((el) => el.classList.toggle('active', el.id === `page-${page}`));
  document.querySelectorAll('.nav-item').forEach((el) => el.classList.toggle('active', el.dataset.page === page));
}

function render() {
  renderPlanOptions();
  renderKpis();
  renderTodayClasses();
  renderPending();
  renderStudents();
  renderClasses();
  renderPayments();
  renderPlans();
  renderWaitlist();
  renderDataSummary();
  fillClassStudents();
}

function renderKpis() {
  const active = state.students.filter((s) => s.status === 'Ativo').length;
  const trial = state.students.filter((s) => s.status === 'Experimental').length;
  const classesToday = state.classes.filter((c) => c.data === todayISO()).length;
  const pending = state.students.filter((s) => s.status !== 'Pausado' && !isPaid(s)).length;
  const items = [
    ['Alunos ativos', active],
    ['Experimentais', trial],
    ['Aulas hoje', classesToday],
    ['Mensalidades pendentes', pending]
  ];
  document.getElementById('kpiGrid').innerHTML = items.map(([label, value]) => `<article class="kpi"><span>${label}</span><strong>${value}</strong></article>`).join('');
}

function renderTodayClasses() {
  const classes = state.classes.filter((item) => item.data === todayISO()).sort(sortClass);
  document.getElementById('todayClasses').innerHTML = classes.length ? classes.map(classRow).join('') : empty('Nenhuma aula marcada para hoje.');
}

function renderPending() {
  const students = state.students.filter((student) => student.status !== 'Pausado' && !isPaid(student));
  document.getElementById('pendingList').innerHTML = students.length ? students.map((student) => `
    <article class="row-card">
      <div>
        <h3>${escapeHTML(student.nome)}</h3>
        <p class="meta">${escapeHTML(student.plano_nome || 'sem plano')} - ${money.format(Number(student.mensalidade || 0))}</p>
        <div class="pill-row"><span class="pill bad">pagamento pendente</span></div>
      </div>
      <div class="actions"><button class="mini-btn" data-pay="${student.id}">Marcar pago</button></div>
    </article>
  `).join('') : empty('Sem pendencias por enquanto.');
}

function renderStudents() {
  const query = document.getElementById('studentSearch').value.trim().toLowerCase();
  const students = state.students.filter((student) => {
    const haystack = `${student.nome} ${student.telefone} ${student.plano_nome} ${student.nivel} ${student.status}`.toLowerCase();
    return haystack.includes(query);
  });
  document.getElementById('studentGrid').innerHTML = students.length ? students.map(studentCard).join('') : empty('Nenhum aluno encontrado.');
}

function renderClasses() {
  const classes = [...state.classes].sort(sortClass);
  document.getElementById('classList').innerHTML = classes.length ? classes.map(classRow).join('') : empty('Crie a primeira aula da agenda.');
}

function renderPayments() {
  document.getElementById('paymentList').innerHTML = state.students.length ? state.students.map((student) => `
    <article class="row-card">
      <div>
        <h3>${escapeHTML(student.nome)}</h3>
        <p class="meta">${money.format(Number(student.mensalidade || 0))} - pago ate ${student.pago_ate ? formatDate(student.pago_ate) : 'sem registro'}</p>
        <div class="pill-row"><span class="pill ${isPaid(student) ? 'ok' : 'bad'}">${isPaid(student) ? 'em dia' : 'pendente'}</span></div>
      </div>
      <div class="actions"><button class="mini-btn" data-pay="${student.id}">Marcar mes pago</button></div>
    </article>
  `).join('') : empty('Cadastre alunos para acompanhar mensalidades.');
}

function renderPlans() {
  document.getElementById('planGrid').innerHTML = state.plans.length ? state.plans.map((plan) => `
    <article class="student-card">
      <h3>${escapeHTML(plan.nome)}</h3>
      <p class="meta">${money.format(Number(plan.preco || 0))} - ${Number(plan.aulas_semana || 0)} aula(s)/semana</p>
      <div class="pill-row"><span class="pill ${Number(plan.ativo ?? 1) ? 'ok' : ''}">${Number(plan.ativo ?? 1) ? 'ativo' : 'inativo'}</span></div>
      ${plan.descricao ? `<p class="meta">${escapeHTML(plan.descricao)}</p>` : ''}
      <div class="actions"><button class="mini-btn" data-edit-plan="${plan.id}">Editar</button></div>
    </article>
  `).join('') : empty('Cadastre planos para organizar aulas e mensalidades.');
}

function renderWaitlist() {
  document.getElementById('waitlistList').innerHTML = state.waitlist.length ? state.waitlist.map((item) => `
    <article class="row-card">
      <div>
        <h3>${escapeHTML(item.nome)}</h3>
        <p class="meta">${escapeHTML(item.telefone || 'sem telefone')} - ${escapeHTML(item.preferencia || 'sem preferencia')}</p>
        ${item.observacao ? `<p class="meta">${escapeHTML(item.observacao)}</p>` : ''}
      </div>
      <div class="actions">
        <button class="mini-btn" data-convert-wait="${item.id}">Virar aluno</button>
        <button class="mini-btn" data-delete-wait="${item.id}">Remover</button>
      </div>
    </article>
  `).join('') : empty('Sem interessados em espera.');
}

function renderDataSummary() {
  const rows = [
    ['Modo atual', apiMode ? 'Servidor Node + SQLite' : 'Local no navegador'],
    ['Alunos', state.students.length],
    ['Aulas', state.classes.length],
    ['Planos', state.plans.length],
    ['Espera', state.waitlist.length]
  ];
  document.getElementById('dataSummary').innerHTML = rows.map(([label, value]) => `
    <article class="row-card"><div><h3>${escapeHTML(label)}</h3><p class="meta">${escapeHTML(value)}</p></div></article>
  `).join('');
}

function studentCard(student) {
  return `
    <article class="student-card">
      <h3>${escapeHTML(student.nome)}</h3>
      <p class="meta">${escapeHTML(student.telefone || 'sem telefone')}</p>
      <div class="pill-row">
        <span class="pill">${escapeHTML(student.plano_nome || 'sem plano')}</span>
        <span class="pill">${escapeHTML(student.nivel || 'Iniciante')}</span>
        <span class="pill ${student.status === 'Ativo' ? 'ok' : student.status === 'Experimental' ? 'warn' : ''}">${escapeHTML(student.status || 'Ativo')}</span>
        <span class="pill ${isPaid(student) ? 'ok' : 'bad'}">${isPaid(student) ? 'em dia' : 'pendente'}</span>
      </div>
      ${student.observacao ? `<p class="meta">${escapeHTML(student.observacao)}</p>` : ''}
      <div class="actions">
        <button class="mini-btn" data-edit-student="${student.id}">Editar</button>
        <button class="mini-btn" data-pay="${student.id}">Pago</button>
      </div>
    </article>
  `;
}

function classRow(item) {
  const studentIds = item.aluno_ids || [];
  const enrolled = (item.alunos || studentIds.map(studentById)).filter(Boolean);
  const present = enrolled.filter((student) => item.presencas?.[student.aluno_id || student.id] || student.presente).length;
  return `
    <article class="row-card">
      <div>
        <h3>${formatDate(item.data)} as ${item.horario} - ${escapeHTML(item.turma || 'Turma')}</h3>
        <p class="meta">${escapeHTML(item.professor || 'Professor nao informado')} - ${enrolled.length}/${item.capacidade || 8} aluno(s)</p>
        <div class="pill-row">
          <span class="pill">${present}/${enrolled.length} presencas</span>
          <span class="pill">${escapeHTML(item.status || 'Marcada')}</span>
          ${item.data === todayISO() ? '<span class="pill ok">hoje</span>' : ''}
        </div>
      </div>
      <div class="actions">
        <button class="mini-btn" data-attendance="${item.id}">Presencas</button>
        <button class="mini-btn" data-edit-class="${item.id}">Editar</button>
      </div>
    </article>
  `;
}

function empty(text) {
  return `<div class="empty">${text}</div>`;
}

function sortClass(a, b) {
  return `${a.data}T${a.horario}`.localeCompare(`${b.data}T${b.horario}`);
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}

function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.getElementById(id).setAttribute('aria-hidden', 'false');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.getElementById(id).setAttribute('aria-hidden', 'true');
}

function renderPlanOptions(selected = '') {
  const options = state.plans.map((plan) => `<option value="${plan.id}" ${String(plan.id) === String(selected) ? 'selected' : ''}>${escapeHTML(plan.nome)} - ${money.format(Number(plan.preco || 0))}</option>`).join('');
  const studentPlan = document.getElementById('studentPlan');
  if (studentPlan) studentPlan.innerHTML = `<option value="">Sem plano</option>${options}`;
}

function openStudent(id = '') {
  const student = studentById(id) || {};
  document.getElementById('studentId').value = student.id || '';
  document.getElementById('studentName').value = student.nome || '';
  document.getElementById('studentPhone').value = student.telefone || '';
  document.getElementById('studentEmail').value = student.email || '';
  renderPlanOptions(student.plano_id || '');
  document.getElementById('studentFee').value = student.mensalidade || '';
  document.getElementById('studentLevel').value = student.nivel || 'Iniciante';
  document.getElementById('studentStatus').value = student.status || 'Ativo';
  document.getElementById('studentNote').value = student.observacao || '';
  openModal('studentModal');
}

function openClass(id = '') {
  const item = state.classes.find((entry) => String(entry.id) === String(id)) || {};
  document.getElementById('classId').value = item.id || '';
  document.getElementById('classDate').value = item.data || todayISO();
  document.getElementById('classTime').value = item.horario || '18:30';
  document.getElementById('classGroup').value = item.turma || '';
  document.getElementById('classCoach').value = item.professor || '';
  document.getElementById('classCapacity').value = item.capacidade || 8;
  document.getElementById('classStatus').value = item.status || 'Marcada';
  fillClassStudents(item.aluno_ids || []);
  openModal('classModal');
}

function openPlan(id = '') {
  const plan = planById(id) || {};
  document.getElementById('planId').value = plan.id || '';
  document.getElementById('planName').value = plan.nome || '';
  document.getElementById('planPrice').value = plan.preco || '';
  document.getElementById('planClasses').value = plan.aulas_semana ?? '';
  document.getElementById('planDescription').value = plan.descricao || '';
  openModal('planModal');
}

function openWaitlist() {
  document.getElementById('waitName').value = '';
  document.getElementById('waitPhone').value = '';
  document.getElementById('waitPreference').value = '';
  document.getElementById('waitNote').value = '';
  openModal('waitlistModal');
}

function fillClassStudents(selected = []) {
  const select = document.getElementById('classStudents');
  if (!select) return;
  const selectedSet = new Set(selected.map(String));
  select.innerHTML = state.students.filter((student) => student.status !== 'Pausado').map((student) => (
    `<option value="${student.id}" ${selectedSet.has(String(student.id)) ? 'selected' : ''}>${escapeHTML(student.nome)} - ${escapeHTML(student.plano_nome || 'sem plano')}</option>`
  )).join('');
}

async function saveStudent(event) {
  event.preventDefault();
  const id = document.getElementById('studentId').value;
  const plan = planById(document.getElementById('studentPlan').value);
  const payload = {
    nome: document.getElementById('studentName').value.trim(),
    telefone: document.getElementById('studentPhone').value.trim(),
    email: document.getElementById('studentEmail').value.trim(),
    plano_id: plan?.id || null,
    plano_nome: plan?.nome || '',
    mensalidade: Number(document.getElementById('studentFee').value || plan?.preco || 0),
    status: document.getElementById('studentStatus').value,
    nivel: document.getElementById('studentLevel').value,
    observacao: document.getElementById('studentNote').value.trim(),
    pago_ate: studentById(id)?.pago_ate || ''
  };
  if (apiMode) {
    await api(id ? `/api/students/${id}` : '/api/students', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    await loadData();
  } else {
    const next = { ...payload, id: id || uid() };
    const index = state.students.findIndex((student) => String(student.id) === String(next.id));
    if (index >= 0) state.students[index] = next;
    else state.students.push(next);
    saveLocalState();
    render();
  }
  closeModal('studentModal');
  toast('Aluno salvo');
}

async function saveClass(event) {
  event.preventDefault();
  const id = document.getElementById('classId').value;
  const alunoIds = [...document.getElementById('classStudents').selectedOptions].map((option) => option.value);
  const previous = state.classes.find((item) => String(item.id) === String(id));
  const presencas = {};
  alunoIds.forEach((studentId) => { presencas[studentId] = previous?.presencas?.[studentId] || false; });
  const payload = {
    data: document.getElementById('classDate').value,
    horario: document.getElementById('classTime').value,
    turma: document.getElementById('classGroup').value.trim(),
    professor: document.getElementById('classCoach').value.trim(),
    capacidade: Number(document.getElementById('classCapacity').value || 8),
    status: document.getElementById('classStatus').value,
    aluno_ids: alunoIds,
    presencas
  };
  if (apiMode) {
    await api(id ? `/api/classes/${id}` : '/api/classes', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    await loadData();
  } else {
    const next = { ...payload, id: id || uid() };
    const index = state.classes.findIndex((item) => String(item.id) === String(next.id));
    if (index >= 0) state.classes[index] = next;
    else state.classes.push(next);
    saveLocalState();
    render();
  }
  closeModal('classModal');
  toast('Aula salva');
}

async function savePlan(event) {
  event.preventDefault();
  const id = document.getElementById('planId').value;
  const payload = {
    nome: document.getElementById('planName').value.trim(),
    preco: Number(document.getElementById('planPrice').value || 0),
    aulas_semana: Number(document.getElementById('planClasses').value || 0),
    descricao: document.getElementById('planDescription').value.trim(),
    ativo: 1
  };
  if (apiMode) {
    await api(id ? `/api/tables/planos/${id}` : '/api/tables/planos', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    await loadData();
  } else {
    const next = { ...payload, id: id || uid() };
    const index = state.plans.findIndex((plan) => String(plan.id) === String(next.id));
    if (index >= 0) state.plans[index] = next;
    else state.plans.push(next);
    saveLocalState();
    render();
  }
  closeModal('planModal');
  toast('Plano salvo');
}

async function saveWaitlist(event) {
  event.preventDefault();
  const payload = {
    nome: document.getElementById('waitName').value.trim(),
    telefone: document.getElementById('waitPhone').value.trim(),
    preferencia: document.getElementById('waitPreference').value.trim(),
    observacao: document.getElementById('waitNote').value.trim()
  };
  if (apiMode) {
    await api('/api/waitlist', { method: 'POST', body: JSON.stringify(payload) });
    await loadData();
  } else {
    state.waitlist.unshift({ ...payload, id: uid(), data_cadastro: todayISO() });
    saveLocalState();
    render();
  }
  closeModal('waitlistModal');
  toast('Interessado salvo');
}

function openAttendance(classId) {
  const item = state.classes.find((entry) => String(entry.id) === String(classId));
  if (!item) return;
  const ids = item.aluno_ids || [];
  document.getElementById('attendanceTitle').textContent = `${formatDate(item.data)} as ${item.horario} - ${item.turma || 'Turma'}`;
  document.getElementById('attendanceList').innerHTML = ids.map(studentById).filter(Boolean).map((student) => `
    <div class="check-item">
      <div>
        <strong>${escapeHTML(student.nome)}</strong>
        <p class="meta">${escapeHTML(student.plano_nome || 'sem plano')}</p>
      </div>
      <button class="mini-btn ${item.presencas?.[student.id] ? 'present' : ''}" data-toggle-attendance="${item.id}:${student.id}">
        ${item.presencas?.[student.id] ? 'Presente' : 'Marcar'}
      </button>
    </div>
  `).join('') || empty('Nenhum aluno vinculado a esta aula.');
  openModal('attendanceModal');
}

async function toggleAttendance(classId, studentId) {
  const item = state.classes.find((entry) => String(entry.id) === String(classId));
  if (!item) return;
  item.presencas = item.presencas || {};
  item.presencas[studentId] = !item.presencas[studentId];
  if (apiMode) {
    await api(`/api/classes/${classId}/attendance`, { method: 'PUT', body: JSON.stringify({ attendance: item.presencas }) });
    await loadData();
  } else {
    saveLocalState();
    render();
  }
  openAttendance(classId);
}

async function markPaid(studentId) {
  const student = studentById(studentId);
  if (!student) return;
  if (apiMode) {
    await api(`/api/students/${studentId}/pay`, { method: 'POST', body: JSON.stringify({}) });
    await loadData();
  } else {
    student.pago_ate = addMonthsIso(student.pago_ate && student.pago_ate >= todayISO() ? student.pago_ate : todayISO(), 1);
    saveLocalState();
    render();
  }
  toast('Mensalidade marcada como paga');
}

async function deleteWait(id) {
  if (apiMode) {
    await api(`/api/waitlist/${id}`, { method: 'DELETE' });
    await loadData();
  } else {
    state.waitlist = state.waitlist.filter((item) => String(item.id) !== String(id));
    saveLocalState();
    render();
  }
  toast('Removido da lista de espera');
}

function convertWait(id) {
  const item = state.waitlist.find((entry) => String(entry.id) === String(id));
  if (!item) return;
  openStudent();
  document.getElementById('studentName').value = item.nome || '';
  document.getElementById('studentPhone').value = item.telefone || '';
  document.getElementById('studentNote').value = [item.preferencia, item.observacao].filter(Boolean).join(' - ');
}

async function downloadBackup() {
  const payload = apiMode ? await api('/api/backup.json') : { app: 'ArenaFutvolei.LocalState', exported_at: new Date().toISOString(), data: state };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `arena-futvolei-backup-${todayISO()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

async function createServerBackup() {
  if (!apiMode) {
    toast('Backup em servidor so com npm start');
    return;
  }
  const res = await api('/api/backups/create', { method: 'POST', body: JSON.stringify({}) });
  toast(`Backup criado: ${res.filename}`);
}

function resetLocal() {
  if (!confirm('Resetar dados locais deste navegador?')) return;
  localStorage.removeItem(STORE_KEY);
  state = structuredClone(starter);
  render();
  toast('Dados locais resetados');
}

function bindEvents() {
  document.querySelectorAll('.nav-item').forEach((button) => button.addEventListener('click', () => setPage(button.dataset.page)));
  document.querySelectorAll('[data-open-student]').forEach((button) => button.addEventListener('click', () => openStudent()));
  document.querySelectorAll('[data-open-class]').forEach((button) => button.addEventListener('click', () => openClass()));
  document.querySelectorAll('[data-open-plan]').forEach((button) => button.addEventListener('click', () => openPlan()));
  document.querySelectorAll('[data-open-waitlist]').forEach((button) => button.addEventListener('click', () => openWaitlist()));
  document.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => closeModal(button.dataset.close)));
  document.querySelectorAll('[data-refresh]').forEach((button) => button.addEventListener('click', () => loadData().then(() => toast('Dados atualizados')).catch((err) => toast(err.message))));
  document.querySelectorAll('[data-backup]').forEach((button) => button.addEventListener('click', () => downloadBackup().catch((err) => toast(err.message))));
  document.querySelectorAll('[data-server-backup]').forEach((button) => button.addEventListener('click', () => createServerBackup().catch((err) => toast(err.message))));
  document.querySelectorAll('[data-reset-local]').forEach((button) => button.addEventListener('click', resetLocal));
  document.getElementById('studentForm').addEventListener('submit', (event) => saveStudent(event).catch((err) => toast(err.message)));
  document.getElementById('classForm').addEventListener('submit', (event) => saveClass(event).catch((err) => toast(err.message)));
  document.getElementById('planForm').addEventListener('submit', (event) => savePlan(event).catch((err) => toast(err.message)));
  document.getElementById('waitlistForm').addEventListener('submit', (event) => saveWaitlist(event).catch((err) => toast(err.message)));
  document.getElementById('studentSearch').addEventListener('input', renderStudents);
  document.getElementById('studentPlan').addEventListener('change', (event) => {
    const plan = planById(event.target.value);
    if (plan) document.getElementById('studentFee').value = plan.preco || '';
  });
  document.getElementById('themeBtn').addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('fv_theme', next);
  });
  document.body.addEventListener('click', (event) => {
    const target = event.target.closest('[data-edit-student],[data-edit-class],[data-edit-plan],[data-attendance],[data-toggle-attendance],[data-pay],[data-delete-wait],[data-convert-wait]');
    if (!target) return;
    if (target.dataset.editStudent) openStudent(target.dataset.editStudent);
    if (target.dataset.editClass) openClass(target.dataset.editClass);
    if (target.dataset.editPlan) openPlan(target.dataset.editPlan);
    if (target.dataset.attendance) openAttendance(target.dataset.attendance);
    if (target.dataset.toggleAttendance) {
      const [classId, studentId] = target.dataset.toggleAttendance.split(':');
      toggleAttendance(classId, studentId).catch((err) => toast(err.message));
    }
    if (target.dataset.pay) markPaid(target.dataset.pay).catch((err) => toast(err.message));
    if (target.dataset.deleteWait) deleteWait(target.dataset.deleteWait).catch((err) => toast(err.message));
    if (target.dataset.convertWait) convertWait(target.dataset.convertWait);
  });
}

document.documentElement.dataset.theme = localStorage.getItem('fv_theme') || 'dark';
bindEvents();
loadData().catch((err) => {
  document.getElementById('modeStatus').textContent = 'Local no navegador';
  toast(err.message);
  render();
});
