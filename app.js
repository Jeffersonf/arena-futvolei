'use strict';

const STORE_KEY = 'fv_school_state_v2';
const PIN_KEY = 'tlf_admin_pin';
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const todayISO = () => new Date().toISOString().slice(0, 10);
const currentMonth = () => todayISO().slice(0, 7);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const starter = {
  students: [
    { id: 's1', nome: 'Ana Souza', telefone: '(15) 99999-0001', email: '', plano_nome: '2x semana', mensalidade: 220, status: 'Ativo', nivel: 'Intermediário', observacao: 'Prefere turma da noite', pago_ate: todayISO() },
    { id: 's2', nome: 'Bruno Lima', telefone: '(15) 99999-0002', email: '', plano_nome: '1x semana', mensalidade: 160, status: 'Experimental', nivel: 'Iniciante', observacao: 'Aula experimental', pago_ate: '' }
  ],
  plans: [
    { id: 'p1', nome: '1x semana', preco: 160, aulas_semana: 1, descricao: 'Plano inicial', ativo: 1 },
    { id: 'p2', nome: '2x semana', preco: 220, aulas_semana: 2, descricao: 'Mais ritmo e evolução', ativo: 1 },
    { id: 'p3', nome: 'Livre', preco: 300, aulas_semana: 4, descricao: 'Acesso amplo as turmas', ativo: 1 },
    { id: 'p4', nome: 'Avulso', preco: 60, aulas_semana: 0, descricao: 'Aula avulsa', ativo: 1 }
  ],
  classes: [
    { id: 'c1', data: todayISO(), horario: '18:30', turma: 'Iniciantes', professor: 'Jefferson', capacidade: 8, status: 'Marcada', aluno_ids: ['s1', 's2'], presencas: { s1: true, s2: false }, extra_presentes: [] }
  ],
  payments: [],
  waitlist: [
    { id: 'w1', nome: 'Carla Mendes', telefone: '(15) 99999-0003', preferencia: 'Noite - iniciante', status: 'Novo', observacao: 'Pediu informacoes pelo WhatsApp', data_cadastro: todayISO() }
  ]
};

function demoState() {
  const today = todayISO();
  const plans = [
    { id: 'p1', nome: '1x semana', preco: 180, aulas_semana: 1, descricao: 'Uma aula fixa por semana', ativo: 1 },
    { id: 'p2', nome: '2x semana', preco: 260, aulas_semana: 2, descricao: 'Duas aulas fixas por semana', ativo: 1 },
    { id: 'p3', nome: 'Livre', preco: 340, aulas_semana: 4, descricao: 'Acesso amplo as turmas', ativo: 1 },
    { id: 'p4', nome: 'Avulso', preco: 70, aulas_semana: 0, descricao: 'Aula avulsa ou reposicao', ativo: 1 }
  ];
  const names = [
    'Ana Souza', 'Bruno Lima', 'Carla Mendes', 'Diego Alves', 'Fernanda Rocha', 'Gustavo Nunes',
    'Helena Prado', 'Igor Martins', 'Julia Campos', 'Rafael Costa', 'Marina Lopes', 'Thiago Ferreira',
    'Larissa Pires', 'Caio Ribeiro', 'Bianca Moreira', 'Eduardo Santos', 'Patricia Almeida', 'Lucas Barros',
    'Isabela Gomes', 'Mateus Carvalho', 'Renata Duarte', 'Felipe Martins', 'Camila Nogueira', 'Andre Lopes',
    'Sofia Teixeira', 'Vitor Araujo', 'Leticia Freitas', 'Rodrigo Mello', 'Amanda Vieira', 'Pedro Henrique',
    'Natalia Ramos', 'Joao Victor', 'Luana Castro', 'Marcelo Dias', 'Beatriz Fonseca', 'Henrique Reis',
    'Priscila Moura', 'Daniel Batista', 'Laura Cunha', 'Murilo Rocha', 'Tatiane Cardoso', 'Ruan Oliveira',
    'Melissa Correia', 'Alex Silva', 'Barbara Tavares', 'Cesar Augusto', 'Vivian Leal', 'Samuel Pinto'
  ];
  const levels = ['Iniciante', 'Intermediario', 'Avancado', 'Kids'];
  const notes = ['Prefere turma da noite', 'Foco em fundamento', 'Veio por indicacao', 'Treina para torneio', 'Aula experimental marcada', '', 'Retorna no proximo mes', 'Costuma fazer avulso aos sabados'];
  const students = names.map((name, index) => {
    const plan = plans[index % plans.length];
    const paused = index % 17 === 0;
    const trial = index % 11 === 0;
    const pending = index % 6 === 0 || trial;
    return {
      id: `s${index + 1}`,
      nome: name,
      telefone: `(15) 991${String(110000 + index).slice(1)}`,
      email: '',
      plano_id: plan.id,
      plano_nome: plan.nome,
      mensalidade: plan.preco,
      dia_vencimento: (index % 4) * 5 + 5,
      status: paused ? 'Pausado' : trial ? 'Experimental' : 'Ativo',
      nivel: levels[index % levels.length],
      observacao: notes[index % notes.length],
      pago_ate: paused || pending ? '' : addMonthsIso(today, 1)
    };
  });
  const classTemplates = [
    ['Iniciantes', '18:30', 8],
    ['Intermediario', '19:30', 8],
    ['Kids', '18:00', 6],
    ['Avancado', '20:00', 8],
    ['Sabado livre', '08:00', 10],
    ['Experimental', '09:00', 8],
    ['Feminino iniciante', '19:00', 8],
    ['Treino competitivo', '20:30', 8]
  ];
  const classes = Array.from({ length: 24 }, (_item, index) => {
    const template = classTemplates[index % classTemplates.length];
    const dayOffset = Math.floor(index / 3);
    const enrolled = students
      .filter((student, studentIndex) => student.status !== 'Pausado' && studentIndex % classTemplates.length === index % classTemplates.length)
      .slice(0, template[2]);
    if (enrolled.length < 3) {
      enrolled.push(...students.filter((student) => student.status !== 'Pausado').slice(index % 10, (index % 10) + 4));
    }
    const alunoIds = [...new Set(enrolled.map((student) => student.id))].slice(0, template[2]);
    const presencas = {};
    alunoIds.forEach((id, presenceIndex) => {
      if (dayOffset <= 1) presencas[id] = presenceIndex % 4 !== 0;
    });
    return {
      id: `c${index + 1}`,
      data: addDaysIso(today, dayOffset),
      horario: template[1],
      turma: template[0],
      professor: index % 5 === 0 ? 'Professor convidado' : 'Lucao',
      capacidade: template[2],
      status: dayOffset === 0 ? 'Confirmada' : 'Marcada',
      aluno_ids: alunoIds,
      presencas,
      extra_presentes: dayOffset === 0 && index % 6 === 0 ? [{ id: `e${index}`, nome: ['Visitante Rafael', 'Reposicao da Laura', 'Aula teste Felipe'][index % 3], criado_em: today }] : []
    };
  });
  const payments = students.filter((student) => student.pago_ate).slice(0, 32).map((student, index) => ({
    id: `pay${index + 1}`,
    aluno_id: student.id,
    aluno_nome: student.nome,
    referencia: today.slice(0, 7),
    valor: student.mensalidade,
    vencimento: today,
    pago_em: addDaysIso(today, -(index % 8)),
    status: 'PAGO',
    forma_pagamento: index % 3 === 0 ? 'Pix' : index % 3 === 1 ? 'Cartao' : 'Dinheiro'
  }));
  const waitNames = ['Julia Moraes', 'Rafael Brito', 'Marina Lins', 'Otavio Sales', 'Paula Azevedo', 'Nicolas Farias', 'Clara Matos', 'Leandro Paiva', 'Monique Torres', 'Davi Campos', 'Erica Reis', 'Fabio Nascimento'];
  const waitlist = waitNames.map((name, index) => ({
    id: `w${index + 1}`,
    nome: name,
    telefone: `(15) 992${String(220000 + index).slice(1)}`,
    preferencia: ['Noite - iniciante', 'Sabado de manha', 'Kids', 'Experimental', 'Intermediario'][index % 5],
    status: index % 5 === 0 ? 'Convertido' : index % 3 === 0 ? 'Contatado' : 'Novo',
    observacao: ['Chamou pelo Instagram', 'Aguardando confirmar horario', 'Perguntou sobre valores', 'Indicacao de aluno'][index % 4],
    data_cadastro: addDaysIso(today, -index)
  }));
  return {
    students,
    plans,
    classes,
    payments,
    waitlist
  };
}

let apiMode = false;
let state = loadLocalState();
let activeAttendanceClassId = '';

function loadLocalState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    return saved ? { ...demoState(), ...saved } : demoState();
  } catch {
    return demoState();
  }
}

function saveLocalState() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const pin = localStorage.getItem(PIN_KEY);
  if (pin) headers['X-Admin-Pin'] = pin;
  if (options.body) headers['Content-Type'] = 'application/json';
  const res = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function showLogin(show = true) {
  const wall = document.getElementById('loginWall');
  wall.classList.toggle('open', show);
  wall.setAttribute('aria-hidden', show ? 'false' : 'true');
  if (show) setTimeout(() => document.getElementById('loginPin').focus(), 50);
}

async function unlockApp(pin) {
  const cleanPin = String(pin || '').trim();
  if (!cleanPin) throw new Error('Informe o PIN');
  const hasServer = await detectServer();
  if (hasServer) {
    await api('/api/login', { method: 'POST', body: JSON.stringify({ pin: cleanPin }), headers: { 'X-Admin-Pin': cleanPin } });
  } else if (cleanPin !== '1234') {
    throw new Error('PIN invalido');
  }
  localStorage.setItem(PIN_KEY, cleanPin);
  showLogin(false);
  await loadData();
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
  const [students, classes, plans, waitlist, payments] = await Promise.all([
    api('/api/students'),
    api('/api/classes'),
    api('/api/plans'),
    api('/api/waitlist'),
    api('/api/payments')
  ]);
  state = {
    students: students.items || [],
    classes: classes.items || [],
    plans: plans.items || [],
    waitlist: waitlist.items || [],
    payments: payments.items || []
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

function isPaidForMonth(student, month = currentMonth()) {
  return Boolean(student.pago_ate && String(student.pago_ate).slice(0, 7) >= month);
}

function paymentMonth(item = {}) {
  return String(item.referencia || item.pago_em || item.vencimento || '').slice(0, 7);
}

function dueDay(student = {}) {
  return Math.min(31, Math.max(1, Number(student.dia_vencimento || student.vencimento_dia || 10) || 10));
}

function dueDateForMonth(student = {}, month = todayISO().slice(0, 7)) {
  const [year, monthNumber] = month.split('-').map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  return `${month}-${String(Math.min(dueDay(student), lastDay)).padStart(2, '0')}`;
}

function classStudentIds(item = {}) {
  return item.aluno_ids || (item.alunos || []).map((entry) => entry.aluno_id || entry.id);
}

function classStudents(item = {}) {
  return (item.alunos || classStudentIds(item).map(studentById)).filter(Boolean);
}

function classExtras(item = {}) {
  if (Array.isArray(item.extra_presentes)) return item.extra_presentes;
  if (Array.isArray(item.extras)) return item.extras;
  if (typeof item.extras === 'string') {
    try {
      const parsed = JSON.parse(item.extras || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function weekBounds(dateIso = todayISO()) {
  const date = new Date(`${dateIso}T12:00:00`);
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(date);
  start.setDate(date.getDate() + diffToMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10)
  };
}

function weeklyAttendanceCount(studentId, dateIso = todayISO()) {
  const { start, end } = weekBounds(dateIso);
  return state.classes.filter((item) => (
    item.data >= start
    && item.data <= end
    && Boolean(item.presencas?.[studentId] || item.presencas?.[String(studentId)])
  )).length;
}

function planWeeklyTarget(student = {}) {
  const plan = planById(student.plano_id);
  if (plan) return Number(plan.aulas_semana || 0);
  const match = String(student.plano_nome || '').match(/(\d+)\s*x/i);
  return match ? Number(match[1]) : 0;
}

function attendanceSummary(studentId) {
  let enrolled = 0;
  let present = 0;
  const history = [];
  state.classes.forEach((item) => {
    const ids = classStudentIds(item).map(String);
    if (!ids.includes(String(studentId))) return;
    enrolled += 1;
    const wasPresent = Boolean(item.presencas?.[studentId] || item.presencas?.[String(studentId)]);
    if (wasPresent) present += 1;
    history.push({ ...item, wasPresent });
  });
  const rate = enrolled ? Math.round((present / enrolled) * 100) : 0;
  return { enrolled, present, rate, history: history.sort(sortClass) };
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

function addDaysIso(dateIso, days = 7) {
  const date = dateIso ? new Date(`${dateIso}T12:00:00`) : new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function phoneDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function whatsappUrl(phone, text = '') {
  const digits = phoneDigits(phone);
  if (!digits) return '';
  const withCountry = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${withCountry}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
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
  renderQuickActions();
  renderTodayClasses();
  renderPending();
  renderStudents();
  renderClasses();
  renderPayments();
  renderPlans();
  renderWaitlist();
  renderReports();
  renderDataSummary();
  fillClassStudents();
  renderGlobalResults();
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

function nextClass() {
  const nowKey = new Date().toISOString().slice(0, 16);
  return [...state.classes]
    .filter((item) => item.status !== 'Cancelada')
    .sort(sortClass)
    .find((item) => `${item.data}T${item.horario}` >= nowKey) || [...state.classes].sort(sortClass)[0];
}

function renderQuickActions() {
  const activeStudents = state.students.filter((student) => student.status !== 'Pausado');
  const pending = activeStudents.filter((student) => !isPaidForMonth(student, currentMonth()));
  const next = nextClass();
  const actions = [
    ['Cobrar pendentes', `${pending.length} aluno(s)`, 'quick-pending'],
    ['Abrir proxima aula', next ? `${formatDate(next.data)} ${next.horario}` : 'sem aula', 'quick-next-class'],
    ['Novo interessado', 'lista de espera', 'quick-waitlist'],
    ['Nova aula', 'agenda', 'quick-class']
  ];
  document.getElementById('quickActions').innerHTML = actions.map(([title, detail, action]) => `
    <button class="quick-action" type="button" data-action="${action}">
      <span>${title}</span>
      <strong>${escapeHTML(detail)}</strong>
    </button>
  `).join('');
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
        <button class="link-title compact-title" type="button" data-report-student="${student.id}">${escapeHTML(student.nome)}</button>
        <p class="meta">${escapeHTML(student.plano_nome || 'sem plano')} - ${money.format(Number(student.mensalidade || 0))}</p>
        <div class="pill-row"><span class="pill bad">pagamento pendente</span></div>
      </div>
      <div class="actions"><button class="mini-btn" data-pay="${student.id}">Marcar pago</button></div>
    </article>
  `).join('') : empty('Sem pendências por enquanto.');
}

function renderStudents() {
  const query = document.getElementById('studentSearch').value.trim().toLowerCase();
  const status = document.getElementById('studentStatusFilter').value;
  const payment = document.getElementById('studentPaymentFilter').value;
  const students = state.students.filter((student) => {
    const haystack = `${student.nome} ${student.telefone} ${student.plano_nome} ${student.nivel} ${student.status}`.toLowerCase();
    const matchesQuery = haystack.includes(query);
    const matchesStatus = !status || student.status === status;
    const matchesPayment = !payment || (payment === 'paid' ? isPaid(student) : !isPaid(student));
    return matchesQuery && matchesStatus && matchesPayment;
  });
  document.getElementById('studentGrid').innerHTML = students.length ? students.map(studentCard).join('') : empty('Nenhum aluno encontrado.');
}

function renderGlobalResults() {
  const input = document.getElementById('globalSearch');
  const results = document.getElementById('globalResults');
  if (!input || !results) return;
  const query = input.value.trim().toLowerCase();
  if (query.length < 2) {
    results.classList.remove('open');
    results.innerHTML = '';
    return;
  }
  const studentItems = state.students.filter((student) => (
    `${student.nome} ${student.telefone} ${student.plano_nome}`.toLowerCase().includes(query)
  )).slice(0, 5).map((student) => ({
    title: student.nome,
    meta: `${student.plano_nome || 'sem plano'} - ${student.telefone || 'sem telefone'}`,
    action: `student:${student.id}`
  }));
  const waitItems = state.waitlist.filter((item) => (
    `${item.nome} ${item.telefone} ${item.preferencia}`.toLowerCase().includes(query)
  )).slice(0, 3).map((item) => ({
    title: item.nome,
    meta: `espera - ${item.status || 'Novo'}`,
    action: `wait:${item.id}`
  }));
  const items = [...studentItems, ...waitItems];
  results.innerHTML = items.length ? items.map((item) => `
    <button type="button" data-global-result="${item.action}">
      <strong>${escapeHTML(item.title)}</strong>
      <span>${escapeHTML(item.meta)}</span>
    </button>
  `).join('') : '<div class="global-empty">Nada encontrado</div>';
  results.classList.add('open');
}

function openGlobalResult(action) {
  const [kind, id] = action.split(':');
  document.getElementById('globalSearch').value = '';
  renderGlobalResults();
  if (kind === 'student') {
    setPage('students');
    openStudent(id);
  }
  if (kind === 'wait') {
    setPage('waitlist');
    openWaitItem(id);
  }
}

function renderClasses() {
  const date = document.getElementById('classDateFilter').value;
  const classes = [...state.classes].filter((item) => !date || item.data === date).sort(sortClass);
  renderClassesTodayPlanner();
  renderClassCalendar();
  document.getElementById('classList').innerHTML = classes.length ? classes.map(classRow).join('') : empty('Crie a primeira aula da agenda.');
}

function renderClassesTodayPlanner() {
  const target = document.getElementById('classesTodayPlanner');
  if (!target) return;
  const classes = state.classes.filter((item) => item.data === todayISO()).sort(sortClass);
  const expected = classes.reduce((sum, item) => sum + classStudents(item).length, 0);
  const present = classes.reduce((sum, item) => sum + classStudents(item).filter((student) => item.presencas?.[student.aluno_id || student.id] || student.presente).length, 0);
  const extrasTotal = classes.reduce((sum, item) => sum + classExtras(item).length, 0);
  const summary = `
    <article class="today-summary">
      <span>Resumo de hoje</span>
      <strong>${classes.length} aula(s)</strong>
      <small>${expected} previstos - ${present} presentes - ${extrasTotal} fora da lista</small>
    </article>
  `;
  target.innerHTML = classes.length ? `${summary}${classes.map((item) => {
    const enrolled = classStudents(item);
    const extras = classExtras(item);
    return `
      <article class="today-class">
        <div class="today-class-head">
          <div>
            <strong>${escapeHTML(item.horario)} - ${escapeHTML(item.turma || 'Turma')}</strong>
            <span>${escapeHTML(item.professor || 'Professor nao informado')} - ${enrolled.length}/${item.capacidade || 8} previstos</span>
          </div>
          <a class="mini-btn" href="${whatsappShareUrl(classShareText(item))}" target="_blank" rel="noopener">WhatsApp</a>
          <button class="mini-btn" data-attendance="${item.id}">Presencas</button>
        </div>
        <div class="roster-list">
          ${enrolled.map((student) => rosterPerson(student, item.data, Boolean(item.presencas?.[student.aluno_id || student.id] || student.presente))).join('')}
          ${extras.map((extra) => `<span class="roster-person extra"><strong>${escapeHTML(extra.nome || extra)}</strong><small>fora da lista</small></span>`).join('')}
        </div>
      </article>
    `;
  }).join('')}` : empty('Nenhuma aula marcada para hoje.');
}

function renderClassCalendar() {
  const target = document.getElementById('classCalendar');
  if (!target) return;
  const days = Array.from({ length: 7 }, (_item, index) => addDaysIso(todayISO(), index));
  target.innerHTML = days.map((day) => {
    const classes = state.classes.filter((item) => item.data === day && item.status !== 'Cancelada').sort(sortClass);
    return `
      <article class="calendar-day ${day === todayISO() ? 'today' : ''}">
        <button type="button" data-class-day="${day}">
          <strong>${formatDate(day).slice(0, 5)}</strong>
          <span>${classes.length} aula(s)</span>
        </button>
        <div>${classes.slice(0, 3).map((item) => `<small>${escapeHTML(item.horario)} ${escapeHTML(item.turma || '')}</small>`).join('')}</div>
      </article>
    `;
  }).join('');
}

function renderPayments() {
  const monthInput = document.getElementById('paymentMonth');
  if (monthInput && !monthInput.value) monthInput.value = currentMonth();
  const month = monthInput?.value || currentMonth();
  const monthPayments = (state.payments || []).filter((item) => paymentMonth(item) === month);
  const paidThisMonth = monthPayments.reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const activeStudents = state.students.filter((student) => student.status !== 'Pausado');
  const pending = activeStudents.filter((student) => !isPaidForMonth(student, month));
  const expected = activeStudents.reduce((sum, student) => sum + Number(student.mensalidade || 0), 0);
  const query = document.getElementById('paymentSearch')?.value.trim().toLowerCase() || '';
  const filter = document.getElementById('paymentStatusFilter')?.value || '';
  document.getElementById('financeSummary').innerHTML = `
    <article class="mini-stat"><span>Recebido no mês</span><strong>${money.format(paidThisMonth)}</strong></article>
    <article class="mini-stat"><span>Pendências</span><strong>${pending.length}</strong></article>
    <article class="mini-stat"><span>Previsão pendente</span><strong>${money.format(pending.reduce((sum, student) => sum + Number(student.mensalidade || 0), 0))}</strong></article>
  `;
  document.getElementById('financeSummary').insertAdjacentHTML('beforeend', `
    <article class="mini-stat"><span>Previsao do mes</span><strong>${money.format(expected)}</strong></article>
  `);
  const visibleStudents = state.students.filter((student) => {
    const haystack = `${student.nome} ${student.telefone} ${student.plano_nome}`.toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    const matchesFilter = !filter || (filter === 'paid' ? isPaidForMonth(student, month) : !isPaidForMonth(student, month));
    return matchesQuery && matchesFilter;
  }).sort((a, b) => Number(isPaidForMonth(a, month)) - Number(isPaidForMonth(b, month)) || a.nome.localeCompare(b.nome));
  const rows = visibleStudents.map((student) => `
    <article class="row-card">
      <div>
        <button class="link-title compact-title" type="button" data-report-student="${student.id}">${escapeHTML(student.nome)}</button>
        <p class="meta">${money.format(Number(student.mensalidade || 0))} - pago até ${student.pago_ate ? formatDate(student.pago_ate) : 'sem registro'}</p>
        <div class="pill-row">
          <span class="pill ${isPaidForMonth(student, month) ? 'ok' : 'bad'}">${isPaidForMonth(student, month) ? 'em dia' : 'pendente'}</span>
          <span class="pill">vence dia ${dueDay(student)}</span>
        </div>
      </div>
      <div class="actions">
        ${student.telefone ? `<a class="mini-btn" href="${whatsappUrl(student.telefone, `Oi ${student.nome}, tudo bem? Passando para lembrar da mensalidade do Team Lucão Futevôlei.`)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
        <button class="mini-btn" data-copy-charge="${student.id}">Copiar cobranca</button>
        <button class="mini-btn" data-pay="${student.id}">Marcar mes pago</button>
      </div>
    </article>
  `);
  const history = monthPayments.slice(0, 8).map((item) => `
    <article class="row-card compact-row">
      <div>
        <h3>${escapeHTML(item.aluno_nome || 'Pagamento')}</h3>
        <p class="meta">${money.format(Number(item.valor || 0))} - ${formatDate(item.pago_em)} - ${escapeHTML(item.forma_pagamento || 'manual')}</p>
      </div>
    </article>
  `);
  document.getElementById('paymentList').innerHTML = rows.length
    ? `${rows.join('')}${history.length ? `<div class="section-label">Histórico recente</div>${history.join('')}` : ''}`
    : empty('Cadastre alunos para acompanhar mensalidades.');
}

function renderPlans() {
  document.getElementById('planGrid').innerHTML = state.plans.length ? state.plans.map((plan) => `
    <article class="student-card">
      <h3>${escapeHTML(plan.nome)}</h3>
      <p class="meta">${money.format(Number(plan.preco || 0))} - ${Number(plan.aulas_semana || 0)} aula(s)/semana</p>
      <div class="pill-row"><span class="pill ${Number(plan.ativo ?? 1) ? 'ok' : ''}">${Number(plan.ativo ?? 1) ? 'ativo' : 'inativo'}</span></div>
      ${plan.descricao ? `<p class="meta">${escapeHTML(plan.descricao)}</p>` : ''}
      <div class="actions">
        <button class="mini-btn" data-edit-plan="${plan.id}">Editar</button>
        <button class="mini-btn danger-mini" data-delete-plan="${plan.id}">Remover</button>
      </div>
    </article>
  `).join('') : empty('Cadastre planos para organizar aulas e mensalidades.');
}

function renderWaitlist() {
  const status = document.getElementById('waitStatusFilter').value;
  const items = state.waitlist.filter((item) => !status || (item.status || 'Novo') === status);
  document.getElementById('waitlistList').innerHTML = items.length ? items.map((item) => `
    <article class="row-card">
      <div>
        <h3>${escapeHTML(item.nome)}</h3>
        <p class="meta">${escapeHTML(item.telefone || 'sem telefone')} - ${escapeHTML(item.preferencia || 'sem preferencia')}</p>
        <div class="pill-row">
          <span class="pill ${item.status === 'Convertido' ? 'ok' : item.status === 'Contatado' || item.status === 'Experimental marcado' ? 'warn' : item.status === 'Perdido' ? 'bad' : ''}">${escapeHTML(item.status || 'Novo')}</span>
          ${item.data_cadastro ? `<span class="pill">${formatDate(item.data_cadastro)}</span>` : ''}
        </div>
        ${item.observacao ? `<p class="meta">${escapeHTML(item.observacao)}</p>` : ''}
      </div>
      <div class="actions">
        ${item.telefone ? `<a class="mini-btn" href="${whatsappUrl(item.telefone, `Oi ${item.nome}, tudo bem? Aqui é do Team Lucão Futevôlei. Ainda tem interesse em começar as aulas?`)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
        <button class="mini-btn" data-wait-status="${item.id}:Contatado">Contatado</button>
        <button class="mini-btn" data-wait-status="${item.id}:Experimental marcado">Experimental</button>
        <button class="mini-btn" data-edit-wait="${item.id}">Editar</button>
        <button class="mini-btn" data-convert-wait="${item.id}">Virar aluno</button>
        <button class="mini-btn danger-mini" data-wait-status="${item.id}:Perdido">Perdido</button>
        <button class="mini-btn" data-delete-wait="${item.id}">Remover</button>
      </div>
    </article>
  `).join('') : empty('Sem interessados em espera.');
}

function renderReports() {
  const paidThisMonth = (state.payments || []).reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const pending = state.students.filter((student) => student.status !== 'Pausado' && !isPaid(student));
  const active = state.students.filter((student) => student.status === 'Ativo').length;
  const totalAttendances = state.classes.reduce((sum, item) => {
    const presencas = item.presencas || {};
    return sum + Object.values(presencas).filter(Boolean).length;
  }, 0);
  const reportItems = [
    ['Alunos ativos', active],
    ['Pendências', pending.length],
    ['Recebido no mês', money.format(paidThisMonth)],
    ['Presenças marcadas', totalAttendances]
  ];
  document.getElementById('reportGrid').innerHTML = reportItems.map(([label, value]) => `
    <article class="mini-stat"><span>${label}</span><strong>${escapeHTML(value)}</strong></article>
  `).join('');

  const attendanceRows = state.students.map((student) => {
    let enrolled = 0;
    let present = 0;
    state.classes.forEach((item) => {
      const ids = item.aluno_ids || (item.alunos || []).map((entry) => entry.aluno_id || entry.id);
      if (!ids.map(String).includes(String(student.id))) return;
      enrolled += 1;
      if (item.presencas?.[student.id] || item.presencas?.[String(student.id)]) present += 1;
    });
    const rate = enrolled ? Math.round((present / enrolled) * 100) : 0;
    return { student, enrolled, present, rate };
  }).sort((a, b) => b.enrolled - a.enrolled || a.student.nome.localeCompare(b.student.nome));

  document.getElementById('attendanceReport').innerHTML = attendanceRows.length ? attendanceRows.map((item) => `
    <article class="row-card compact-row">
      <div>
        <h3>${escapeHTML(item.student.nome)}</h3>
        <p class="meta">${item.present}/${item.enrolled} presenças - ${item.rate}% de comparecimento</p>
      </div>
      <div class="pill-row"><span class="pill ${item.rate >= 70 ? 'ok' : item.enrolled ? 'warn' : ''}">${item.enrolled ? 'com histórico' : 'sem aulas'}</span></div>
    </article>
  `).join('') : empty('Cadastre alunos para gerar relatório.');

  const attentionRows = [
    ...pending.map((student) => ({
      title: student.nome,
      text: `${money.format(Number(student.mensalidade || 0))} pendente`,
      tag: 'pagamento'
    })),
    ...state.waitlist.filter((item) => (item.status || 'Novo') !== 'Convertido').map((item) => ({
      title: item.nome,
      text: item.preferencia || 'Interessado sem preferencia',
      tag: item.status || 'Novo'
    }))
  ];
  document.getElementById('attentionReport').innerHTML = attentionRows.length ? attentionRows.map((item) => `
    <article class="row-card compact-row">
      <div>
        <h3>${escapeHTML(item.title)}</h3>
        <p class="meta">${escapeHTML(item.text)}</p>
      </div>
      <div class="pill-row"><span class="pill bad">${escapeHTML(item.tag)}</span></div>
    </article>
  `).join('') : empty('Nenhum ponto de atenção agora.');
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
  const message = `Oi ${student.nome}, tudo bem? Aqui e do Team Lucao Futevolei.`;
  const weekly = weeklyAttendanceCount(student.id);
  const target = planWeeklyTarget(student);
  return `
    <article class="student-card">
      <button class="link-title" type="button" data-report-student="${student.id}">${escapeHTML(student.nome)}</button>
      <p class="meta">${escapeHTML(student.telefone || 'sem telefone')}</p>
      <div class="pill-row">
        <span class="pill">${escapeHTML(student.plano_nome || 'sem plano')}</span>
        <span class="pill">${escapeHTML(student.nivel || 'Iniciante')}</span>
        <span class="pill ${student.status === 'Ativo' ? 'ok' : student.status === 'Experimental' ? 'warn' : ''}">${escapeHTML(student.status || 'Ativo')}</span>
        <span class="pill ${isPaid(student) ? 'ok' : 'bad'}">${isPaid(student) ? 'em dia' : 'pendente'}</span>
        <span class="pill">${weekly}/${target || '-'} na semana</span>
      </div>
      ${student.observacao ? `<p class="meta">${escapeHTML(student.observacao)}</p>` : ''}
      <div class="actions">
        ${student.telefone ? `<a class="mini-btn" href="${whatsappUrl(student.telefone, message)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
        <button class="mini-btn" data-edit-student="${student.id}">Editar</button>
        <button class="mini-btn" data-pay="${student.id}">Pago</button>
        <button class="mini-btn danger-mini" data-delete-student="${student.id}">Remover</button>
      </div>
    </article>
  `;
}

function classRow(item) {
  const enrolled = classStudents(item);
  const present = enrolled.filter((student) => item.presencas?.[student.aluno_id || student.id] || student.presente).length;
  const extras = classExtras(item);
  return `
    <article class="row-card">
      <div>
        <h3>${formatDate(item.data)} as ${item.horario} - ${escapeHTML(item.turma || 'Turma')}</h3>
        <p class="meta">${escapeHTML(item.professor || 'Professor nao informado')} - ${enrolled.length}/${item.capacidade || 8} aluno(s) previstos</p>
        <div class="pill-row">
          <span class="pill">${present}/${enrolled.length} presencas</span>
          ${extras.length ? `<span class="pill warn">${extras.length} fora da lista</span>` : ''}
          <span class="pill">${escapeHTML(item.status || 'Marcada')}</span>
          ${item.data === todayISO() ? '<span class="pill ok">hoje</span>' : ''}
        </div>
        ${enrolled.length || extras.length ? `
          <div class="roster-list class-roster">
            ${enrolled.map((student) => rosterPerson(student, item.data, Boolean(item.presencas?.[student.aluno_id || student.id] || student.presente))).join('')}
            ${extras.map((extra) => `<span class="roster-person extra"><strong>${escapeHTML(extra.nome || extra)}</strong><small>fora da lista</small></span>`).join('')}
          </div>
        ` : ''}
      </div>
      <div class="actions">
        <a class="mini-btn" href="${whatsappShareUrl(classShareText(item))}" target="_blank" rel="noopener">WhatsApp</a>
        <button class="mini-btn" data-attendance="${item.id}">Presencas</button>
        <button class="mini-btn" data-duplicate-class="${item.id}">Duplicar</button>
        <button class="mini-btn" data-edit-class="${item.id}">Editar</button>
        <button class="mini-btn danger-mini" data-delete-class="${item.id}">Remover</button>
      </div>
    </article>
  `;
}

function rosterPerson(student, dateIso, present = false) {
  const id = student.aluno_id || student.id;
  const fullStudent = studentById(id) || student;
  const count = weeklyAttendanceCount(id, dateIso);
  const target = planWeeklyTarget(fullStudent);
  return `
    <span class="roster-person ${present ? 'present' : ''}">
      <button type="button" data-report-student="${id}">${escapeHTML(student.nome)}</button>
      <small>${count}/${target || '-'} na semana</small>
    </span>
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
  document.getElementById('studentDueDay').value = student.dia_vencimento || student.vencimento_dia || 10;
  document.getElementById('studentLevel').value = student.nivel || 'Iniciante';
  document.getElementById('studentStatus').value = student.status || 'Ativo';
  document.getElementById('studentNote').value = student.observacao || '';
  openModal('studentModal');
}

function openStudentReport(id) {
  const student = studentById(id);
  if (!student) return;
  const summary = attendanceSummary(id);
  const weekly = weeklyAttendanceCount(id);
  const target = planWeeklyTarget(student);
  const nextClasses = summary.history.filter((item) => item.data >= todayISO()).slice(0, 6);
  const recentClasses = [...summary.history].filter((item) => item.data < todayISO()).reverse().slice(0, 6);
  const payments = (state.payments || []).filter((item) => String(item.aluno_id) === String(id)).slice(0, 6);
  document.getElementById('studentReport').innerHTML = `
    <div class="report-hero">
      <div>
        <span class="section-label">Relatorio do aluno</span>
        <h2>${escapeHTML(student.nome)}</h2>
        <p class="meta">${escapeHTML(student.telefone || 'sem telefone')} - ${escapeHTML(student.plano_nome || 'sem plano')} - vence dia ${dueDay(student)} - ${escapeHTML(student.nivel || 'sem nivel')}</p>
      </div>
      <div class="actions">
        ${student.telefone ? `<a class="mini-btn" href="${whatsappUrl(student.telefone, `Oi ${student.nome}, tudo bem? Aqui e do Team Lucao Futevolei.`)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
        <button class="mini-btn" data-edit-student="${student.id}">Editar</button>
        <button class="mini-btn" data-pay="${student.id}">Pago</button>
      </div>
    </div>
    <div class="report-grid student-report-grid">
      <article class="mini-stat"><span>Semana atual</span><strong>${weekly}/${target || '-'}</strong></article>
      <article class="mini-stat"><span>Presencas</span><strong>${summary.present}/${summary.enrolled}</strong></article>
      <article class="mini-stat"><span>Comparecimento</span><strong>${summary.rate}%</strong></article>
      <article class="mini-stat"><span>Pagamento</span><strong>${isPaid(student) ? 'Em dia' : 'Pendente'}</strong></article>
    </div>
    ${student.observacao ? `<p class="report-note">${escapeHTML(student.observacao)}</p>` : ''}
    <div class="two-col report-columns">
      <section>
        <div class="section-label">Proximas aulas previstas</div>
        <div class="list">${nextClasses.length ? nextClasses.map((item) => reportClassLine(item)).join('') : empty('Nenhuma proxima aula vinculada.')}</div>
      </section>
      <section>
        <div class="section-label">Historico recente</div>
        <div class="list">${recentClasses.length ? recentClasses.map((item) => reportClassLine(item, true)).join('') : empty('Sem historico de aulas.')}</div>
      </section>
    </div>
    <div class="section-label">Pagamentos recentes</div>
    <div class="list">${payments.length ? payments.map((item) => `
      <article class="row-card compact-row">
        <div>
          <h3>${money.format(Number(item.valor || 0))}</h3>
          <p class="meta">${escapeHTML(item.referencia || '')} - ${formatDate(item.pago_em || item.vencimento)} - ${escapeHTML(item.forma_pagamento || 'manual')}</p>
        </div>
      </article>
    `).join('') : empty('Sem pagamento registrado neste historico.')}</div>
  `;
  openModal('studentReportModal');
}

function reportClassLine(item, showPresence = false) {
  return `
    <article class="row-card compact-row">
      <div>
        <h3>${formatDate(item.data)} ${escapeHTML(item.horario)} - ${escapeHTML(item.turma || 'Turma')}</h3>
        <p class="meta">${escapeHTML(item.professor || 'Professor nao informado')}</p>
      </div>
      ${showPresence ? `<div class="pill-row"><span class="pill ${item.wasPresent ? 'ok' : 'warn'}">${item.wasPresent ? 'presente' : 'faltou'}</span></div>` : ''}
    </article>
  `;
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
  document.getElementById('classRepeatWeeks').value = item.id ? 1 : 4;
  document.getElementById('classRepeatWeeks').disabled = Boolean(item.id);
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
  document.getElementById('waitId').value = '';
  document.getElementById('waitName').value = '';
  document.getElementById('waitPhone').value = '';
  document.getElementById('waitPreference').value = '';
  document.getElementById('waitStatus').value = 'Novo';
  document.getElementById('waitNote').value = '';
  openModal('waitlistModal');
}

function openWaitItem(id) {
  const item = state.waitlist.find((entry) => String(entry.id) === String(id));
  if (!item) return;
  document.getElementById('waitId').value = item.id || '';
  document.getElementById('waitName').value = item.nome || '';
  document.getElementById('waitPhone').value = item.telefone || '';
  document.getElementById('waitPreference').value = item.preferencia || '';
  document.getElementById('waitStatus').value = item.status || 'Novo';
  document.getElementById('waitNote').value = item.observacao || '';
  openModal('waitlistModal');
}

function pendingChargeText() {
  const pending = state.students.filter((student) => student.status !== 'Pausado' && !isPaid(student));
  if (!pending.length) return 'Sem mensalidades pendentes no momento.';
  return pending.map((student) => (
    `${student.nome} - ${student.telefone || 'sem telefone'} - ${money.format(Number(student.mensalidade || 0))}`
  )).join('\n');
}

function studentChargeText(student) {
  return `Oi ${student.nome}, tudo bem? Passando para lembrar da mensalidade do Team Lucao Futevolei no valor de ${money.format(Number(student.mensalidade || 0))}. Vencimento todo dia ${dueDay(student)}.`;
}

async function copyPendingCharges() {
  const text = pendingChargeText();
  if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
  setPage('payments');
  toast('Lista de cobranca copiada');
}

async function copyStudentCharge(studentId) {
  const student = studentById(studentId);
  if (!student) return;
  const text = studentChargeText(student);
  if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
  toast('Cobranca copiada');
}

function classShareText(item) {
  const enrolled = classStudents(item);
  const names = enrolled.length ? enrolled.map((student, index) => `${index + 1}. ${student.nome}`).join('\n') : 'Sem alunos previstos.';
  return `Aula Team Lucao Futevolei\n${formatDate(item.data)} as ${item.horario} - ${item.turma || 'Turma'}\nProfessor: ${item.professor || 'nao informado'}\n\nPrevistos:\n${names}`;
}

function whatsappShareUrl(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

function openNextClass() {
  const item = nextClass();
  if (!item) {
    openClass();
    return;
  }
  if ((item.aluno_ids || item.alunos || []).length) openAttendance(item.id);
  else openClass(item.id);
}

function handleQuickAction(action) {
  if (action === 'quick-pending') copyPendingCharges().catch((err) => toast(err.message));
  if (action === 'quick-next-class') openNextClass();
  if (action === 'quick-waitlist') openWaitlist();
  if (action === 'quick-class') openClass();
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
    dia_vencimento: dueDay({ dia_vencimento: document.getElementById('studentDueDay').value }),
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
    presencas,
    extra_presentes: classExtras(previous)
  };
  const repeatWeeks = id ? 1 : Math.min(12, Math.max(1, Number(document.getElementById('classRepeatWeeks').value || 1)));
  const classPayloads = Array.from({ length: repeatWeeks }, (_item, index) => ({
    ...payload,
    data: addDaysIso(payload.data, index * 7),
    presencas: index === 0 ? payload.presencas : {},
    extra_presentes: index === 0 ? payload.extra_presentes : []
  }));
  if (apiMode) {
    if (id) await api(`/api/classes/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    else {
      for (const item of classPayloads) {
        await api('/api/classes', { method: 'POST', body: JSON.stringify(item) });
      }
    }
    await loadData();
  } else {
    if (id) {
      const next = { ...payload, id };
      const index = state.classes.findIndex((item) => String(item.id) === String(next.id));
      if (index >= 0) state.classes[index] = next;
    } else {
      classPayloads.forEach((item) => state.classes.push({ ...item, id: uid() }));
    }
    saveLocalState();
    render();
  }
  closeModal('classModal');
  toast(repeatWeeks > 1 ? `${repeatWeeks} aulas criadas` : 'Aula salva');
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
  const id = document.getElementById('waitId').value;
  const payload = {
    nome: document.getElementById('waitName').value.trim(),
    telefone: document.getElementById('waitPhone').value.trim(),
    preferencia: document.getElementById('waitPreference').value.trim(),
    status: document.getElementById('waitStatus').value,
    observacao: document.getElementById('waitNote').value.trim()
  };
  if (apiMode) {
    await api(id ? `/api/waitlist/${id}` : '/api/waitlist', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    await loadData();
  } else {
    const next = { ...payload, id: id || uid(), data_cadastro: state.waitlist.find((item) => String(item.id) === String(id))?.data_cadastro || todayISO() };
    const index = state.waitlist.findIndex((item) => String(item.id) === String(next.id));
    if (index >= 0) state.waitlist[index] = next;
    else state.waitlist.unshift(next);
    saveLocalState();
    render();
  }
  closeModal('waitlistModal');
  toast('Interessado salvo');
}

function openAttendance(classId) {
  const item = state.classes.find((entry) => String(entry.id) === String(classId));
  if (!item) return;
  activeAttendanceClassId = classId;
  const ids = classStudentIds(item);
  const extras = classExtras(item);
  document.getElementById('attendanceTitle').textContent = `${formatDate(item.data)} as ${item.horario} - ${item.turma || 'Turma'}`;
  document.getElementById('attendanceList').innerHTML = ids.map(studentById).filter(Boolean).map((student) => `
    <div class="check-item">
      <div>
        <strong>${escapeHTML(student.nome)}</strong>
        <p class="meta">${escapeHTML(student.plano_nome || 'sem plano')} - ${weeklyAttendanceCount(student.id, item.data)}/${planWeeklyTarget(student) || '-'} na semana</p>
      </div>
      <button class="mini-btn ${item.presencas?.[student.id] ? 'present' : ''}" data-toggle-attendance="${item.id}:${student.id}">
        ${item.presencas?.[student.id] ? 'Presente' : 'Marcar'}
      </button>
    </div>
  `).join('') || empty('Nenhum aluno vinculado a esta aula.');
  document.getElementById('extraAttendanceList').innerHTML = extras.length ? extras.map((extra, index) => `
    <article class="row-card compact-row">
      <div>
        <h3>${escapeHTML(extra.nome || extra)}</h3>
        <p class="meta">Veio sem estar na lista prevista</p>
      </div>
      <button class="mini-btn danger-mini" data-remove-extra="${item.id}:${index}">Remover</button>
    </article>
  `).join('') : empty('Nenhum avulso marcado.');
  openModal('attendanceModal');
}

async function saveClassItem(item) {
  if (apiMode) {
    await api(`/api/classes/${item.id}`, { method: 'PUT', body: JSON.stringify(item) });
    await loadData();
  } else {
    saveLocalState();
    render();
  }
}

async function addExtraAttendance(event) {
  event.preventDefault();
  const item = state.classes.find((entry) => String(entry.id) === String(activeAttendanceClassId));
  if (!item) return;
  const input = document.getElementById('extraAttendanceName');
  const name = input.value.trim();
  if (!name) return;
  item.extra_presentes = [...classExtras(item), { id: uid(), nome: name, criado_em: todayISO() }];
  input.value = '';
  await saveClassItem(item);
  openAttendance(item.id);
  toast('Avulso adicionado');
}

async function removeExtraAttendance(classId, index) {
  const item = state.classes.find((entry) => String(entry.id) === String(classId));
  if (!item) return;
  item.extra_presentes = [...classExtras(item)];
  item.extra_presentes.splice(Number(index), 1);
  await saveClassItem(item);
  openAttendance(classId);
  toast('Avulso removido');
}

async function setClassAttendance(classId, present) {
  const item = state.classes.find((entry) => String(entry.id) === String(classId));
  if (!item) return;
  item.presencas = item.presencas || {};
  classStudentIds(item).forEach((studentId) => { item.presencas[studentId] = present; });
  if (apiMode) {
    await api(`/api/classes/${classId}/attendance`, { method: 'PUT', body: JSON.stringify({ attendance: item.presencas }) });
    await loadData();
  } else {
    saveLocalState();
    render();
  }
  openAttendance(classId);
  toast(present ? 'Turma marcada presente' : 'Presenças limpas');
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
    state.payments = state.payments || [];
    state.payments.unshift({
      id: uid(),
      aluno_id: student.id,
      aluno_nome: student.nome,
      referencia: student.pago_ate.slice(0, 7),
      valor: Number(student.mensalidade || 0),
      pago_em: todayISO(),
      status: 'PAGO',
      forma_pagamento: 'manual'
    });
    saveLocalState();
    render();
  }
  toast('Mensalidade marcada como paga');
}

async function deleteStudent(id) {
  const student = studentById(id);
  if (!student || !confirm(`Remover ${student.nome}?`)) return;
  if (apiMode) {
    await api(`/api/students/${id}`, { method: 'DELETE' });
    await loadData();
  } else {
    state.students = state.students.filter((item) => String(item.id) !== String(id));
    state.classes.forEach((item) => {
      item.aluno_ids = (item.aluno_ids || []).filter((studentId) => String(studentId) !== String(id));
      if (item.presencas) delete item.presencas[id];
    });
    saveLocalState();
    render();
  }
  toast('Aluno removido');
}

async function deleteClass(id) {
  if (!confirm('Remover esta aula?')) return;
  if (apiMode) {
    await api(`/api/classes/${id}`, { method: 'DELETE' });
    await loadData();
  } else {
    state.classes = state.classes.filter((item) => String(item.id) !== String(id));
    saveLocalState();
    render();
  }
  toast('Aula removida');
}

async function duplicateClass(id) {
  const item = state.classes.find((entry) => String(entry.id) === String(id));
  if (!item) return;
  const next = {
    data: addDaysIso(item.data, 7),
    horario: item.horario,
    turma: item.turma,
    professor: item.professor,
    capacidade: item.capacidade,
    status: 'Marcada',
    aluno_ids: classStudentIds(item),
    presencas: {},
    extra_presentes: []
  };
  if (apiMode) {
    await api('/api/classes', { method: 'POST', body: JSON.stringify(next) });
    await loadData();
  } else {
    state.classes.push({ ...next, id: uid() });
    saveLocalState();
    render();
  }
  toast('Aula duplicada para a próxima semana');
}

async function deletePlan(id) {
  if (!confirm('Remover este plano? Alunos existentes continuam com o nome do plano salvo.')) return;
  if (apiMode) {
    await api(`/api/tables/planos/${id}`, { method: 'DELETE' });
    await loadData();
  } else {
    state.plans = state.plans.filter((item) => String(item.id) !== String(id));
    saveLocalState();
    render();
  }
  toast('Plano removido');
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

async function updateWaitStatus(id, status) {
  const item = state.waitlist.find((entry) => String(entry.id) === String(id));
  if (!item) return;
  item.status = status;
  if (apiMode) {
    await api(`/api/waitlist/${id}`, { method: 'PUT', body: JSON.stringify(item) });
    await loadData();
  } else {
    saveLocalState();
    render();
  }
  toast('Status atualizado');
}

function convertWait(id) {
  const item = state.waitlist.find((entry) => String(entry.id) === String(id));
  if (!item) return;
  item.status = 'Convertido';
  if (!apiMode) saveLocalState();
  openStudent();
  document.getElementById('studentName').value = item.nome || '';
  document.getElementById('studentPhone').value = item.telefone || '';
  document.getElementById('studentNote').value = [item.preferencia, item.observacao].filter(Boolean).join(' - ');
}

async function downloadBackup() {
  const payload = apiMode ? await api('/api/backup.json') : { app: 'TeamLucaoFutevolei.LocalState', exported_at: new Date().toISOString(), data: state };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `team-lucao-futevolei-backup-${todayISO()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function downloadText(filename, text, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function exportCsv(kind) {
  const configs = {
    students: {
      filename: `team-lucao-alunos-${todayISO()}.csv`,
      headers: ['nome', 'telefone', 'email', 'plano', 'mensalidade', 'dia_vencimento', 'status', 'nivel', 'pago_ate', 'observacao'],
      rows: state.students.map((student) => [
        student.nome,
        student.telefone,
        student.email,
        student.plano_nome,
        student.mensalidade,
        dueDay(student),
        student.status,
        student.nivel,
        student.pago_ate,
        student.observacao
      ])
    },
    payments: {
      filename: `team-lucao-pagamentos-${todayISO()}.csv`,
      headers: ['aluno', 'referencia', 'valor', 'vencimento', 'pago_em', 'status', 'forma_pagamento'],
      rows: (state.payments || []).map((item) => [
        item.aluno_nome || studentById(item.aluno_id)?.nome || '',
        item.referencia,
        item.valor,
        item.vencimento,
        item.pago_em,
        item.status,
        item.forma_pagamento
      ])
    },
    classes: {
      filename: `team-lucao-aulas-${todayISO()}.csv`,
      headers: ['data', 'horario', 'turma', 'professor', 'capacidade', 'status', 'alunos', 'presencas', 'fora_da_lista'],
      rows: state.classes.map((item) => {
        const enrolled = (item.alunos || (item.aluno_ids || []).map(studentById)).filter(Boolean);
        const present = enrolled.filter((student) => item.presencas?.[student.aluno_id || student.id] || student.presente).length;
        return [item.data, item.horario, item.turma, item.professor, item.capacidade, item.status, enrolled.length, present, classExtras(item).length];
      })
    },
    waitlist: {
      filename: `team-lucao-espera-${todayISO()}.csv`,
      headers: ['nome', 'telefone', 'preferencia', 'status', 'data_cadastro', 'observacao'],
      rows: state.waitlist.map((item) => [item.nome, item.telefone, item.preferencia, item.status, item.data_cadastro, item.observacao])
    }
  };
  const config = configs[kind];
  if (!config) return;
  const csv = [config.headers, ...config.rows].map((row) => row.map(csvCell).join(',')).join('\n');
  downloadText(config.filename, csv, 'text/csv;charset=utf-8');
  toast('CSV exportado');
}

async function createServerBackup() {
  if (!apiMode) {
    toast('Backup em servidor só com npm start');
    return;
  }
  const res = await api('/api/backups/create', { method: 'POST', body: JSON.stringify({}) });
  toast(`Backup criado: ${res.filename}`);
}

async function importBackup(file) {
  if (!file) return;
  const payload = JSON.parse(await file.text());
  if (!confirm('Importar backup? Isso vai mesclar os dados do arquivo com os dados atuais.')) return;
  if (apiMode) {
    await api('/api/import', { method: 'POST', body: JSON.stringify({ ...payload, mode: 'merge' }) });
    await loadData();
  } else {
    const data = payload.data || payload;
    state = {
      students: data.students || data.alunos || state.students,
      plans: data.plans || data.planos || state.plans,
      classes: data.classes || data.aulas || state.classes,
      waitlist: data.waitlist || data.lista_espera || state.waitlist,
      payments: data.payments || data.pagamentos || state.payments || []
    };
    saveLocalState();
    render();
  }
  toast('Backup importado');
}

function serverDemoPayload(next) {
  const studentId = (id) => Number(String(id).replace(/\D/g, ''));
  return {
    app: 'TeamLucaoFutevolei.AdminState',
    version: 1,
    data: {
      planos: next.plans.map((plan) => ({ ...plan, id: studentId(plan.id) })),
      alunos: next.students.map((student) => ({
        ...student,
        id: studentId(student.id),
        dia_vencimento: dueDay(student),
        plano_id: student.plano_id ? studentId(student.plano_id) : null
      })),
      aulas: next.classes.map((item) => ({
        id: studentId(item.id),
        data: item.data,
        horario: item.horario,
        turma: item.turma,
        professor: item.professor,
        capacidade: item.capacidade,
        status: item.status,
        extras: JSON.stringify(classExtras(item)),
        observacao: ''
      })),
      aula_alunos: next.classes.flatMap((item) => (item.aluno_ids || []).map((studentIdValue, index) => ({
        id: studentId(`${item.id}${index + 1}`),
        aula_id: studentId(item.id),
        aluno_id: studentId(studentIdValue),
        presente: item.presencas?.[studentIdValue] ? 1 : 0,
        observacao: ''
      }))),
      pagamentos: next.payments.map((payment) => ({
        id: studentId(payment.id),
        aluno_id: studentId(payment.aluno_id),
        referencia: payment.referencia,
        valor: payment.valor,
        vencimento: payment.vencimento,
        pago_em: payment.pago_em,
        status: payment.status,
        forma_pagamento: payment.forma_pagamento,
        observacao: 'Carga demo'
      })),
      lista_espera: next.waitlist.map((item) => ({
        ...item,
        id: studentId(item.id)
      })),
      disponibilidade: [],
      logs: []
    }
  };
}

async function loadDemoData() {
  if (!confirm('Carregar dados ficticios de demo? Isso substitui os dados atuais.')) return;
  const next = demoState();
  if (apiMode) {
    await api('/api/import?mode=replace', { method: 'POST', body: JSON.stringify(serverDemoPayload(next)) });
    await loadData();
  } else {
    state = next;
    saveLocalState();
    render();
  }
  toast('Demo realista carregada');
}

function resetLocal() {
  if (!confirm('Resetar dados locais deste navegador?')) return;
  localStorage.removeItem(STORE_KEY);
  state = structuredClone(starter);
  render();
  toast('Dados locais resetados');
}

function bindEvents() {
  document.getElementById('loginForm').addEventListener('submit', (event) => {
    event.preventDefault();
    unlockApp(document.getElementById('loginPin').value).catch((err) => toast(err.message));
  });
  document.querySelectorAll('.nav-item').forEach((button) => button.addEventListener('click', () => setPage(button.dataset.page)));
  document.querySelectorAll('[data-open-student]').forEach((button) => button.addEventListener('click', () => openStudent()));
  document.querySelectorAll('[data-open-class]').forEach((button) => button.addEventListener('click', () => openClass()));
  document.querySelectorAll('[data-open-plan]').forEach((button) => button.addEventListener('click', () => openPlan()));
  document.querySelectorAll('[data-open-waitlist]').forEach((button) => button.addEventListener('click', () => openWaitlist()));
  document.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => closeModal(button.dataset.close)));
  document.querySelectorAll('[data-refresh]').forEach((button) => button.addEventListener('click', () => loadData().then(() => toast('Dados atualizados')).catch((err) => toast(err.message))));
  document.querySelectorAll('[data-load-demo]').forEach((button) => button.addEventListener('click', () => loadDemoData().catch((err) => toast(err.message))));
  document.querySelectorAll('[data-backup]').forEach((button) => button.addEventListener('click', () => downloadBackup().catch((err) => toast(err.message))));
  document.querySelectorAll('[data-export]').forEach((button) => button.addEventListener('click', () => exportCsv(button.dataset.export)));
  document.querySelectorAll('[data-copy-pending]').forEach((button) => button.addEventListener('click', () => copyPendingCharges().catch((err) => toast(err.message))));
  document.querySelectorAll('[data-server-backup]').forEach((button) => button.addEventListener('click', () => createServerBackup().catch((err) => toast(err.message))));
  document.querySelectorAll('[data-reset-local]').forEach((button) => button.addEventListener('click', resetLocal));
  document.querySelectorAll('[data-clear-class-filter]').forEach((button) => button.addEventListener('click', () => {
    document.getElementById('classDateFilter').value = '';
    renderClasses();
  }));
  document.getElementById('quickActions').addEventListener('click', (event) => {
    const target = event.target.closest('[data-action]');
    if (target) handleQuickAction(target.dataset.action);
  });
  document.getElementById('studentForm').addEventListener('submit', (event) => saveStudent(event).catch((err) => toast(err.message)));
  document.getElementById('classForm').addEventListener('submit', (event) => saveClass(event).catch((err) => toast(err.message)));
  document.getElementById('planForm').addEventListener('submit', (event) => savePlan(event).catch((err) => toast(err.message)));
  document.getElementById('waitlistForm').addEventListener('submit', (event) => saveWaitlist(event).catch((err) => toast(err.message)));
  document.getElementById('extraAttendanceForm').addEventListener('submit', (event) => addExtraAttendance(event).catch((err) => toast(err.message)));
  document.getElementById('markAllPresent').addEventListener('click', () => setClassAttendance(activeAttendanceClassId, true).catch((err) => toast(err.message)));
  document.getElementById('clearAttendance').addEventListener('click', () => setClassAttendance(activeAttendanceClassId, false).catch((err) => toast(err.message)));
  document.getElementById('studentSearch').addEventListener('input', renderStudents);
  document.getElementById('globalSearch').addEventListener('input', renderGlobalResults);
  document.getElementById('globalResults').addEventListener('click', (event) => {
    const target = event.target.closest('[data-global-result]');
    if (target) openGlobalResult(target.dataset.globalResult);
  });
  document.getElementById('studentStatusFilter').addEventListener('change', renderStudents);
  document.getElementById('studentPaymentFilter').addEventListener('change', renderStudents);
  document.getElementById('paymentMonth').addEventListener('change', renderPayments);
  document.getElementById('paymentSearch').addEventListener('input', renderPayments);
  document.getElementById('paymentStatusFilter').addEventListener('change', renderPayments);
  document.getElementById('classDateFilter').addEventListener('change', renderClasses);
  document.getElementById('waitStatusFilter').addEventListener('change', renderWaitlist);
  document.getElementById('importFile').addEventListener('change', (event) => {
    importBackup(event.target.files[0]).catch((err) => toast(err.message));
    event.target.value = '';
  });
  document.getElementById('studentPlan').addEventListener('change', (event) => {
    const plan = planById(event.target.value);
    if (plan) document.getElementById('studentFee').value = plan.preco || '';
  });
  document.getElementById('themeBtn').addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('fv_theme', next);
  });
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem(PIN_KEY);
    showLogin(true);
  });
  document.body.addEventListener('click', (event) => {
    const target = event.target.closest('[data-report-student],[data-edit-student],[data-delete-student],[data-edit-class],[data-delete-class],[data-duplicate-class],[data-edit-plan],[data-delete-plan],[data-attendance],[data-toggle-attendance],[data-pay],[data-copy-charge],[data-edit-wait],[data-delete-wait],[data-wait-status],[data-convert-wait],[data-remove-extra],[data-class-day]');
    if (!target) return;
    if (target.dataset.reportStudent) openStudentReport(target.dataset.reportStudent);
    if (target.dataset.editStudent) openStudent(target.dataset.editStudent);
    if (target.dataset.deleteStudent) deleteStudent(target.dataset.deleteStudent).catch((err) => toast(err.message));
    if (target.dataset.editClass) openClass(target.dataset.editClass);
    if (target.dataset.deleteClass) deleteClass(target.dataset.deleteClass).catch((err) => toast(err.message));
    if (target.dataset.duplicateClass) duplicateClass(target.dataset.duplicateClass).catch((err) => toast(err.message));
    if (target.dataset.editPlan) openPlan(target.dataset.editPlan);
    if (target.dataset.deletePlan) deletePlan(target.dataset.deletePlan).catch((err) => toast(err.message));
    if (target.dataset.attendance) openAttendance(target.dataset.attendance);
    if (target.dataset.toggleAttendance) {
      const [classId, studentId] = target.dataset.toggleAttendance.split(':');
      toggleAttendance(classId, studentId).catch((err) => toast(err.message));
    }
    if (target.dataset.removeExtra) {
      const [classId, index] = target.dataset.removeExtra.split(':');
      removeExtraAttendance(classId, index).catch((err) => toast(err.message));
    }
    if (target.dataset.classDay) {
      document.getElementById('classDateFilter').value = target.dataset.classDay;
      renderClasses();
    }
    if (target.dataset.pay) markPaid(target.dataset.pay).catch((err) => toast(err.message));
    if (target.dataset.copyCharge) copyStudentCharge(target.dataset.copyCharge).catch((err) => toast(err.message));
    if (target.dataset.editWait) openWaitItem(target.dataset.editWait);
    if (target.dataset.deleteWait) deleteWait(target.dataset.deleteWait).catch((err) => toast(err.message));
    if (target.dataset.waitStatus) {
      const [id, status] = target.dataset.waitStatus.split(':');
      updateWaitStatus(id, status).catch((err) => toast(err.message));
    }
    if (target.dataset.convertWait) convertWait(target.dataset.convertWait);
  });
}

document.documentElement.dataset.theme = localStorage.getItem('fv_theme') || 'dark';
bindEvents();
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./service-worker.js?v=20260601-limpeza', { scope: './' }).catch(() => {});
}
if (localStorage.getItem(PIN_KEY)) {
  loadData().catch((err) => {
    if (/PIN|401/.test(err.message)) {
      localStorage.removeItem(PIN_KEY);
      showLogin(true);
      return;
    }
    document.getElementById('modeStatus').textContent = 'Local no navegador';
    toast(err.message);
    render();
  });
} else {
  showLogin(true);
}
