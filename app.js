'use strict';

const STORE_KEY = 'fv_school_state_v1';
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const todayISO = () => new Date().toISOString().slice(0, 10);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const starter = {
  students: [
    { id: 's1', name: 'Ana Souza', phone: '(15) 99999-0001', plan: '2x semana', fee: 220, status: 'active', note: 'Prefere turma da noite', paidUntil: todayISO() },
    { id: 's2', name: 'Bruno Lima', phone: '(15) 99999-0002', plan: '1x semana', fee: 160, status: 'trial', note: 'Aula experimental', paidUntil: '' }
  ],
  classes: [
    { id: 'c1', date: todayISO(), time: '18:30', group: 'Iniciantes', coach: 'Jefferson', studentIds: ['s1', 's2'], attendance: { s1: true, s2: false } }
  ]
};

let state = loadState();

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) || structuredClone(starter);
  } catch {
    return structuredClone(starter);
  }
}

function saveState() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

function studentById(id) {
  return state.students.find((student) => student.id === id);
}

function isPaid(student) {
  return Boolean(student.paidUntil && student.paidUntil >= todayISO());
}

function formatDate(value) {
  if (!value) return '-';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
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
  renderKpis();
  renderTodayClasses();
  renderPending();
  renderStudents();
  renderClasses();
  renderPayments();
  fillClassStudents();
}

function renderKpis() {
  const active = state.students.filter((s) => s.status === 'active').length;
  const trial = state.students.filter((s) => s.status === 'trial').length;
  const classesToday = state.classes.filter((c) => c.date === todayISO()).length;
  const pending = state.students.filter((s) => s.status !== 'paused' && !isPaid(s)).length;
  const items = [
    ['Alunos ativos', active],
    ['Experimentais', trial],
    ['Aulas hoje', classesToday],
    ['Mensalidades pendentes', pending]
  ];
  document.getElementById('kpiGrid').innerHTML = items.map(([label, value]) => `<article class="kpi"><span>${label}</span><strong>${value}</strong></article>`).join('');
}

function renderTodayClasses() {
  const classes = state.classes.filter((item) => item.date === todayISO()).sort(sortClass);
  document.getElementById('todayClasses').innerHTML = classes.length ? classes.map(classRow).join('') : empty('Nenhuma aula marcada para hoje.');
}

function renderPending() {
  const students = state.students.filter((student) => student.status !== 'paused' && !isPaid(student));
  document.getElementById('pendingList').innerHTML = students.length ? students.map((student) => `
    <article class="row-card">
      <div>
        <h3>${escapeHTML(student.name)}</h3>
        <p class="meta">${escapeHTML(student.plan)} - ${money.format(Number(student.fee || 0))}</p>
        <div class="pill-row"><span class="pill bad">pagamento pendente</span></div>
      </div>
      <div class="actions"><button class="mini-btn" data-pay="${student.id}">Marcar pago</button></div>
    </article>
  `).join('') : empty('Sem pendencias por enquanto.');
}

function renderStudents() {
  const query = document.getElementById('studentSearch').value.trim().toLowerCase();
  const students = state.students.filter((student) => {
    const haystack = `${student.name} ${student.phone} ${student.plan} ${student.status}`.toLowerCase();
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
        <h3>${escapeHTML(student.name)}</h3>
        <p class="meta">${money.format(Number(student.fee || 0))} - pago ate ${student.paidUntil ? formatDate(student.paidUntil) : 'sem registro'}</p>
        <div class="pill-row"><span class="pill ${isPaid(student) ? 'ok' : 'bad'}">${isPaid(student) ? 'em dia' : 'pendente'}</span></div>
      </div>
      <div class="actions"><button class="mini-btn" data-pay="${student.id}">Marcar mes pago</button></div>
    </article>
  `).join('') : empty('Cadastre alunos para acompanhar mensalidades.');
}

function studentCard(student) {
  return `
    <article class="student-card">
      <h3>${escapeHTML(student.name)}</h3>
      <p class="meta">${escapeHTML(student.phone || 'sem telefone')}</p>
      <div class="pill-row">
        <span class="pill">${escapeHTML(student.plan)}</span>
        <span class="pill ${student.status === 'active' ? 'ok' : student.status === 'trial' ? 'warn' : ''}">${statusLabel(student.status)}</span>
        <span class="pill ${isPaid(student) ? 'ok' : 'bad'}">${isPaid(student) ? 'em dia' : 'pendente'}</span>
      </div>
      ${student.note ? `<p class="meta">${escapeHTML(student.note)}</p>` : ''}
      <div class="actions">
        <button class="mini-btn" data-edit-student="${student.id}">Editar</button>
        <button class="mini-btn" data-pay="${student.id}">Pago</button>
      </div>
    </article>
  `;
}

function classRow(item) {
  const enrolled = item.studentIds.map(studentById).filter(Boolean);
  const present = enrolled.filter((student) => item.attendance?.[student.id]).length;
  return `
    <article class="row-card">
      <div>
        <h3>${formatDate(item.date)} as ${item.time} - ${escapeHTML(item.group || 'Turma')}</h3>
        <p class="meta">${escapeHTML(item.coach || 'Professor nao informado')} - ${enrolled.length} aluno(s)</p>
        <div class="pill-row">
          <span class="pill">${present}/${enrolled.length} presencas</span>
          ${item.date === todayISO() ? '<span class="pill ok">hoje</span>' : ''}
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

function statusLabel(status) {
  return { active: 'ativo', trial: 'experimental', paused: 'pausado' }[status] || status;
}

function sortClass(a, b) {
  return `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`);
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

function openStudent(id = '') {
  const student = studentById(id) || {};
  document.getElementById('studentId').value = student.id || '';
  document.getElementById('studentName').value = student.name || '';
  document.getElementById('studentPhone').value = student.phone || '';
  document.getElementById('studentPlan').value = student.plan || '1x semana';
  document.getElementById('studentFee').value = student.fee || '';
  document.getElementById('studentStatus').value = student.status || 'active';
  document.getElementById('studentNote').value = student.note || '';
  openModal('studentModal');
}

function openClass(id = '') {
  const item = state.classes.find((c) => c.id === id) || {};
  document.getElementById('classId').value = item.id || '';
  document.getElementById('classDate').value = item.date || todayISO();
  document.getElementById('classTime').value = item.time || '18:30';
  document.getElementById('classGroup').value = item.group || '';
  document.getElementById('classCoach').value = item.coach || '';
  fillClassStudents(item.studentIds || []);
  openModal('classModal');
}

function fillClassStudents(selected = []) {
  const select = document.getElementById('classStudents');
  if (!select) return;
  select.innerHTML = state.students.filter((student) => student.status !== 'paused').map((student) => (
    `<option value="${student.id}" ${selected.includes(student.id) ? 'selected' : ''}>${escapeHTML(student.name)} - ${escapeHTML(student.plan)}</option>`
  )).join('');
}

function saveStudent(event) {
  event.preventDefault();
  const id = document.getElementById('studentId').value || uid();
  const next = {
    id,
    name: document.getElementById('studentName').value.trim(),
    phone: document.getElementById('studentPhone').value.trim(),
    plan: document.getElementById('studentPlan').value,
    fee: Number(document.getElementById('studentFee').value || 0),
    status: document.getElementById('studentStatus').value,
    note: document.getElementById('studentNote').value.trim(),
    paidUntil: studentById(id)?.paidUntil || ''
  };
  const index = state.students.findIndex((student) => student.id === id);
  if (index >= 0) state.students[index] = next;
  else state.students.push(next);
  saveState();
  closeModal('studentModal');
  render();
  toast('Aluno salvo');
}

function saveClass(event) {
  event.preventDefault();
  const id = document.getElementById('classId').value || uid();
  const studentIds = [...document.getElementById('classStudents').selectedOptions].map((option) => option.value);
  const previous = state.classes.find((item) => item.id === id);
  const attendance = {};
  studentIds.forEach((studentId) => {
    attendance[studentId] = previous?.attendance?.[studentId] || false;
  });
  const next = {
    id,
    date: document.getElementById('classDate').value,
    time: document.getElementById('classTime').value,
    group: document.getElementById('classGroup').value.trim(),
    coach: document.getElementById('classCoach').value.trim(),
    studentIds,
    attendance
  };
  const index = state.classes.findIndex((item) => item.id === id);
  if (index >= 0) state.classes[index] = next;
  else state.classes.push(next);
  saveState();
  closeModal('classModal');
  render();
  toast('Aula salva');
}

function openAttendance(classId) {
  const item = state.classes.find((entry) => entry.id === classId);
  if (!item) return;
  document.getElementById('attendanceTitle').textContent = `${formatDate(item.date)} as ${item.time} - ${item.group || 'Turma'}`;
  document.getElementById('attendanceList').innerHTML = item.studentIds.map(studentById).filter(Boolean).map((student) => `
    <div class="check-item">
      <div>
        <strong>${escapeHTML(student.name)}</strong>
        <p class="meta">${escapeHTML(student.plan)}</p>
      </div>
      <button class="mini-btn ${item.attendance?.[student.id] ? 'present' : ''}" data-toggle-attendance="${item.id}:${student.id}">
        ${item.attendance?.[student.id] ? 'Presente' : 'Marcar'}
      </button>
    </div>
  `).join('') || empty('Nenhum aluno vinculado a esta aula.');
  openModal('attendanceModal');
}

function toggleAttendance(classId, studentId) {
  const item = state.classes.find((entry) => entry.id === classId);
  if (!item) return;
  item.attendance = item.attendance || {};
  item.attendance[studentId] = !item.attendance[studentId];
  saveState();
  openAttendance(classId);
  render();
}

function markPaid(studentId) {
  const student = studentById(studentId);
  if (!student) return;
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  student.paidUntil = date.toISOString().slice(0, 10);
  saveState();
  render();
  toast('Mensalidade marcada como paga');
}

function bindEvents() {
  document.querySelectorAll('.nav-item').forEach((button) => button.addEventListener('click', () => setPage(button.dataset.page)));
  document.querySelectorAll('[data-open-student]').forEach((button) => button.addEventListener('click', () => openStudent()));
  document.querySelectorAll('[data-open-class]').forEach((button) => button.addEventListener('click', () => openClass()));
  document.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => closeModal(button.dataset.close)));
  document.getElementById('studentForm').addEventListener('submit', saveStudent);
  document.getElementById('classForm').addEventListener('submit', saveClass);
  document.getElementById('studentSearch').addEventListener('input', renderStudents);
  document.getElementById('themeBtn').addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('fv_theme', next);
  });
  document.body.addEventListener('click', (event) => {
    const target = event.target.closest('[data-edit-student],[data-edit-class],[data-attendance],[data-toggle-attendance],[data-pay]');
    if (!target) return;
    if (target.dataset.editStudent) openStudent(target.dataset.editStudent);
    if (target.dataset.editClass) openClass(target.dataset.editClass);
    if (target.dataset.attendance) openAttendance(target.dataset.attendance);
    if (target.dataset.toggleAttendance) {
      const [classId, studentId] = target.dataset.toggleAttendance.split(':');
      toggleAttendance(classId, studentId);
    }
    if (target.dataset.pay) markPaid(target.dataset.pay);
  });
}

document.documentElement.dataset.theme = localStorage.getItem('fv_theme') || 'dark';
bindEvents();
render();
