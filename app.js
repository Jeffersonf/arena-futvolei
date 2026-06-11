'use strict';

const STORE_KEY = 'fv_school_state_v2';
const PIN_KEY = 'tlf_admin_pin';
const PAGE_KEY = 'tlf_last_page';
const VISUAL_THEME_VERSION = 'ios-light-20260603';
const ACTION_REFRESH_MS = 15000;
const MOBILE_MORE_PAGES = ['actions', 'waitlist', 'plans', 'reports'];
const PAGE_TITLES = {
  dashboard: ['operacao de hoje', 'Painel do dia'],
  actions: ['historico', 'Central de acoes'],
  bookings: ['alunos', 'Pedidos de aula'],
  students: ['cadastro', 'Alunos'],
  classes: ['agenda', 'Aulas'],
  payments: ['financeiro', 'Mensalidades'],
  waitlist: ['demanda', 'Lista de espera'],
  plans: ['oferta', 'Planos'],
  reports: ['gestao', 'Relatorios'],
  more: ['atalhos', 'Mais']
};
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const todayISO = () => new Date().toISOString().slice(0, 10);
const currentMonth = () => todayISO().slice(0, 7);
const selectedPaymentMonth = () => document.getElementById('paymentMonth')?.value || currentMonth();
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

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
      tipo: index % 8 === 5 ? 'Experimental' : index % 8 === 4 ? 'Avulso' : 'Regular',
      capacidade: template[2],
      status: dayOffset === 0 ? 'Confirmada' : 'Marcada',
      aluno_ids: alunoIds,
      presencas,
      extra_presentes: dayOffset === 0 && index % 6 === 0 ? [{ id: `e${index}`, nome: ['Visitante Rafael', 'Reposicao da Laura', 'Aula teste Felipe'][index % 3], tipo: ['Visitante', 'Reposicao', 'Experimental'][index % 3], criado_em: today }] : []
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
  const bookings = [
    { id: 'ag1', nome: 'Rafael Brito', telefone: '(15) 99222-0001', aula_id: classes[1]?.id, status: 'Pendente', observacao: 'Quer fazer experimental', criado_em: today, respondido_em: '' },
    { id: 'ag2', nome: 'Marina Lins', telefone: '(15) 99222-0002', aula_id: classes[4]?.id, status: 'Pendente', observacao: 'Reposicao de sabado', criado_em: today, respondido_em: '' },
    { id: 'ag3', nome: 'Julia Moraes', telefone: '(15) 99222-0003', aula_id: classes[2]?.id, status: 'Aprovado', observacao: 'Confirmada pelo professor', criado_em: addDaysIso(today, -1), respondido_em: today }
  ].filter((item) => item.aula_id);
  const logs = [
    { id: 'l1', data_hora: `${today}T12:01:00`, ator: 'Aluno', acao: 'Confirmacao aluno', detalhe: 'Marina Lopes confirmou presenca na aula Kids das 18:00.' },
    { id: 'l2', data_hora: `${today}T12:05:00`, ator: 'Professor', acao: 'Pagamento', detalhe: 'Ana Souza teve mensalidade marcada como paga.' },
    { id: 'l3', data_hora: `${today}T12:10:00`, ator: 'Aluno', acao: 'Pedido de aula', detalhe: 'Rafael Brito solicitou aula experimental.' },
    { id: 'l4', data_hora: `${today}T12:16:00`, ator: 'Professor', acao: 'Presenca', detalhe: 'Presencas atualizadas na turma Kids.' }
  ];
  return {
    students,
    plans,
    classes,
    payments,
    bookings,
    waitlist,
    logs
  };
}

let apiMode = false;
let state = loadLocalState();
let activeAttendanceClassId = '';
let publicStudentLookup = { telefone: '', student: null, items: [] };
let actionRefreshTimer = null;
let renderFrame = 0;
let stateVersion = 0;
let indexVersion = -1;
let stateIndex = null;
const scheduledUiWork = new Map();

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

function touchState() {
  stateVersion += 1;
  stateIndex = null;
}

function buildStateIndex() {
  const students = state.students || [];
  const classes = state.classes || [];
  const payments = state.payments || [];
  const today = todayISO();
  const studentsById = new Map(students.map((student) => [String(student.id), student]));
  const plansById = new Map((state.plans || []).map((plan) => [String(plan.id), plan]));
  const classesById = new Map(classes.map((item) => [String(item.id), item]));
  const classesByDay = new Map();
  const paymentsByMonth = new Map();
  const attendanceByStudent = new Map();

  classes.forEach((item) => {
    if (item.status !== 'Cancelada') {
      const list = classesByDay.get(item.data) || [];
      list.push(item);
      classesByDay.set(item.data, list);
    }
    classStudentIds(item).forEach((id) => {
      const key = String(id);
      const summary = attendanceByStudent.get(key) || { enrolled: 0, present: 0 };
      summary.enrolled += 1;
      if (item.presencas?.[id] || item.presencas?.[key]) summary.present += 1;
      attendanceByStudent.set(key, summary);
    });
  });
  classesByDay.forEach((items) => items.sort(sortClass));
  payments.forEach((item) => {
    const month = paymentMonth(item);
    if (!month) return;
    const list = paymentsByMonth.get(month) || [];
    list.push(item);
    paymentsByMonth.set(month, list);
  });

  const activeStudents = students.filter((student) => student.status !== 'Pausado');
  const pendingStudents = activeStudents.filter((student) => !isPaid(student));
  return {
    studentsById,
    plansById,
    classesById,
    activeStudents,
    pendingStudents,
    todayClasses: classesByDay.get(today) || [],
    pendingBookings: (state.bookings || []).filter((item) => (item.status || 'Pendente') === 'Pendente'),
    approvedBookings: (state.bookings || []).filter((item) => (item.status || '') === 'Aprovado'),
    classesByDay,
    paymentsByMonth,
    attendanceByStudent
  };
}

function getStateIndex() {
  if (!stateIndex || indexVersion !== stateVersion) {
    stateIndex = buildStateIndex();
    indexVersion = stateVersion;
  }
  return stateIndex;
}

function scheduleRender() {
  if (renderFrame) return;
  renderFrame = requestAnimationFrame(() => {
    renderFrame = 0;
    render();
  });
}

function saveAndRender() {
  touchState();
  saveLocalState();
  scheduleRender();
}

function scheduleUiWork(key, fn) {
  if (scheduledUiWork.has(key)) return;
  const frame = requestAnimationFrame(() => {
    scheduledUiWork.delete(key);
    fn();
  });
  scheduledUiWork.set(key, frame);
}

function syncLocalStateFromStorage() {
  if (apiMode) return;
  state = loadLocalState();
  touchState();
  renderPlanOptions();
  renderPage();
  renderGlobalResults();
  if (document.getElementById('attendanceModal')?.classList.contains('open') && activeAttendanceClassId) {
    openAttendance(activeAttendanceClassId);
  }
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

function showBooking(show = true) {
  const wall = document.getElementById('bookingWall');
  if (!wall) return;
  wall.classList.toggle('open', show);
  wall.setAttribute('aria-hidden', show ? 'false' : 'true');
  if (show) renderPublicBooking();
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
  showBooking(false);
  await loadData();
}

async function detectServer() {
  if (location.protocol === 'file:') return false;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 900);
    const res = await fetch('/health', { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return false;
    const data = await res.json().catch(() => null);
    return Boolean(data && data.ok === true && data.mode === 'server');
  } catch {
    return false;
  }
}

function updateSystemNotice() {
  const notice = document.getElementById('systemNotice');
  if (!notice) return;
  if (apiMode) {
    notice.className = 'system-notice online';
    notice.innerHTML = '<strong>Operacao real</strong><span>Servidor ativo, dados compartilhados e backups disponiveis.</span>';
    return;
  }
  notice.className = 'system-notice demo';
  notice.innerHTML = '<strong>Demo local</strong><span>Dados neste navegador. Para uso diario no iPhone, publique o servidor.</span>';
}

async function loadData() {
  apiMode = await detectServer();
  if (!apiMode) {
    const modeStatus = document.getElementById('modeStatus');
    if (modeStatus) modeStatus.textContent = 'Local no navegador';
    updateSystemNotice();
    restorePage();
    return;
  }
  const modeStatus = document.getElementById('modeStatus');
  if (modeStatus) modeStatus.textContent = 'Servidor Node + SQLite';
  updateSystemNotice();
  const [students, classes, plans, waitlist, payments, bookings, logs] = await Promise.all([
    api('/api/students'),
    api('/api/classes'),
    api('/api/plans'),
    api('/api/waitlist'),
    api('/api/payments'),
    api('/api/bookings'),
    api('/api/tables/logs?limit=80')
  ]);
  state = {
    students: students.items || [],
    classes: classes.items || [],
    plans: plans.items || [],
    waitlist: waitlist.items || [],
    payments: payments.items || [],
    bookings: bookings.items || [],
    logs: logs.rows || []
  };
  touchState();
  restorePage();
}

function studentById(id) {
  return getStateIndex().studentsById.get(String(id));
}

function planById(id) {
  return getStateIndex().plansById.get(String(id));
}

function classById(id) {
  return getStateIndex().classesById.get(String(id));
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

function paymentUrgency(student = {}, month = currentMonth()) {
  if (isPaidForMonth(student, month)) return { label: 'em dia', className: 'ok', days: 0 };
  const due = dueDateForMonth(student, month);
  const days = daysBetween(due, todayISO());
  if (days > 0) return { label: `${days} dia(s) atrasado`, className: 'bad', days };
  if (days === 0) return { label: 'vence hoje', className: 'warn', days };
  if (days >= -3) return { label: `vence em ${Math.abs(days)} dia(s)`, className: 'warn', days };
  return { label: `vence ${formatDate(due)}`, className: '', days };
}

function paymentPriority(student = {}, month = currentMonth()) {
  if (isPaidForMonth(student, month)) return { label: 'Em dia', className: 'ok', rank: 4 };
  const urgency = paymentUrgency(student, month);
  if (urgency.days > 0) return { label: 'Atrasada', className: 'bad', rank: 0 };
  if (urgency.days >= -3) return { label: 'Cobrar agora', className: 'warn', rank: 1 };
  return { label: 'Programada', className: '', rank: 2 };
}

function studentNextAction(student = {}, weekly = 0, target = 0, nextClasses = []) {
  const payment = paymentPriority(student);
  if (payment.rank <= 1) return { label: payment.label, detail: 'Prioridade financeira', className: payment.className };
  const hasFixedSchedule = student.dia_fixo !== '' && student.dia_fixo !== null && student.dia_fixo !== undefined && student.horario_fixo;
  if (!hasFixedSchedule) return { label: 'Definir agenda', detail: 'Aluno sem dia e horario fixo', className: 'warn' };
  if (!nextClasses.length) return { label: 'Criar proximas aulas', detail: 'Agenda fixa sem aulas futuras', className: 'warn' };
  if (target && weekly < target) return { label: 'Acompanhar frequencia', detail: `${weekly}/${target} aulas na semana`, className: 'warn' };
  return { label: 'Tudo ok', detail: 'Aluno sem pendencia operacional', className: 'ok' };
}

function classStudentIds(item = {}) {
  return item.aluno_ids || (item.alunos || []).map((entry) => entry.aluno_id || entry.id);
}

function classStudents(item = {}) {
  if (item.alunos) return item.alunos;
  return classStudentIds(item).map((id) => {
    const student = studentById(id);
    if (!student) return null;
    return { ...student, confirmado: item.confirmacoes?.[id] || '' };
  }).filter(Boolean);
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

function classType(item = {}) {
  return item.tipo || item.tipo_aula || item.type || 'Regular';
}

function phoneDigits(value = '') {
  return String(value || '').replace(/\D/g, '');
}

function extraType(extra = {}) {
  return extra.tipo || extra.tipo_presenca || extra.type || 'Avulso';
}

function cssToken(value = '') {
  return String(value || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item';
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

function classConfirmationStats(item = {}) {
  const students = classStudents(item);
  const yes = students.filter((student) => student.confirmado === 'sim' || student.confirmacao === 'sim').length;
  const no = students.filter((student) => student.confirmado === 'nao' || student.confirmacao === 'nao').length;
  return { yes, no, open: Math.max(0, students.length - yes - no) };
}

function classOperationStatus(item = {}) {
  const enrolled = classStudents(item);
  const capacity = Number(item.capacidade || 8);
  const present = enrolled.filter((student) => item.presencas?.[student.aluno_id || student.id] || student.presente).length;
  const confirmation = classConfirmationStats(item);
  if ((item.status || '') === 'Finalizada') return ['ok', 'Finalizada'];
  if (present && present < enrolled.length) return ['warn', 'Finalizar presenca'];
  if (enrolled.length >= capacity) return ['bad', 'Lotada'];
  if (confirmation.open) return ['warn', `${confirmation.open} sem resposta`];
  if (confirmation.no) return ['bad', `${confirmation.no} nao vai`];
  return ['ok', 'Pronta'];
}

function studentClassEntry(item = {}, studentId = '') {
  return classStudents(item).find((student) => String(student.aluno_id || student.id) === String(studentId)) || {};
}

function confirmationLabel(value = '') {
  if (value === 'sim') return ['ok', 'vai'];
  if (value === 'nao') return ['bad', 'nao vai'];
  return ['warn', 'sem resposta'];
}

function formatDate(value) {
  if (!value) return '-';
  const [year, month, day] = String(value).slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

function formatActionTime(value) {
  if (!value) return '--:--';
  const text = String(value);
  const iso = text.match(/T(\d{2}):(\d{2})/);
  if (iso) return `${iso[1]}:${iso[2]}`;
  const br = text.match(/(\d{1,2}):(\d{2})/);
  if (br) return `${br[1].padStart(2, '0')}:${br[2]}`;
  return text.slice(0, 5);
}

function actionDateKey(value) {
  const text = String(value || '');
  const isoDate = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoDate) return isoDate[1];
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return '';
}

function formatActionDate(value) {
  const key = actionDateKey(value);
  if (!key) return 'Sem data';
  if (key === todayISO()) return 'Hoje';
  if (key === addDaysIso(todayISO(), -1)) return 'Ontem';
  return formatDate(key);
}

function actionActor(item = {}) {
  if (item.ator) return item.ator;
  const text = `${item.acao || ''} ${item.detalhe || ''}`.toLowerCase();
  if (text.includes('confirmacao aluno') || text.includes('solicitou aula')) return 'Aluno';
  if (text.includes('backup') || text.includes('importacao') || text.includes('sistema')) return 'Sistema';
  return 'Professor';
}

function actionTone(actor = '') {
  if (actor === 'Aluno') return 'student';
  if (actor === 'Sistema') return 'system';
  return 'teacher';
}

function actionIcon(actor = '') {
  if (actor === 'Aluno') return 'Aluno';
  if (actor === 'Sistema') return 'Sistema';
  return 'Prof.';
}

function sortedActions(limit = 80) {
  return [...(state.logs || [])]
    .sort((a, b) => {
      const timeA = Date.parse(a.data_hora || '');
      const timeB = Date.parse(b.data_hora || '');
      if (Number.isFinite(timeA) && Number.isFinite(timeB)) return timeB - timeA;
      const idA = Number(a.id || 0);
      const idB = Number(b.id || 0);
      if (Number.isFinite(idA) && Number.isFinite(idB)) return idB - idA;
      return String(b.data_hora || b.id || '').localeCompare(String(a.data_hora || a.id || ''));
    })
    .slice(0, limit);
}

function recordAction(actor, action, detail) {
  state.logs = state.logs || [];
  state.logs.unshift({
    id: uid(),
    data_hora: new Date().toISOString(),
    ator: actor,
    acao: action,
    detalhe: detail
  });
  state.logs = state.logs.slice(0, 120);
}

function weekdayName(value) {
  const names = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'];
  return names[Number(value)] || '';
}

function nextDateForWeekday(weekday, fromIso = todayISO()) {
  const target = Number(weekday);
  if (!Number.isInteger(target) || target < 0 || target > 6) return '';
  const date = new Date(`${fromIso}T12:00:00`);
  const diff = (target - date.getDay() + 7) % 7;
  date.setDate(date.getDate() + diff);
  return date.toISOString().slice(0, 10);
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

function daysBetween(dateIso, endIso = todayISO()) {
  if (!dateIso) return 0;
  const start = new Date(`${dateIso}T12:00:00`);
  const end = new Date(`${endIso}T12:00:00`);
  return Math.max(0, Math.floor((end - start) / 86400000));
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

function updateTopbar(page) {
  const [eyebrow, title] = PAGE_TITLES[page] || PAGE_TITLES.dashboard;
  const eyebrowEl = document.getElementById('topbarEyebrow');
  const titleEl = document.getElementById('topbarTitle');
  if (eyebrowEl) eyebrowEl.textContent = eyebrow;
  if (titleEl) titleEl.textContent = title;
}

function currentPage() {
  return document.documentElement.dataset.page
    || document.querySelector('.page.active')?.id?.replace('page-', '')
    || localStorage.getItem(PAGE_KEY)
    || 'dashboard';
}

async function refreshActions({ force = false } = {}) {
  if (!apiMode || !localStorage.getItem(PIN_KEY)) return;
  if (!force && document.hidden) return;
  const res = await api('/api/tables/logs?limit=80');
  const nextLogs = res.rows || [];
  const currentKey = (state.logs || []).map((item) => `${item.id}:${item.ator || ''}`).join('|');
  const nextKey = nextLogs.map((item) => `${item.id}:${item.ator || ''}`).join('|');
  if (currentKey === nextKey) return;
  state.logs = nextLogs;
  touchState();
  const page = currentPage();
  if (page === 'dashboard' || page === 'actions') renderPage(page);
}

function startActionRefresh() {
  clearInterval(actionRefreshTimer);
  actionRefreshTimer = setInterval(() => {
    refreshActions().catch(() => {});
  }, ACTION_REFRESH_MS);
}

function setPage(page) {
  const isMobile = window.matchMedia('(max-width: 620px)').matches;
  if (page === 'more' && !isMobile) page = 'dashboard';
  if (!document.getElementById(`page-${page}`)) page = 'dashboard';
  const moreActive = isMobile && MOBILE_MORE_PAGES.includes(page);
  document.querySelectorAll('.page').forEach((el) => el.classList.toggle('active', el.id === `page-${page}`));
  document.querySelectorAll('.nav-item').forEach((el) => {
    const active = el.dataset.page === page || (moreActive && el.dataset.page === 'more');
    el.classList.toggle('active', active);
    if (active) el.scrollIntoView({ block: 'nearest', inline: 'center' });
  });
  document.documentElement.dataset.page = page;
  updateTopbar(page);
  localStorage.setItem(PAGE_KEY, page);
  document.getElementById('globalResults').classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  renderPage(page);
}

function restorePage() {
  const saved = localStorage.getItem(PAGE_KEY) || 'dashboard';
  setPage(saved === 'more' && !window.matchMedia('(max-width: 620px)').matches ? 'dashboard' : saved);
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('fv_theme', next);
  updateThemeButton();
}

function updateThemeButton() {
  const button = document.getElementById('themeBtn');
  if (button) button.textContent = document.documentElement.dataset.theme === 'dark' ? '🌙' : '☀️';
}

function logout() {
  localStorage.removeItem(PIN_KEY);
  showLogin(true);
}

function updatePerformanceMode() {
  const mobile = window.matchMedia('(max-width: 620px)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.dataset.perf = mobile || reducedMotion ? 'lite' : 'full';
}

function renderDashboard() {
  renderFocusStrip();
  renderKpis();
  renderQuickActions();
  renderTodayClasses();
  renderPending();
  renderDashboardActions();
}

function renderPage(page = currentPage()) {
  const renderers = {
    dashboard: renderDashboard,
    actions: renderActions,
    students: renderStudents,
    classes: renderClasses,
    bookings: renderBookings,
    payments: renderPayments,
    plans: renderPlans,
    waitlist: renderWaitlist,
    reports: renderReports,
    more: () => {}
  };
  (renderers[page] || renderDashboard)();
}

function render() {
  renderPlanOptions();
  renderPage();
  renderGlobalResults();
}

function renderKpis() {
  const index = getStateIndex();
  const active = state.students.filter((s) => s.status === 'Ativo').length;
  const todayClasses = index.todayClasses;
  const expectedToday = todayClasses.reduce((sum, item) => sum + classStudents(item).length, 0);
  const presentToday = todayClasses.reduce((sum, item) => (
    sum + classStudents(item).filter((student) => item.presencas?.[student.aluno_id || student.id] || student.presente).length
  ), 0);
  const pendingStudents = index.pendingStudents;
  const pendingBookings = index.pendingBookings.length;
  const pendingValue = pendingStudents.reduce((sum, student) => sum + Number(student.mensalidade || 0), 0);
  const items = [
    ['Aulas hoje', todayClasses.length, `${expectedToday} previstos`, todayClasses.length ? '' : 'ok'],
    ['Presencas', `${presentToday}/${expectedToday || 0}`, expectedToday ? 'marcadas hoje' : 'sem lista hoje', expectedToday && presentToday < expectedToday ? 'warn' : 'ok'],
    ['Pedidos', pendingBookings, pendingBookings ? 'aprovar agora' : 'sem pedido aberto', pendingBookings ? 'warn' : 'ok'],
    ['A receber', pendingStudents.length, pendingStudents.length ? money.format(pendingValue) : `${active} alunos ativos`, pendingStudents.length ? 'bad' : 'ok']
  ];
  document.getElementById('kpiGrid').innerHTML = items.map(([label, value, detail, tone]) => `
    <article class="kpi ${tone ? `kpi-${tone}` : ''}">
      <span>${label}</span>
      <strong>${value}</strong>
      <small>${escapeHTML(detail)}</small>
    </article>
  `).join('');
}

function nextClass() {
  const nowKey = new Date().toISOString().slice(0, 16);
  return [...state.classes]
    .filter((item) => item.status !== 'Cancelada')
    .sort(sortClass)
    .find((item) => `${item.data}T${item.horario}` >= nowKey) || [...state.classes].sort(sortClass)[0];
}

function renderQuickActions() {
  document.getElementById('quickActions').innerHTML = '';
}

function renderTodayClasses() {
  const classes = getStateIndex().todayClasses;
  document.getElementById('todayClasses').innerHTML = classes.length ? classes.map(classRow).join('') : empty('Nenhuma aula marcada para hoje.');
}

function renderPending() {
  const students = getStateIndex().pendingStudents;
  const visible = students.slice(0, 5);
  document.getElementById('pendingList').innerHTML = students.length ? `
    ${visible.map((student) => `
      <article class="row-card">
        <div>
          <button class="link-title compact-title" type="button" data-report-student="${student.id}">${escapeHTML(student.nome)}</button>
          <p class="meta">${escapeHTML(student.plano_nome || 'sem plano')} - ${money.format(Number(student.mensalidade || 0))}</p>
          <div class="pill-row"><span class="pill bad">pagamento pendente</span></div>
        </div>
        <div class="actions"><button class="mini-btn" data-pay="${student.id}">Marcar pago</button></div>
      </article>
    `).join('')}
    ${students.length > visible.length ? `<button class="soft-btn dashboard-more-btn" type="button" data-action="quick-pending">Ver ${students.length - visible.length} restante(s)</button>` : ''}
  ` : empty('Sem pendencias por enquanto.');
}

function actionRow(item) {
  const actor = actionActor(item);
  return `
    <article class="action-item action-${actionTone(actor)}">
      <time><span>${escapeHTML(formatActionTime(item.data_hora))}</span><small>${escapeHTML(actionIcon(actor))}</small></time>
      <div>
        <div class="action-line">
          <strong>${escapeHTML(actor)}</strong>
          <span>${escapeHTML(item.acao || 'Acao')}</span>
        </div>
        <p>${escapeHTML(item.detalhe || 'Movimento registrado no sistema.')}</p>
      </div>
    </article>
  `;
}

function groupedActionRows(items) {
  let current = '';
  return items.map((item) => {
    const key = actionDateKey(item.data_hora) || 'sem-data';
    const header = key !== current ? `<div class="action-day"><span>${escapeHTML(formatActionDate(item.data_hora))}</span></div>` : '';
    current = key;
    return `${header}${actionRow(item)}`;
  }).join('');
}

function renderDashboardActions() {
  const target = document.getElementById('dashboardActions');
  if (!target) return;
  const items = sortedActions(6);
  target.innerHTML = items.length ? items.map(actionRow).join('') : empty('Nenhuma acao registrada ainda.');
}

function renderActions() {
  const filter = document.getElementById('actionActorFilter')?.value || '';
  const query = document.getElementById('actionSearch')?.value.trim().toLowerCase() || '';
  const all = sortedActions(80);
  const items = all.filter((item) => {
    const actor = actionActor(item);
    const haystack = `${actor} ${item.acao || ''} ${item.detalhe || ''}`.toLowerCase();
    return (!filter || actor === filter) && (!query || haystack.includes(query));
  });
  const professor = all.filter((item) => actionActor(item) === 'Professor').length;
  const aluno = all.filter((item) => actionActor(item) === 'Aluno').length;
  const system = all.filter((item) => actionActor(item) === 'Sistema').length;
  const latest = items[0] || all[0];
  const summary = document.getElementById('actionSummary');
  if (summary) {
    summary.innerHTML = `
      <article class="mini-stat action-latest"><span>Ultimo movimento</span><strong>${latest ? escapeHTML(formatActionTime(latest.data_hora)) : '--:--'}</strong><small>${latest ? escapeHTML(`${actionActor(latest)} - ${latest.acao || 'Acao'}`) : 'Sem registro'}</small></article>
      <article class="mini-stat action-mini-teacher"><span>Professor</span><strong>${professor}</strong></article>
      <article class="mini-stat action-mini-student"><span>Aluno</span><strong>${aluno}</strong></article>
      <article class="mini-stat action-mini-system"><span>Sistema</span><strong>${system}</strong></article>
    `;
  }
  document.getElementById('actionList').innerHTML = items.length ? groupedActionRows(items) : empty('Nenhuma acao nesse filtro.');
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
  document.getElementById('studentGrid').innerHTML = students.length ? `
    <div class="student-list-head" aria-hidden="true">
      <span>Aluno</span>
      <span>Plano</span>
      <span>Agenda</span>
      <span>Pagamento</span>
      <span>Acoes</span>
    </div>
    ${students.map(studentCard).join('')}
  ` : empty('Nenhum aluno encontrado.');
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
  const type = document.getElementById('classTypeFilter')?.value || '';
  const status = document.getElementById('classStatusFilter')?.value || '';
  const classes = [...state.classes].filter((item) => (
    (!date || item.data === date)
    && (!type || classType(item) === type)
    && (!status || (item.status || 'Marcada') === status)
  )).sort(sortClass);
  renderClassesTodayPlanner();
  renderClassCalendar();
  renderClassSummary(classes);
  document.getElementById('classList').innerHTML = classes.length ? classes.map(classRow).join('') : empty('Crie a primeira aula da agenda.');
}

function bookingClass(booking) {
  return getStateIndex().classesById.get(String(booking.aula_id));
}

function bookingStatusTone(status = 'Pendente') {
  if (status === 'Aprovado') return 'ok';
  if (status === 'Recusado') return 'bad';
  return 'warn';
}

function renderBookings() {
  const target = document.getElementById('bookingList');
  if (!target) return;
  const bookings = [...(state.bookings || [])].sort((a, b) => (
    Number((b.status || 'Pendente') === 'Pendente') - Number((a.status || 'Pendente') === 'Pendente')
    || String(b.id).localeCompare(String(a.id))
  ));
  const pending = bookings.filter((item) => (item.status || 'Pendente') === 'Pendente');
  const approved = bookings.filter((item) => item.status === 'Aprovado');
  const rejected = bookings.filter((item) => item.status === 'Recusado');
  const summary = document.getElementById('bookingSummary');
  if (summary) {
    summary.innerHTML = `
      <article class="mini-stat ${pending.length ? 'kpi-warn' : 'kpi-ok'}"><span>Aguardando</span><strong>${pending.length}</strong></article>
      <article class="mini-stat kpi-ok"><span>Aprovados</span><strong>${approved.length}</strong></article>
      <article class="mini-stat"><span>Recusados</span><strong>${rejected.length}</strong></article>
      <article class="mini-stat"><span>Total</span><strong>${bookings.length}</strong></article>
    `;
  }
  target.innerHTML = bookings.length ? bookings.map((booking) => {
    const item = bookingClass(booking);
    const status = booking.status || 'Pendente';
    const full = item ? classStudentIds(item).length >= Number(item.capacidade || 8) : false;
    return `
      <article class="row-card booking-request booking-${cssToken(status)}">
        <div class="booking-main">
          <div class="booking-titleline">
            <h3>${escapeHTML(booking.nome)}</h3>
            <span class="pill ${bookingStatusTone(status)}">${escapeHTML(status)}</span>
          </div>
          <p class="meta">${escapeHTML(booking.telefone || 'sem WhatsApp')}</p>
          <p class="booking-class-meta">${item ? `${formatDate(item.data)} as ${item.horario} - ${escapeHTML(item.turma || 'Turma')}` : 'aula removida'}</p>
          <div class="pill-row">
            ${item ? `<span class="pill ${full ? 'bad' : 'ok'}">${classStudentIds(item).length}/${item.capacidade || 8} vagas</span>` : ''}
            ${booking.criado_em ? `<span class="pill">${formatDate(booking.criado_em)}</span>` : ''}
          </div>
          ${booking.observacao ? `<p class="meta">${escapeHTML(booking.observacao)}</p>` : ''}
        </div>
        <div class="actions">
          ${booking.telefone ? `<a class="mini-btn" href="${whatsappUrl(booking.telefone, bookingReplyText(booking, item))}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
          ${status === 'Pendente' ? `<button class="mini-btn" data-booking-action="${booking.id}:approve">Aprovar</button><button class="mini-btn danger-mini" data-booking-action="${booking.id}:reject">Recusar</button>` : ''}
        </div>
      </article>
    `;
  }).join('') : empty('Nenhum pedido de aula ainda.');
}

function nextWaitLead() {
  return [...state.waitlist]
    .filter((item) => !['Convertido', 'Perdido'].includes(item.status || 'Novo'))
    .sort((a, b) => daysBetween(b.data_cadastro || todayISO()) - daysBetween(a.data_cadastro || todayISO()))[0];
}

function waitPriority(item = {}) {
  const status = item.status || 'Novo';
  const age = daysBetween(item.data_cadastro || todayISO());
  if (status === 'Convertido') return { label: 'Convertido', className: 'ok', rank: 4, age };
  if (status === 'Perdido') return { label: 'Perdido', className: 'bad', rank: 5, age };
  if (status === 'Novo' && age >= 2) return { label: 'Responder hoje', className: 'bad', rank: 0, age };
  if (status === 'Novo') return { label: 'Novo lead', className: 'warn', rank: 1, age };
  if (status === 'Contatado') return { label: 'Marcar experimental', className: 'warn', rank: 2, age };
  if (status === 'Experimental marcado') return { label: 'Converter aluno', className: 'warn', rank: 3, age };
  return { label: status, className: '', rank: 3, age };
}

function renderFocusStrip() {
  const target = document.getElementById('focusStrip');
  if (!target) return;
  const index = getStateIndex();
  const next = nextClass();
  const todayClasses = index.todayClasses;
  const pending = index.activeStudents.filter((student) => !isPaidForMonth(student, currentMonth()));
  const pendingValue = pending.reduce((sum, student) => sum + Number(student.mensalidade || 0), 0);
  const lead = nextWaitLead();
  const pendingBookings = index.pendingBookings;
  const nextStudents = next ? classStudents(next) : [];
  const nextPresent = next ? nextStudents.filter((student) => next.presencas?.[student.aluno_id || student.id] || student.presente).length : 0;
  const briefTitle = next ? `${next.horario} - ${next.turma || 'Turma'}` : 'Sem aula marcada';
  const briefText = next ? `${formatDate(next.data)} - ${nextStudents.length}/${next.capacidade || 8} previstos - ${nextPresent}/${nextStudents.length || 0} presentes` : 'Crie a primeira aula do dia para iniciar a operacao.';
  target.innerHTML = `
    <section class="day-command focus-${next ? 'live' : 'ok'}">
      <div class="day-command-main">
        <span class="eyebrow">agora</span>
        <h2>${escapeHTML(briefTitle)}</h2>
        <p>${escapeHTML(briefText)}</p>
        <div class="pill-row">
          <span class="pill">${todayClasses.length} aula(s) hoje</span>
          <span class="pill ${pendingBookings.length ? 'warn' : 'ok'}">${pendingBookings.length} pedido(s)</span>
          <span class="pill ${pending.length ? 'bad' : 'ok'}">${pending.length ? money.format(pendingValue) : 'financeiro em dia'}</span>
        </div>
      </div>
      <div class="day-command-actions">
        <button class="primary-btn" type="button" data-focus-action="next-class">${next ? 'Abrir presenca' : 'Criar aula'}</button>
        <button class="soft-btn" type="button" data-focus-action="bookings">Pedidos</button>
        <button class="soft-btn" type="button" data-focus-action="${lead ? `wait:${lead.id}` : 'waitlist'}">Espera</button>
      </div>
    </section>
  `;
}

function renderClassSummary(classes) {
  const target = document.getElementById('classSummary');
  if (!target) return;
  const future = classes.filter((item) => item.data >= todayISO() && item.status !== 'Cancelada').length;
  const experimental = classes.filter((item) => classType(item) === 'Experimental').length;
  const repos = classes.filter((item) => classType(item) === 'Reposicao').length;
  const avulsos = classes.reduce((sum, item) => sum + classExtras(item).filter((extra) => ['Avulso', 'Reposicao', 'Experimental', 'Visitante'].includes(extraType(extra))).length, 0);
  target.innerHTML = `
    <article class="mini-stat"><span>Filtradas</span><strong>${classes.length}</strong></article>
    <article class="mini-stat"><span>Futuras</span><strong>${future}</strong></article>
    <article class="mini-stat"><span>Experimentais</span><strong>${experimental}</strong></article>
    <article class="mini-stat"><span>Reposicoes</span><strong>${repos}</strong></article>
    <article class="mini-stat"><span>Fora da lista</span><strong>${avulsos}</strong></article>
  `;
}

function renderClassesTodayPlanner() {
  const target = document.getElementById('classesTodayPlanner');
  if (!target) return;
  const classes = getStateIndex().todayClasses;
  const expected = classes.reduce((sum, item) => sum + classStudents(item).length, 0);
  const present = classes.reduce((sum, item) => sum + classStudents(item).filter((student) => item.presencas?.[student.aluno_id || student.id] || student.presente).length, 0);
  const extrasTotal = classes.reduce((sum, item) => sum + classExtras(item).length, 0);
  const confirmedToday = classes.reduce((sum, item) => sum + classConfirmationStats(item).yes, 0);
  const declinedToday = classes.reduce((sum, item) => sum + classConfirmationStats(item).no, 0);
  const attentionTotal = classes.filter((item) => classOperationStatus(item)[0] !== 'ok').length;
  const summary = `
    <article class="today-summary">
      <span>Resumo de hoje</span>
      <strong>${classes.length} aula(s)</strong>
      <small>${expected} previstos - ${confirmedToday} confirmados - ${declinedToday} nao vao - ${present} presentes - ${extrasTotal} fora da lista - ${attentionTotal} atencao</small>
    </article>
  `;
  target.innerHTML = classes.length ? `${summary}${classes.map((item) => {
    const enrolled = classStudents(item);
    const extras = classExtras(item);
    const capacity = Number(item.capacidade || 8);
    const presentCount = enrolled.filter((student) => item.presencas?.[student.aluno_id || student.id] || student.presente).length;
    const confirmation = classConfirmationStats(item);
    const [operationTone, operationLabel] = classOperationStatus(item);
    return `
      <article class="today-class class-${cssToken(item.status || 'Marcada')} type-${cssToken(classType(item))}">
        <div class="today-class-head">
          <div class="class-timebox">
            <span>${escapeHTML(item.horario)}</span>
            <small>${escapeHTML(classType(item))}</small>
          </div>
          <div class="class-main">
            <strong>${escapeHTML(item.turma || 'Turma')}</strong>
            <span>${escapeHTML(item.professor || 'Professor nao informado')}</span>
            <div class="pill-row">
              <span class="pill ${operationTone}">${escapeHTML(operationLabel)}</span>
              <span class="pill">${enrolled.length}/${capacity} previstos</span>
              <span class="pill ok">${confirmation.yes} vao</span>
              ${confirmation.no ? `<span class="pill bad">${confirmation.no} nao vao</span>` : ''}
              ${confirmation.open ? `<span class="pill warn">${confirmation.open} sem resposta</span>` : ''}
              <span class="pill ${presentCount >= enrolled.length && enrolled.length ? 'ok' : 'warn'}">${presentCount}/${enrolled.length} presentes</span>
              ${extras.length ? `<span class="pill warn">${extras.length} fora da lista</span>` : ''}
              <span class="pill">${escapeHTML(item.status || 'Marcada')}</span>
            </div>
          </div>
          <div class="actions">
            <a class="mini-btn" href="${whatsappShareUrl(classShareText(item))}" target="_blank" rel="noopener">WhatsApp</a>
            <button class="mini-btn" data-copy-class="${item.id}">Copiar lista</button>
            <button class="mini-btn" data-attendance="${item.id}">Presencas</button>
            ${classStatusActions(item)}
          </div>
        </div>
        <div class="roster-list">
          ${enrolled.map((student) => rosterPerson(student, item.data, Boolean(item.presencas?.[student.aluno_id || student.id] || student.presente))).join('')}
          ${extras.map((extra) => `<span class="roster-person extra"><strong>${escapeHTML(extra.nome || extra)}</strong><small>${escapeHTML(extraType(extra))}</small></span>`).join('')}
        </div>
      </article>
    `;
  }).join('')}` : empty('Nenhuma aula marcada para hoje.');
}

function renderClassCalendar() {
  const target = document.getElementById('classCalendar');
  if (!target) return;
  const index = getStateIndex();
  const days = Array.from({ length: 7 }, (_item, index) => addDaysIso(todayISO(), index));
  target.innerHTML = days.map((day) => {
    const classes = index.classesByDay.get(day) || [];
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
  const index = getStateIndex();
  const monthPayments = index.paymentsByMonth.get(month) || [];
  const paidThisMonth = monthPayments.reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const activeStudents = index.activeStudents;
  const pending = activeStudents.filter((student) => !isPaidForMonth(student, month));
  const overdue = pending.filter((student) => paymentUrgency(student, month).days > 0);
  const dueSoon = pending.filter((student) => {
    const days = paymentUrgency(student, month).days;
    return days <= 0 && days >= -3;
  });
  const expected = activeStudents.reduce((sum, student) => sum + Number(student.mensalidade || 0), 0);
  const receiveRate = expected ? Math.round((paidThisMonth / expected) * 100) : 0;
  const query = document.getElementById('paymentSearch')?.value.trim().toLowerCase() || '';
  const filter = document.getElementById('paymentStatusFilter')?.value || '';
  document.getElementById('financeSummary').innerHTML = `
    <article class="mini-stat kpi-ok payment-secondary"><span>Recebido no mês</span><strong>${money.format(paidThisMonth)}</strong></article>
    <article class="mini-stat payment-secondary"><span>Previsao do mes</span><strong>${money.format(expected)}</strong></article>
    <article class="mini-stat payment-secondary ${receiveRate >= 80 ? 'kpi-ok' : pending.length ? 'kpi-warn' : ''}"><span>Recebimento</span><strong>${receiveRate}%</strong></article>
    <article class="mini-stat ${pending.length ? 'kpi-bad' : 'kpi-ok'}"><span>Pendências</span><strong>${pending.length}</strong></article>
    <article class="mini-stat ${overdue.length ? 'kpi-bad' : 'kpi-ok'}"><span>Atrasadas</span><strong>${overdue.length}</strong></article>
    <article class="mini-stat ${dueSoon.length ? 'kpi-warn' : ''}"><span>Cobrar agora</span><strong>${dueSoon.length}</strong></article>
    <article class="mini-stat ${pending.length ? 'kpi-bad' : 'kpi-ok'}"><span>A receber</span><strong>${money.format(pending.reduce((sum, student) => sum + Number(student.mensalidade || 0), 0))}</strong></article>
  `;
  const visibleStudents = state.students.filter((student) => {
    const haystack = `${student.nome} ${student.telefone} ${student.plano_nome}`.toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    const matchesFilter = !filter || (filter === 'paid' ? isPaidForMonth(student, month) : !isPaidForMonth(student, month));
    return matchesQuery && matchesFilter;
  }).sort((a, b) => {
    const priorityA = paymentPriority(a, month);
    const priorityB = paymentPriority(b, month);
    if (priorityA.rank !== priorityB.rank) return priorityA.rank - priorityB.rank;
    const urgencyA = paymentUrgency(a, month).days;
    const urgencyB = paymentUrgency(b, month).days;
    if (urgencyA !== urgencyB) return urgencyB - urgencyA;
    return a.nome.localeCompare(b.nome);
  });
  const rows = visibleStudents.map((student) => {
    const paid = isPaidForMonth(student, month);
    const urgency = paymentUrgency(student, month);
    const priority = paymentPriority(student, month);
    return `
    <article class="row-card payment-row ${paid ? 'payment-paid' : 'payment-pending'}">
      <div>
        <button class="link-title compact-title" type="button" data-report-student="${student.id}">${escapeHTML(student.nome)}</button>
        <p class="meta">${escapeHTML(student.plano_nome || 'sem plano')} - ${money.format(Number(student.mensalidade || 0))} - pago até ${student.pago_ate ? formatDate(student.pago_ate) : 'sem registro'}</p>
        <div class="pill-row">
          <span class="pill ${priority.className}">${escapeHTML(priority.label)}</span>
          <span class="pill ${paid ? 'ok' : 'bad'}">${paid ? 'em dia' : 'pendente'}</span>
          <span class="pill ${urgency.className}">${escapeHTML(urgency.label)}</span>
          <span class="pill">vence dia ${dueDay(student)}</span>
        </div>
      </div>
      <div class="actions">
        ${student.telefone ? `<a class="mini-btn" href="${whatsappUrl(student.telefone, `Oi ${student.nome}, tudo bem? Passando para lembrar da mensalidade do Team Lucão Futevôlei.`)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
        <button class="mini-btn" data-copy-charge="${student.id}">Copiar cobranca</button>
        <button class="mini-btn" data-pay="${student.id}">${paid ? 'Marcar nao pago' : 'Marcar pago'}</button>
      </div>
    </article>
  `;
  });
  const history = monthPayments.slice(0, 8).map((item) => `
    <article class="row-card compact-row">
      <div>
        <h3>${escapeHTML(item.aluno_nome || 'Pagamento')}</h3>
        <p class="meta">${money.format(Number(item.valor || 0))} - ${formatDate(item.pago_em)} - ${escapeHTML(item.forma_pagamento || 'manual')}${item.observacao ? ` - ${escapeHTML(item.observacao)}` : ''}</p>
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
      </div>
    </article>
  `).join('') : empty('Cadastre planos para organizar aulas e mensalidades.');
}

function renderWaitlist() {
  const status = document.getElementById('waitStatusFilter').value;
  const items = state.waitlist
    .filter((item) => !status || (item.status || 'Novo') === status)
    .sort((a, b) => {
      const priorityA = waitPriority(a);
      const priorityB = waitPriority(b);
      if (priorityA.rank !== priorityB.rank) return priorityA.rank - priorityB.rank;
      if (priorityA.age !== priorityB.age) return priorityB.age - priorityA.age;
      return String(a.nome || '').localeCompare(String(b.nome || ''));
    });
  document.getElementById('waitlistList').innerHTML = items.length ? items.map((item) => {
    const priority = waitPriority(item);
    const age = priority.age;
    const needsReply = priority.rank === 0;
    return `
    <article class="row-card wait-row wait-${cssToken(item.status || 'Novo')} ${needsReply ? 'wait-needs-reply' : ''}">
      <div>
        <h3>${escapeHTML(item.nome)}</h3>
        <p class="meta">${escapeHTML(item.telefone || 'sem telefone')} - ${escapeHTML(item.preferencia || 'sem preferencia')}</p>
        <div class="pill-row">
          <span class="pill ${priority.className}">${escapeHTML(priority.label)}</span>
          <span class="pill ${item.status === 'Convertido' ? 'ok' : item.status === 'Contatado' || item.status === 'Experimental marcado' ? 'warn' : item.status === 'Perdido' ? 'bad' : ''}">${escapeHTML(item.status || 'Novo')}</span>
          ${item.data_cadastro ? `<span class="pill">${formatDate(item.data_cadastro)}</span>` : ''}
          <span class="pill ${needsReply ? 'bad' : age ? 'warn' : ''}">${age || 0} dia(s)</span>
          ${needsReply ? '<span class="pill bad">responder hoje</span>' : ''}
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
      </div>
    </article>
  `;
  }).join('') : empty('Sem interessados em espera.');
}

function renderReports() {
  const month = selectedPaymentMonth();
  const index = getStateIndex();
  const monthPayments = index.paymentsByMonth.get(month) || [];
  const paidThisMonth = monthPayments.reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const activeStudents = index.activeStudents;
  const pending = activeStudents.filter((student) => !isPaidForMonth(student, month));
  const active = state.students.filter((student) => student.status === 'Ativo').length;
  const trial = state.students.filter((student) => student.status === 'Experimental').length;
  const monthClasses = state.classes.filter((item) => String(item.data || '').startsWith(month) && item.status !== 'Cancelada');
  const expectedRevenue = activeStudents.reduce((sum, student) => sum + Number(student.mensalidade || 0), 0);
  const pendingValue = pending.reduce((sum, student) => sum + Number(student.mensalidade || 0), 0);
  const monthExpectedAttendance = monthClasses.reduce((sum, item) => sum + classStudents(item).length, 0);
  const monthPresent = monthClasses.reduce((sum, item) => (
    sum + classStudents(item).filter((student) => item.presencas?.[student.aluno_id || student.id] || student.presente).length
  ), 0);
  const monthExtras = monthClasses.reduce((sum, item) => sum + classExtras(item).length, 0);
  const attendanceRate = monthExpectedAttendance ? Math.round((monthPresent / monthExpectedAttendance) * 100) : 0;
  const pendingBookings = index.pendingBookings.length;
  const approvedBookings = index.approvedBookings.length;
  const waitingOpen = state.waitlist.filter((item) => !['Convertido', 'Perdido'].includes(item.status || 'Novo')).length;
  const totalAttendances = state.classes.reduce((sum, item) => {
    const presencas = item.presencas || {};
    return sum + Object.values(presencas).filter(Boolean).length;
  }, 0);
  const reportItems = [
    ['Alunos ativos', active],
    ['Experimentais', trial],
    ['Pendências', pending.length],
    ['Recebido no mês', money.format(paidThisMonth)],
    ['Presenças marcadas', totalAttendances]
  ];
  document.getElementById('reportGrid').innerHTML = reportItems.map(([label, value]) => `
    <article class="mini-stat"><span>${label}</span><strong>${escapeHTML(value)}</strong></article>
  `).join('');

  document.getElementById('operationReport').innerHTML = `
    <article class="operation-card">
      <div>
        <span class="section-label">Fechamento do mes</span>
        <h3>${escapeHTML(month)}</h3>
        <p class="meta">Resumo pronto para revisar a operacao e copiar para o professor.</p>
      </div>
      <div class="operation-grid">
        <span><strong>${money.format(expectedRevenue)}</strong><small>previsao</small></span>
        <span><strong>${money.format(paidThisMonth)}</strong><small>recebido</small></span>
        <span><strong>${money.format(pendingValue)}</strong><small>a receber</small></span>
        <span><strong>${attendanceRate}%</strong><small>presenca</small></span>
        <span><strong>${monthClasses.length}</strong><small>aulas</small></span>
        <span><strong>${monthExtras}</strong><small>avulsos</small></span>
        <span><strong>${pendingBookings}/${approvedBookings}</strong><small>pedidos</small></span>
        <span><strong>${waitingOpen}</strong><small>em espera</small></span>
      </div>
      <div class="actions">
        <button class="mini-btn" data-copy-report="month">Copiar fechamento</button>
        <button class="mini-btn" data-action="payments">Ver cobrancas</button>
        <button class="mini-btn" data-backup>Backup JSON</button>
        <button class="mini-btn" data-server-backup>Backup servidor</button>
      </div>
    </article>
  `;

  const attendanceRows = state.students.map((student) => {
    const summary = index.attendanceByStudent.get(String(student.id)) || { enrolled: 0, present: 0 };
    const enrolled = summary.enrolled;
    const present = summary.present;
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

function studentCard(student) {
  const message = `Oi ${student.nome}, tudo bem? Aqui e do Team Lucao Futevolei.`;
  const weekly = weeklyAttendanceCount(student.id);
  const target = planWeeklyTarget(student);
  const paid = isPaid(student);
  const schedule = [student.dia_fixo ? weekdayName(student.dia_fixo) : '', student.horario_fixo || '', student.turma_fixa || ''].filter(Boolean).join(' - ') || 'sem horario fixo';
  return `
    <article class="student-row status-${cssToken(student.status || 'Ativo')} payment-${paid ? 'paid' : 'pending'}">
      <div class="student-main">
        <button class="link-title compact-title" type="button" data-report-student="${student.id}">${escapeHTML(student.nome)}</button>
        <p class="meta">${escapeHTML(student.telefone || 'sem telefone')} - vence dia ${dueDay(student)}</p>
      </div>
      <div class="student-plan">
        <strong>${escapeHTML(student.plano_nome || 'Sem plano')}</strong>
        <p class="meta">${money.format(Number(student.mensalidade || 0))}/mes - ${escapeHTML(student.nivel || 'Iniciante')}</p>
        <span class="pill ${student.status === 'Ativo' ? 'ok' : student.status === 'Experimental' ? 'warn' : ''}">${escapeHTML(student.status || 'Ativo')}</span>
      </div>
      <div class="student-frequency">
        <strong>${weekly}/${target || '-'}</strong>
        <p class="meta">${escapeHTML(schedule)}</p>
      </div>
      <div class="student-payment">
        <span class="pill ${paid ? 'ok' : 'bad'}">${paid ? 'em dia' : 'pendente'}</span>
        <p class="meta">${paid ? `pago ate ${formatDate(student.pago_ate)}` : 'sem registro do mes'}</p>
      </div>
      <div class="actions student-actions">
        ${student.telefone ? `<a class="mini-btn" href="${whatsappUrl(student.telefone, message)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
        <button class="mini-btn" data-edit-student="${student.id}">Editar</button>
        <button class="mini-btn" data-pay="${student.id}">${paid ? 'Nao pago' : 'Pago'}</button>
      </div>
    </article>
  `;
}

function classRow(item) {
  const enrolled = classStudents(item);
  const present = enrolled.filter((student) => item.presencas?.[student.aluno_id || student.id] || student.presente).length;
  const extras = classExtras(item);
  const confirmation = classConfirmationStats(item);
  const [operationTone, operationLabel] = classOperationStatus(item);
  return `
    <article class="row-card class-row class-${cssToken(item.status || 'Marcada')} type-${cssToken(classType(item))}">
      <div>
        <h3>${formatDate(item.data)} as ${item.horario} - ${escapeHTML(item.turma || 'Turma')}</h3>
        <p class="meta">${escapeHTML(item.professor || 'Professor nao informado')} - ${enrolled.length}/${item.capacidade || 8} aluno(s) previstos</p>
        <div class="pill-row">
          <span class="pill ${operationTone}">${escapeHTML(operationLabel)}</span>
          <span class="pill">${present}/${enrolled.length} presencas</span>
          <span class="pill ok">${confirmation.yes} vao</span>
          ${confirmation.no ? `<span class="pill bad">${confirmation.no} nao vao</span>` : ''}
          ${confirmation.open ? `<span class="pill warn">${confirmation.open} sem resposta</span>` : ''}
          ${extras.length ? `<span class="pill warn">${extras.length} fora da lista</span>` : ''}
          <span class="pill warn">${escapeHTML(classType(item))}</span>
          <span class="pill">${escapeHTML(item.status || 'Marcada')}</span>
          ${item.data === todayISO() ? '<span class="pill ok">hoje</span>' : ''}
        </div>
        ${enrolled.length || extras.length ? `
          <div class="roster-list class-roster">
            ${enrolled.map((student) => rosterPerson(student, item.data, Boolean(item.presencas?.[student.aluno_id || student.id] || student.presente))).join('')}
            ${extras.map((extra) => `<span class="roster-person extra"><strong>${escapeHTML(extra.nome || extra)}</strong><small>${escapeHTML(extraType(extra))}</small></span>`).join('')}
          </div>
        ` : ''}
      </div>
      <div class="actions">
        <a class="mini-btn" href="${whatsappShareUrl(classShareText(item))}" target="_blank" rel="noopener">WhatsApp</a>
        <button class="mini-btn" data-attendance="${item.id}">Presencas</button>
        ${classStatusActions(item)}
        <button class="mini-btn" data-copy-class="${item.id}">Copiar</button>
        <button class="mini-btn" data-edit-class="${item.id}">Editar</button>
      </div>
    </article>
  `;
}

function classStatusActions(item) {
  const id = escapeHTML(item.id);
  if (item.status === 'Finalizada') {
    return `<button class="mini-btn" data-class-status="${id}:Marcada">Reabrir</button>`;
  }
  if (item.status === 'Cancelada') {
    return `<button class="mini-btn" data-class-status="${id}:Marcada">Reativar</button>`;
  }
  if (item.status === 'Confirmada') return `<button class="mini-btn" data-class-status="${id}:Finalizada">Finalizar</button>`;
  return `<button class="mini-btn" data-class-status="${id}:Confirmada">Confirmar</button>`;
}

function rosterPerson(student, dateIso, present = false) {
  const id = student.aluno_id || student.id;
  const fullStudent = studentById(id) || student;
  const count = weeklyAttendanceCount(id, dateIso);
  const target = planWeeklyTarget(fullStudent);
  const confirmation = student.confirmado || student.confirmacao || '';
  const confirmationText = confirmation === 'sim' ? 'vai' : confirmation === 'nao' ? 'nao vai' : 'sem resposta';
  const confirmationClass = confirmation === 'sim' ? 'confirm-yes' : confirmation === 'nao' ? 'confirm-no' : '';
  return `
    <span class="roster-person ${present ? 'present' : ''} ${confirmationClass}">
      <button type="button" data-report-student="${id}">${escapeHTML(student.nome)}</button>
      <small>${count}/${target || '-'} na semana - ${confirmationText}</small>
    </span>
  `;
}

function empty(text) {
  return `<div class="empty"><span>Sem dados</span><strong>${escapeHTML(text)}</strong></div>`;
}

function sortClass(a, b) {
  return `${a.data}T${a.horario}`.localeCompare(`${b.data}T${b.horario}`);
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}

function openModal(id) {
  document.querySelectorAll('.modal-wrap.open').forEach((modal) => {
    if (modal.id !== id) {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    }
  });
  document.getElementById(id).classList.add('open');
  document.getElementById(id).setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.getElementById(id).setAttribute('aria-hidden', 'true');
  if (!document.querySelector('.modal-wrap.open')) document.body.classList.remove('modal-open');
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
  document.getElementById('studentFixedDay').value = student.dia_fixo ?? '';
  document.getElementById('studentFixedTime').value = student.horario_fixo || '';
  document.getElementById('studentFixedGroup').value = student.turma_fixa || student.turma || '';
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
  const payments = (state.payments || [])
    .filter((item) => String(item.aluno_id) === String(id))
    .sort((a, b) => String(b.pago_em || b.vencimento || '').localeCompare(String(a.pago_em || a.vencimento || '')))
    .slice(0, 6);
  const paid = isPaid(student);
  const plan = `${escapeHTML(student.plano_nome || 'sem plano')} - ${money.format(Number(student.mensalidade || 0))}/mes`;
  const scheduleText = [student.dia_fixo !== '' && student.dia_fixo !== null && student.dia_fixo !== undefined ? weekdayName(student.dia_fixo) : '', student.horario_fixo || '', student.turma_fixa || ''].filter(Boolean).join(' - ') || 'sem agenda fixa';
  const nextFixedDate = student.dia_fixo !== '' && student.dia_fixo !== null && student.dia_fixo !== undefined ? nextDateForWeekday(student.dia_fixo) : '';
  const hasFixedSchedule = Boolean(nextFixedDate && student.horario_fixo);
  const nextAction = studentNextAction(student, weekly, target, nextClasses);
  document.getElementById('studentReport').innerHTML = `
    <div class="report-hero student-profile ${paid ? 'payment-paid' : 'payment-pending'}">
      <div>
        <span class="section-label">Relatorio do aluno</span>
        <h2>${escapeHTML(student.nome)}</h2>
        <p class="meta">${escapeHTML(student.telefone || 'sem telefone')} - ${plan} - vence dia ${dueDay(student)}</p>
        <div class="pill-row">
          <span class="pill ${student.status === 'Ativo' ? 'ok' : student.status === 'Experimental' ? 'warn' : ''}">${escapeHTML(student.status || 'Ativo')}</span>
          <span class="pill ${nextAction.className}">${escapeHTML(nextAction.label)}</span>
          <span class="pill">${escapeHTML(student.nivel || 'sem nivel')}</span>
          <span class="pill ${paid ? 'ok' : 'bad'}">${paid ? 'pagamento em dia' : 'pagamento pendente'}</span>
          <span class="pill">${weekly}/${target || '-'} na semana</span>
        </div>
      </div>
      <div class="actions">
        ${student.telefone ? `<a class="mini-btn" href="${whatsappUrl(student.telefone, `Oi ${student.nome}, tudo bem? Aqui e do Team Lucao Futevolei.`)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
        <button class="mini-btn" data-sync-student="${student.id}">Agenda fixa</button>
        <button class="mini-btn" data-edit-student="${student.id}">Editar</button>
        <button class="mini-btn" data-pay="${student.id}">${paid ? 'Nao pago' : 'Pago'}</button>
      </div>
    </div>
    <div class="report-grid student-report-grid">
      <article class="mini-stat"><span>Semana atual</span><strong>${weekly}/${target || '-'}</strong></article>
      <article class="mini-stat ${nextAction.className ? `kpi-${nextAction.className}` : ''}"><span>Acao sugerida</span><strong>${escapeHTML(nextAction.label)}</strong><small>${escapeHTML(nextAction.detail)}</small></article>
      <article class="mini-stat"><span>Presencas</span><strong>${summary.present}/${summary.enrolled}</strong></article>
      <article class="mini-stat"><span>Comparecimento</span><strong>${summary.rate}%</strong></article>
      <article class="mini-stat ${paid ? 'kpi-ok' : 'kpi-bad'}"><span>Pagamento</span><strong>${paid ? 'Em dia' : 'Pendente'}</strong></article>
    </div>
    <article class="row-card compact-row schedule-report-card">
      <div>
        <h3>Agenda fixa</h3>
        <p class="meta">${escapeHTML(scheduleText)}${nextFixedDate ? ` - proxima em ${formatDate(nextFixedDate)}` : ''}</p>
      </div>
      <div class="actions">
        <button class="mini-btn" data-sync-student="${student.id}">${hasFixedSchedule ? 'Criar proximas aulas' : 'Definir agenda'}</button>
      </div>
    </article>
    ${student.observacao ? `<p class="report-note">${escapeHTML(student.observacao)}</p>` : ''}
    <div class="two-col report-columns">
      <section>
        <div class="section-label">Proximas aulas previstas</div>
        <div class="list">${nextClasses.length ? nextClasses.map((item) => reportClassLine(item, false, id)).join('') : empty('Nenhuma proxima aula vinculada.')}</div>
      </section>
      <section>
        <div class="section-label">Historico recente</div>
        <div class="list">${recentClasses.length ? recentClasses.map((item) => reportClassLine(item, true, id)).join('') : empty('Sem historico de aulas.')}</div>
      </section>
    </div>
    <div class="section-label">Pagamentos recentes</div>
    <div class="list">${payments.length ? payments.map((item) => `
      <article class="row-card compact-row">
        <div>
          <h3>${money.format(Number(item.valor || 0))}</h3>
          <p class="meta">${escapeHTML(item.referencia || '')} - ${formatDate(item.pago_em || item.vencimento)} - ${escapeHTML(item.forma_pagamento || 'manual')}${item.observacao ? ` - ${escapeHTML(item.observacao)}` : ''}</p>
        </div>
      </article>
    `).join('') : empty('Sem pagamento registrado neste historico.')}</div>
  `;
  openModal('studentReportModal');
}

function reportClassLine(item, showPresence = false, studentId = '') {
  const entry = studentClassEntry(item, studentId);
  const [confirmClass, confirmText] = confirmationLabel(entry.confirmado || entry.confirmacao || '');
  return `
    <article class="row-card compact-row">
      <div>
        <h3>${formatDate(item.data)} ${escapeHTML(item.horario)} - ${escapeHTML(item.turma || 'Turma')}</h3>
        <p class="meta">${escapeHTML(item.professor || 'Professor nao informado')} - ${escapeHTML(classType(item))}</p>
      </div>
      <div class="pill-row">
        <span class="pill ${confirmClass}">${confirmText}</span>
        ${showPresence ? `<span class="pill ${item.wasPresent ? 'ok' : 'warn'}">${item.wasPresent ? 'presente' : 'faltou'}</span>` : ''}
      </div>
    </article>
  `;
}

function openClass(id = '') {
  const item = classById(id) || {};
  document.getElementById('classId').value = item.id || '';
  document.getElementById('classDate').value = item.data || todayISO();
  document.getElementById('classTime').value = item.horario || '18:30';
  document.getElementById('classGroup').value = item.turma || '';
  document.getElementById('classCoach').value = item.professor || '';
  document.getElementById('classType').value = classType(item);
  document.getElementById('classCapacity').value = item.capacidade || 8;
  document.getElementById('classStatus').value = item.status || 'Marcada';
  document.getElementById('classRepeatWeeks').value = item.id ? 1 : 4;
  document.getElementById('classRepeatWeeks').disabled = Boolean(item.id);
  const classSearch = document.getElementById('classStudentSearch');
  if (classSearch) classSearch.value = '';
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

async function copyText(text, message = 'Texto copiado') {
  if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
  toast(message);
}

function pendingChargeText(month = selectedPaymentMonth()) {
  const pending = state.students.filter((student) => student.status !== 'Pausado' && !isPaidForMonth(student, month));
  if (!pending.length) return `Sem mensalidades pendentes em ${month}.`;
  return pending.map((student) => (
    `${student.nome} - ${student.telefone || 'sem telefone'} - ${money.format(Number(student.mensalidade || 0))} - ref. ${month} - vence dia ${dueDay(student)}`
  )).join('\n');
}

function studentChargeText(student, month = selectedPaymentMonth()) {
  return `Oi ${student.nome}, tudo bem? Passando para lembrar da mensalidade do Team Lucao Futevolei referente a ${month}, no valor de ${money.format(Number(student.mensalidade || 0))}. Vencimento todo dia ${dueDay(student)}.`;
}

async function copyPendingCharges() {
  const text = pendingChargeText();
  await copyText(text, 'Lista de cobranca copiada');
  setPage('payments');
}

function monthlyOperationText(month = selectedPaymentMonth()) {
  const activeStudents = state.students.filter((student) => student.status !== 'Pausado');
  const pending = activeStudents.filter((student) => !isPaidForMonth(student, month));
  const monthPayments = (state.payments || []).filter((item) => paymentMonth(item) === month);
  const monthClasses = state.classes.filter((item) => String(item.data || '').startsWith(month) && item.status !== 'Cancelada');
  const expectedRevenue = activeStudents.reduce((sum, student) => sum + Number(student.mensalidade || 0), 0);
  const paidThisMonth = monthPayments.reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const pendingValue = pending.reduce((sum, student) => sum + Number(student.mensalidade || 0), 0);
  const expectedAttendance = monthClasses.reduce((sum, item) => sum + classStudents(item).length, 0);
  const present = monthClasses.reduce((sum, item) => (
    sum + classStudents(item).filter((student) => item.presencas?.[student.aluno_id || student.id] || student.presente).length
  ), 0);
  const rate = expectedAttendance ? Math.round((present / expectedAttendance) * 100) : 0;
  const extras = monthClasses.reduce((sum, item) => sum + classExtras(item).length, 0);
  const pendingBookings = (state.bookings || []).filter((item) => (item.status || 'Pendente') === 'Pendente').length;
  const approvedBookings = (state.bookings || []).filter((item) => (item.status || '') === 'Aprovado').length;
  const waitingOpen = state.waitlist.filter((item) => !['Convertido', 'Perdido'].includes(item.status || 'Novo')).length;
  return [
    `Fechamento Team Lucao - ${month}`,
    `Alunos ativos: ${state.students.filter((student) => student.status === 'Ativo').length}`,
    `Receita prevista: ${money.format(expectedRevenue)}`,
    `Recebido: ${money.format(paidThisMonth)}`,
    `A receber: ${money.format(pendingValue)} (${pending.length} aluno(s))`,
    `Aulas no mes: ${monthClasses.length}`,
    `Presencas: ${present}/${expectedAttendance} (${rate}%)`,
    `Avulsos/fora da lista: ${extras}`,
    `Pedidos pendentes/aprovados: ${pendingBookings}/${approvedBookings}`,
    `Interessados em aberto: ${waitingOpen}`
  ].join('\n');
}

async function copyMonthlyReport() {
  await copyText(monthlyOperationText(), 'Fechamento copiado');
}

async function copyStudentCharge(studentId) {
  const student = studentById(studentId);
  if (!student) return;
  const text = studentChargeText(student);
  await copyText(text, 'Cobranca copiada');
}

function classShareText(item) {
  const enrolled = classStudents(item);
  const names = enrolled.length ? enrolled.map((student, index) => `${index + 1}. ${student.nome}`).join('\n') : 'Sem alunos previstos.';
  return `Aula Team Lucao Futevolei\n${formatDate(item.data)} as ${item.horario} - ${item.turma || 'Turma'} (${classType(item)})\nProfessor: ${item.professor || 'nao informado'}\n\nPrevistos:\n${names}`;
}

function classRosterText(item) {
  const enrolled = classStudents(item);
  const extras = classExtras(item);
  const lines = enrolled.map((student, index) => {
    const id = student.aluno_id || student.id;
    const fullStudent = studentById(id) || student;
    return `${index + 1}. ${student.nome} - ${weeklyAttendanceCount(id, item.data)}/${planWeeklyTarget(fullStudent) || '-'} na semana`;
  });
  const extraLines = extras.map((extra, index) => `${extraType(extra)} ${index + 1}: ${extra.nome || extra}`);
  return [
    'Lista da aula - Team Lucao Futevolei',
    `${formatDate(item.data)} as ${item.horario} - ${item.turma || 'Turma'} (${classType(item)})`,
    `Professor: ${item.professor || 'nao informado'}`,
    '',
    'Previstos:',
    lines.length ? lines.join('\n') : 'Sem alunos previstos.',
    extraLines.length ? `\nFora da lista:\n${extraLines.join('\n')}` : ''
  ].filter(Boolean).join('\n');
}

async function copyClassRoster(classId) {
  const item = classById(classId);
  if (!item) return;
  await copyText(classRosterText(item), 'Lista da aula copiada');
}

function attendanceSummaryText(item) {
  const enrolled = classStudents(item);
  const present = enrolled.filter((student) => item.presencas?.[student.aluno_id || student.id] || student.presente);
  const presentIds = new Set(present.map((student) => String(student.aluno_id || student.id)));
  const absent = enrolled.filter((student) => !presentIds.has(String(student.aluno_id || student.id)));
  const confirmed = enrolled.filter((student) => (student.confirmado || student.confirmacao) === 'sim');
  const declined = enrolled.filter((student) => (student.confirmado || student.confirmacao) === 'nao');
  const extras = classExtras(item);
  return [
    'Resumo de presenca - Team Lucao Futevolei',
    `${formatDate(item.data)} as ${item.horario} - ${item.turma || 'Turma'} (${classType(item)})`,
    '',
    `Confirmaram que vao (${confirmed.length}):`,
    confirmed.length ? confirmed.map((student) => `- ${student.nome}`).join('\n') : '- nenhum',
    '',
    `Avisaram que nao vao (${declined.length}):`,
    declined.length ? declined.map((student) => `- ${student.nome}`).join('\n') : '- nenhum',
    '',
    `Presentes (${present.length}):`,
    present.length ? present.map((student) => `- ${student.nome}`).join('\n') : '- nenhum marcado',
    '',
    `Faltaram (${absent.length}):`,
    absent.length ? absent.map((student) => `- ${student.nome}`).join('\n') : '- ninguem',
    extras.length ? `\nFora da lista (${extras.length}):\n${extras.map((extra) => `- ${extra.nome || extra} (${extraType(extra)})`).join('\n')}` : ''
  ].filter(Boolean).join('\n');
}

async function copyAttendanceSummary(classId = activeAttendanceClassId) {
  const item = classById(classId);
  if (!item) return;
  await copyText(attendanceSummaryText(item), 'Resumo de presenca copiado');
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
  if (action === 'payments') {
    setPage('payments');
    document.getElementById('paymentStatusFilter').value = 'pending';
    renderPayments();
    return;
  }
  if (action === 'actions') {
    setPage('actions');
    return;
  }
  if (action === 'quick-pending') copyPendingCharges().catch((err) => toast(err.message));
  if (action === 'quick-next-class') openNextClass();
  if (action === 'quick-bookings') setPage('bookings');
  if (action === 'quick-waitlist') openWaitlist();
  if (action === 'quick-experimental') {
    setPage('classes');
    document.getElementById('classDateFilter').value = todayISO();
    document.getElementById('classTypeFilter').value = 'Experimental';
    document.getElementById('classStatusFilter').value = '';
    renderClasses();
  }
  if (action === 'quick-class') openClass();
}

function handleFocusAction(action) {
  if (action === 'next-class') {
    openNextClass();
    return;
  }
  if (action === 'payments') {
    setPage('payments');
    document.getElementById('paymentStatusFilter').value = 'pending';
    renderPayments();
    return;
  }
  if (action === 'bookings') {
    setPage('bookings');
    return;
  }
  if (action === 'waitlist') {
    setPage('waitlist');
    return;
  }
  if (action.startsWith('wait:')) {
    setPage('waitlist');
    openWaitItem(action.split(':')[1]);
  }
}

function fillClassStudents(selected = []) {
  const select = document.getElementById('classStudents');
  if (!select) return;
  const selectedSet = new Set(selected.map(String));
  select.innerHTML = state.students.filter((student) => student.status !== 'Pausado').map((student) => (
    `<option value="${student.id}" ${selectedSet.has(String(student.id)) ? 'selected' : ''}>${escapeHTML(student.nome)} - ${escapeHTML(student.plano_nome || 'sem plano')}</option>`
  )).join('');
  renderClassStudentChecklist();
}

function selectedClassStudentIds() {
  return [...document.getElementById('classStudents')?.selectedOptions || []].map((option) => String(option.value));
}

function renderClassStudentChecklist() {
  const list = document.getElementById('classStudentChecklist');
  const count = document.getElementById('classStudentCount');
  const select = document.getElementById('classStudents');
  if (!list || !select) return;
  const selected = new Set(selectedClassStudentIds());
  const query = document.getElementById('classStudentSearch')?.value.trim().toLowerCase() || '';
  const students = state.students
    .filter((student) => student.status !== 'Pausado')
    .filter((student) => {
      const haystack = `${student.nome} ${student.telefone} ${student.plano_nome} ${student.nivel}`.toLowerCase();
      return selected.has(String(student.id)) || !query || haystack.includes(query);
    })
    .sort((a, b) => Number(selected.has(String(b.id))) - Number(selected.has(String(a.id))) || a.nome.localeCompare(b.nome))
    .slice(0, query ? 30 : 18);
  if (count) count.textContent = `${selected.size} selecionado(s)`;
  list.innerHTML = students.length ? students.map((student) => {
    const checked = selected.has(String(student.id));
    const schedule = [student.dia_fixo !== '' && student.dia_fixo !== null && student.dia_fixo !== undefined ? weekdayName(student.dia_fixo) : '', student.horario_fixo || ''].filter(Boolean).join(' ');
    return `
      <label class="class-student-option ${checked ? 'selected' : ''}">
        <input type="checkbox" value="${student.id}" ${checked ? 'checked' : ''} data-class-student-check />
        <span>
          <strong>${escapeHTML(student.nome)}</strong>
          <small>${escapeHTML(student.plano_nome || 'sem plano')}${schedule ? ` - ${escapeHTML(schedule)}` : ''}</small>
        </span>
      </label>
    `;
  }).join('') : empty('Nenhum aluno encontrado.');
}

function toggleClassStudent(studentId, checked) {
  const option = [...document.getElementById('classStudents')?.options || []].find((item) => String(item.value) === String(studentId));
  if (!option) return;
  option.selected = checked;
  renderClassStudentChecklist();
}

function bookingReplyText(booking, item) {
  const classText = item ? `${formatDate(item.data)} as ${item.horario}` : 'a aula solicitada';
  return `Oi ${booking.nome}, tudo bem? Aqui e do Team Lucao Futevolei. Recebi seu pedido para ${classText} e vou confirmar por aqui.`;
}

function publicClassLabel(item) {
  const used = Number(item.inscritos ?? classStudentIds(item).length);
  const capacity = Number(item.capacidade || 8);
  return `${formatDate(item.data)} ${item.horario} - ${item.turma || 'Turma'} (${used}/${capacity})`;
}

async function loadPublicClasses() {
  if (location.protocol !== 'file:') {
    try {
      const res = await fetch('/api/public/classes');
      const data = await res.json();
      if (res.ok && data.ok) return data.items || [];
    } catch {
      // local demo fallback
    }
  }
  return [...state.classes]
    .filter((item) => item.status !== 'Cancelada' && item.data >= todayISO())
    .sort(sortClass)
    .slice(0, 20)
    .map((item) => ({ ...item, inscritos: classStudentIds(item).length }));
}

async function renderPublicBooking() {
  const select = document.getElementById('bookingClass');
  const list = document.getElementById('bookingClassList');
  if (!select || !list) return;
  const hasServer = await detectServer();
  const bookingStatus = document.getElementById('bookingStatus');
  const studentStatus = document.getElementById('studentConfirmStatus');
  if (!hasServer && bookingStatus && !bookingStatus.textContent) bookingStatus.textContent = 'Modo demo: pedido fica salvo apenas neste navegador.';
  if (!hasServer && studentStatus && !studentStatus.textContent) studentStatus.textContent = 'Modo demo: confirmacao real precisa do servidor online.';
  const classes = await loadPublicClasses();
  select.innerHTML = classes.length
    ? classes.map((item) => `<option value="${item.id}">${escapeHTML(publicClassLabel(item))}</option>`).join('')
    : '<option value="">Sem horario disponivel</option>';
  list.innerHTML = classes.length ? classes.map((item) => {
    const used = Number(item.inscritos ?? classStudentIds(item).length);
    const capacity = Number(item.capacidade || 8);
    const available = Math.max(0, capacity - used);
    return `
      <button class="booking-class-card ${available ? '' : 'is-full'}" type="button" data-booking-class="${item.id}">
        <strong>${formatDate(item.data)} ${escapeHTML(item.horario)}</strong>
        <span>${escapeHTML(item.turma || 'Turma')} - ${escapeHTML(item.tipo || 'Regular')}</span>
        <small>${available ? `${available} vaga(s) livres` : 'lotada'}</small>
      </button>
    `;
  }).join('') : empty('Nenhuma aula disponivel agora.');
}

async function submitBooking(event) {
  event.preventDefault();
  const payload = {
    nome: document.getElementById('bookingName').value.trim(),
    telefone: document.getElementById('bookingPhone').value.trim(),
    aula_id: document.getElementById('bookingClass').value,
    observacao: document.getElementById('bookingNote').value.trim()
  };
  if (!payload.nome || !payload.aula_id) throw new Error('Informe nome e aula');
  if (location.protocol !== 'file:') {
    try {
      const res = await fetch('/api/public/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) throw new Error(data.error || 'Nao foi possivel enviar');
      document.getElementById('bookingStatus').textContent = 'Pedido enviado. Aguarde a confirmacao pelo WhatsApp.';
      event.target.reset();
      await renderPublicBooking();
      return;
    } catch (err) {
      if (await detectServer()) throw err;
    }
  }
  state.bookings = state.bookings || [];
  state.bookings.unshift({
    id: uid(),
    ...payload,
    status: 'Pendente',
    criado_em: todayISO(),
    respondido_em: ''
  });
  recordAction('Aluno', 'Pedido de aula', `${payload.nome} solicitou vaga pelo formulario publico.`);
  saveLocalState();
  document.getElementById('bookingStatus').textContent = 'Pedido salvo na demo. Entre no painel para aprovar.';
  event.target.reset();
  renderPublicBooking();
}

function setPublicTab(tab = 'guest') {
  document.querySelectorAll('[data-public-tab]').forEach((button) => {
    button.classList.toggle('active', button.dataset.publicTab === tab);
  });
  document.querySelectorAll('[data-public-pane]').forEach((pane) => {
    pane.classList.toggle('active', pane.dataset.publicPane === tab);
  });
  if (tab === 'student') renderStudentConfirmList();
}

function renderStudentConfirmList() {
  const list = document.getElementById('studentClassList');
  if (!list) return;
  if (!publicStudentLookup.telefone) {
    list.innerHTML = empty('Digite seu WhatsApp para ver as aulas em que voce ja esta na lista.');
    return;
  }
  const student = publicStudentLookup.student;
  const items = publicStudentLookup.items || [];
  if (!items.length) {
    list.innerHTML = empty('Nenhuma aula futura encontrada para esse WhatsApp.');
    return;
  }
  const confirmedYes = items.filter((item) => item.confirmado === 'sim').length;
  const confirmedNo = items.filter((item) => item.confirmado === 'nao').length;
  const open = Math.max(0, items.length - confirmedYes - confirmedNo);
  list.innerHTML = `
    <div class="student-confirm-head">
      <span class="pill ok">${escapeHTML(student?.nome || 'Aluno')}</span>
      <small>${escapeHTML(student?.plano_nome || 'Plano nao informado')}</small>
    </div>
    <div class="student-confirm-summary">
      <span class="pill ok">${confirmedYes} vou</span>
      <span class="pill bad">${confirmedNo} nao vou</span>
      <span class="pill ${open ? 'warn' : 'ok'}">${open} sem resposta</span>
    </div>
    ${items.map((item) => {
      const yes = item.confirmado === 'sim';
      const no = item.confirmado === 'nao';
      return `
        <article class="student-confirm-card ${yes ? 'confirm-yes' : no ? 'confirm-no' : ''}">
          <div>
            <strong>${formatDate(item.data)} as ${escapeHTML(item.horario)}</strong>
            <span>${escapeHTML(item.turma || 'Turma')} - ${escapeHTML(item.tipo || 'Regular')}</span>
            <small>${item.confirmado ? `Resposta: ${yes ? 'vou' : 'nao vou'}` : 'Ainda sem resposta'}</small>
          </div>
          <div class="confirm-choice">
            <button class="mini-btn ${yes ? 'active' : ''}" type="button" data-student-confirm="${item.id}:sim">Vou</button>
            <button class="mini-btn ${no ? 'active danger' : ''}" type="button" data-student-confirm="${item.id}:nao">Nao vou</button>
          </div>
        </article>
      `;
    }).join('')}
  `;
}

function localStudentClassesByPhone(telefone = '') {
  const digits = phoneDigits(telefone).slice(-8);
  const student = state.students.find((item) => phoneDigits(item.telefone).endsWith(digits));
  if (!student) return { student: null, items: [] };
  const items = state.classes
    .filter((item) => item.status !== 'Cancelada' && item.data >= todayISO() && classStudentIds(item).some((id) => String(id) === String(student.id)))
    .sort(sortClass)
    .slice(0, 30)
    .map((item) => ({ ...item, confirmado: item.confirmacoes?.[student.id] || '' }));
  return { student, items };
}

async function loadStudentConfirmations(telefone) {
  const status = document.getElementById('studentConfirmStatus');
  publicStudentLookup = { telefone, student: null, items: [] };
  if (status) status.textContent = 'Buscando suas aulas...';
  if (location.protocol !== 'file:') {
    try {
      const res = await fetch(`/api/public/student-classes?telefone=${encodeURIComponent(telefone)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) throw new Error(data.error || 'Nao foi possivel buscar');
      publicStudentLookup = { telefone, student: data.student, items: data.items || [] };
      if (status) status.textContent = data.items?.length ? 'Escolha em quais aulas voce vai.' : 'Nenhuma aula futura encontrada.';
      renderStudentConfirmList();
      return;
    } catch (err) {
      if (await detectServer()) throw err;
    }
  }
  const local = localStudentClassesByPhone(telefone);
  publicStudentLookup = { telefone, student: local.student, items: local.items };
  if (status) status.textContent = local.student ? 'Modo demo local.' : 'Aluno nao encontrado na demo.';
  renderStudentConfirmList();
}

async function submitStudentConfirmation(classId, confirmado) {
  const telefone = publicStudentLookup.telefone || document.getElementById('studentLookupPhone')?.value.trim();
  if (!telefone) throw new Error('Informe seu WhatsApp');
  if (location.protocol !== 'file:') {
    try {
      const res = await fetch('/api/public/student-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone, aula_id: classId, confirmado })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) throw new Error(data.error || 'Nao foi possivel confirmar');
      await loadStudentConfirmations(telefone);
      document.getElementById('studentConfirmStatus').textContent = confirmado === 'sim' ? 'Confirmado: voce vai.' : 'Confirmado: voce nao vai.';
      return;
    } catch (err) {
      if (await detectServer()) throw err;
    }
  }
  const local = localStudentClassesByPhone(telefone);
  if (!local.student) throw new Error('Aluno nao encontrado');
  const classItem = classById(classId);
  if (!classItem) throw new Error('Aula nao encontrada');
  classItem.confirmacoes = { ...(classItem.confirmacoes || {}), [local.student.id]: confirmado };
  recordAction('Aluno', 'Confirmacao aluno', `${local.student.nome} respondeu ${confirmado === 'sim' ? 'vou' : 'nao vou'} na aula ${classItem.horario} - ${classItem.turma || 'Turma'}.`);
  touchState();
  saveLocalState();
  publicStudentLookup = { telefone, student: local.student, items: localStudentClassesByPhone(telefone).items };
  renderStudentConfirmList();
}

async function respondBooking(id, action, force = false) {
  const booking = (state.bookings || []).find((item) => String(item.id) === String(id));
  if (!booking) return;
  const item = bookingClass(booking);
  if (!item) throw new Error('Aula nao encontrada');
  const approve = action === 'approve';
  if (!approve && !confirm(`Recusar pedido de ${booking.nome}?`)) return;
  if (approve && classStudentIds(item).length >= Number(item.capacidade || 8) && !force) {
    if (!confirm('Aula lotada. Aprovar mesmo assim como fora da lista?')) return;
    force = true;
  }
  if (apiMode) {
    await api(`/api/bookings/${id}/respond`, { method: 'POST', body: JSON.stringify({ action, force }) });
    await loadData();
    toast(approve ? 'Pedido aprovado' : 'Pedido recusado');
    return;
  }
  if (action === 'bookings') {
    setPage('bookings');
    return;
  }
  if (!approve) {
    booking.status = 'Recusado';
    booking.respondido_em = todayISO();
    recordAction('Professor', 'Pedido recusado', `${booking.nome} foi recusado na aula ${item.horario} - ${item.turma || 'Turma'}.`);
    saveAndRender();
    toast('Pedido recusado');
    return;
  }
  const digits = String(booking.telefone || '').replace(/\D/g, '');
  const student = digits ? state.students.find((entry) => String(entry.telefone || '').replace(/\D/g, '').endsWith(digits.slice(-8))) : null;
  if (student && !classStudentIds(item).map(String).includes(String(student.id))) {
    item.aluno_ids = [...classStudentIds(item), student.id];
    item.presencas = item.presencas || {};
    item.presencas[student.id] = item.presencas[student.id] || false;
  } else {
    item.extra_presentes = [...classExtras(item), { id: `ag${booking.id}`, nome: booking.nome, tipo: 'Solicitado', criado_em: todayISO() }];
  }
  booking.status = 'Aprovado';
  booking.respondido_em = todayISO();
  recordAction('Professor', 'Pedido aprovado', `${booking.nome} foi aprovado na aula ${item.horario} - ${item.turma || 'Turma'}.`);
  saveAndRender();
  toast('Pedido aprovado');
}

function syncStudentFixedSchedule(student) {
  if (!student?.id || student.status === 'Pausado') return 0;
  if (student.dia_fixo === '' || student.dia_fixo === null || student.dia_fixo === undefined || !student.horario_fixo) return 0;
  const start = nextDateForWeekday(student.dia_fixo);
  if (!start) return 0;
  const group = student.turma_fixa || student.turma || student.nivel || 'Turma fixa';
  let touched = 0;
  Array.from({ length: 4 }, (_item, index) => addDaysIso(start, index * 7)).forEach((dateIso) => {
    let item = state.classes.find((entry) => (
      entry.data === dateIso &&
      entry.horario === student.horario_fixo &&
      String(entry.turma || '') === String(group) &&
      entry.status !== 'Cancelada'
    ));
    if (!item) {
      item = {
        id: uid(),
        data: dateIso,
        horario: student.horario_fixo,
        turma: group,
        professor: '',
        tipo: 'Regular',
        capacidade: 8,
        status: 'Marcada',
        aluno_ids: [],
        presencas: {},
        extra_presentes: []
      };
      state.classes.push(item);
    }
    const ids = new Set(classStudentIds(item).map(String));
    if (!ids.has(String(student.id))) {
      item.aluno_ids = [...ids, String(student.id)];
      item.presencas = item.presencas || {};
      item.presencas[student.id] = item.presencas[student.id] || false;
      touched += 1;
    }
  });
  return touched;
}

async function syncStudentFixedScheduleApi(student) {
  if (!student?.id || student.status === 'Pausado') return 0;
  if (student.dia_fixo === '' || student.dia_fixo === null || student.dia_fixo === undefined || !student.horario_fixo) return 0;
  const start = nextDateForWeekday(student.dia_fixo);
  if (!start) return 0;
  const group = student.turma_fixa || student.turma || student.nivel || 'Turma fixa';
  let touched = 0;
  for (const dateIso of Array.from({ length: 4 }, (_item, index) => addDaysIso(start, index * 7))) {
    const existing = state.classes.find((entry) => (
      entry.data === dateIso &&
      entry.horario === student.horario_fixo &&
      String(entry.turma || '') === String(group) &&
      entry.status !== 'Cancelada'
    ));
    if (!existing) {
      await api('/api/classes', {
        method: 'POST',
        body: JSON.stringify({
          data: dateIso,
          horario: student.horario_fixo,
          turma: group,
          professor: '',
          tipo: 'Regular',
          capacidade: 8,
          status: 'Marcada',
          aluno_ids: [student.id],
          presencas: {}
        })
      });
      touched += 1;
      continue;
    }
    const ids = new Set(classStudentIds(existing).map(String));
    if (!ids.has(String(student.id))) {
      await api(`/api/classes/${existing.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...existing,
          aluno_ids: [...ids, String(student.id)],
          presencas: existing.presencas || {}
        })
      });
      touched += 1;
    }
  }
  return touched;
}

async function syncStudentScheduleAction(studentId) {
  const student = studentById(studentId);
  if (!student) return;
  if (student.dia_fixo === '' || student.dia_fixo === null || student.dia_fixo === undefined || !student.horario_fixo) {
    toast('Defina dia e horario fixo antes de sincronizar');
    openStudent(studentId);
    return;
  }
  let linked = 0;
  if (apiMode) {
    linked = await syncStudentFixedScheduleApi(student);
    await loadData();
  } else {
    linked = syncStudentFixedSchedule(student);
    recordAction('Professor', 'Agenda fixa', `${student.nome} teve agenda fixa sincronizada: ${linked || 0} aula(s).`);
    saveAndRender();
  }
  toast(linked ? `${linked} aula(s) vinculada(s)` : 'Agenda fixa ja estava sincronizada');
  openStudentReport(studentId);
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
    dia_fixo: document.getElementById('studentFixedDay').value,
    horario_fixo: document.getElementById('studentFixedTime').value,
    turma_fixa: document.getElementById('studentFixedGroup').value.trim(),
    observacao: document.getElementById('studentNote').value.trim(),
    pago_ate: studentById(id)?.pago_ate || ''
  };
  if (apiMode) {
    const saved = await api(id ? `/api/students/${id}` : '/api/students', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    await loadData();
    const linked = await syncStudentFixedScheduleApi(saved.item || { ...payload, id });
    if (linked) await loadData();
  } else {
    const next = { ...payload, id: id || uid() };
    const index = state.students.findIndex((student) => String(student.id) === String(next.id));
    if (index >= 0) state.students[index] = next;
    else state.students.push(next);
    const linked = syncStudentFixedSchedule(next);
    recordAction('Professor', id ? 'Aluno atualizado' : 'Aluno cadastrado', `${next.nome} ${id ? 'teve cadastro atualizado' : 'foi cadastrado'}${linked ? ` e vinculado a ${linked} aula(s).` : '.'}`);
    saveAndRender();
    if (linked) toast(`${linked} aula(s) vinculada(s)`);
  }
  closeModal('studentModal');
  toast('Aluno salvo');
}

async function saveClass(event) {
  event.preventDefault();
  const id = document.getElementById('classId').value;
  const alunoIds = [...document.getElementById('classStudents').selectedOptions].map((option) => option.value);
  const previous = classById(id);
  const presencas = {};
  alunoIds.forEach((studentId) => { presencas[studentId] = previous?.presencas?.[studentId] || false; });
  const payload = {
    data: document.getElementById('classDate').value,
    horario: document.getElementById('classTime').value,
    turma: document.getElementById('classGroup').value.trim(),
    professor: document.getElementById('classCoach').value.trim(),
    tipo: document.getElementById('classType').value,
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
    recordAction('Professor', id ? 'Aula atualizada' : 'Aula criada', `${payload.horario} - ${payload.turma || 'Turma'} em ${formatDate(payload.data)}.`);
    saveAndRender();
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
    saveAndRender();
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
    recordAction('Professor', id ? 'Espera atualizada' : 'Interessado cadastrado', `${next.nome} entrou/atualizou a lista de espera.`);
    saveAndRender();
  }
  closeModal('waitlistModal');
  toast('Interessado salvo');
}

function openAttendance(classId) {
  const item = classById(classId);
  if (!item) return;
  activeAttendanceClassId = classId;
  const enrolled = classStudents(item);
  const ids = enrolled.map((student) => student.aluno_id || student.id);
  const extras = classExtras(item);
  const presentCount = ids.filter((id) => item.presencas?.[id] || item.presencas?.[String(id)]).length;
  const confirmation = classConfirmationStats(item);
  const absentLikely = enrolled.filter((student) => (student.confirmado || student.confirmacao) === 'nao').length;
  document.getElementById('attendanceTitle').innerHTML = `
    <span>${formatDate(item.data)} as ${escapeHTML(item.horario)} - ${escapeHTML(item.turma || 'Turma')}</span>
    <strong>${presentCount}/${ids.length} presentes</strong>
    <small>${escapeHTML(classType(item))} - ${escapeHTML(item.status || 'Marcada')} - ${confirmation.yes} vao - ${absentLikely} nao vao - ${confirmation.open} sem resposta - ${extras.length} fora da lista</small>
  `;
  document.getElementById('attendanceList').innerHTML = enrolled.map((student) => {
    const id = student.aluno_id || student.id;
    const fullStudent = studentById(id) || student;
    const present = Boolean(item.presencas?.[id] || item.presencas?.[String(id)] || student.presente);
    const [confirmClass, confirmText] = confirmationLabel(student.confirmado || student.confirmacao || '');
    const phone = fullStudent.telefone || student.telefone || '';
    return `
    <div class="check-item ${present ? 'checked-in' : ''} ${confirmClass === 'bad' ? 'likely-absent' : ''}">
      <div>
        <strong>${escapeHTML(student.nome)}</strong>
        <p class="meta">${escapeHTML(fullStudent.plano_nome || student.plano_nome || 'sem plano')} - ${weeklyAttendanceCount(id, item.data)}/${planWeeklyTarget(fullStudent) || '-'} na semana</p>
        <div class="pill-row">
          <span class="pill ${confirmClass}">${confirmText}</span>
          ${phone ? `<a class="pill" href="${whatsappUrl(phone, `Oi ${student.nome}, tudo bem? Aqui e do Team Lucao Futevolei. Voce confirma a aula de hoje as ${item.horario}?`)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
        </div>
      </div>
      <button class="mini-btn ${present ? 'present' : ''}" data-toggle-attendance="${item.id}:${id}">
        ${present ? 'Presente' : 'Marcar'}
      </button>
    </div>
  `;
  }).join('') || empty('Nenhum aluno vinculado a esta aula.');
  document.getElementById('extraAttendanceList').innerHTML = extras.length ? extras.map((extra, index) => `
    <article class="row-card compact-row">
      <div>
        <h3>${escapeHTML(extra.nome || extra)}</h3>
        <p class="meta">${escapeHTML(extraType(extra))} - fora da lista prevista</p>
      </div>
      <div class="actions">
        <button class="mini-btn danger-mini" data-remove-extra="${item.id}:${index}">Remover</button>
      </div>
    </article>
  `).join('') : empty('Nenhum avulso marcado.');
  openModal('attendanceModal');
}

async function saveClassItem(item) {
  if (apiMode) {
    await api(`/api/classes/${item.id}`, { method: 'PUT', body: JSON.stringify(item) });
    await loadData();
  } else {
    saveAndRender();
  }
}

async function updateClassStatus(id, status) {
  const item = classById(id);
  if (!item) return;
  item.status = status;
  if (!apiMode) recordAction('Professor', 'Status da aula', `${item.horario} - ${item.turma || 'Turma'} mudou para ${status}.`);
  await saveClassItem(item);
  toast(`Aula ${status.toLowerCase()}`);
}

async function finishAttendance() {
  if (!activeAttendanceClassId) return;
  await updateClassStatus(activeAttendanceClassId, 'Finalizada');
  closeModal('attendanceModal');
}

async function addExtraAttendance(event) {
  event.preventDefault();
  const item = classById(activeAttendanceClassId);
  if (!item) return;
  const input = document.getElementById('extraAttendanceName');
  const name = input.value.trim();
  if (!name) return;
  const type = document.getElementById('extraAttendanceType').value || 'Avulso';
  item.extra_presentes = [...classExtras(item), { id: uid(), nome: name, tipo: type, criado_em: todayISO() }];
  recordAction('Professor', 'Fora da lista', `${name} entrou como ${type} na aula ${item.horario} - ${item.turma || 'Turma'}.`);
  input.value = '';
  document.getElementById('extraAttendanceType').value = 'Avulso';
  await saveClassItem(item);
  openAttendance(item.id);
  toast('Avulso adicionado');
}

async function removeExtraAttendance(classId, index) {
  const item = classById(classId);
  if (!item) return;
  item.extra_presentes = [...classExtras(item)];
  const removed = item.extra_presentes[Number(index)];
  item.extra_presentes.splice(Number(index), 1);
  recordAction('Professor', 'Fora da lista removido', `${removed?.nome || 'Pessoa'} foi removido(a) da aula ${item.horario} - ${item.turma || 'Turma'}.`);
  await saveClassItem(item);
  openAttendance(classId);
  toast('Avulso removido');
}

async function setClassAttendance(classId, present) {
  const item = classById(classId);
  if (!item) return;
  item.presencas = item.presencas || {};
  classStudentIds(item).forEach((studentId) => { item.presencas[studentId] = present; });
  if (!apiMode) recordAction('Professor', 'Presenca em massa', `${item.turma || 'Turma'} teve presencas ${present ? 'marcadas' : 'limpas'}.`);
  if (apiMode) {
    await api(`/api/classes/${classId}/attendance`, { method: 'PUT', body: JSON.stringify({ attendance: item.presencas }) });
    await loadData();
  } else {
    saveAndRender();
  }
  openAttendance(classId);
  toast(present ? 'Turma marcada presente' : 'Presenças limpas');
}

async function toggleAttendance(classId, studentId) {
  const item = classById(classId);
  if (!item) return;
  item.presencas = item.presencas || {};
  item.presencas[studentId] = !item.presencas[studentId];
  const student = studentById(studentId);
  if (!apiMode) recordAction('Professor', 'Presenca', `${student?.nome || 'Aluno'} foi ${item.presencas[studentId] ? 'marcado presente' : 'desmarcado'} na aula ${item.horario} - ${item.turma || 'Turma'}.`);
  if (apiMode) {
    await api(`/api/classes/${classId}/attendance`, { method: 'PUT', body: JSON.stringify({ attendance: item.presencas }) });
    await loadData();
  } else {
    saveAndRender();
  }
  openAttendance(classId);
}

function openPayment(studentId) {
  const student = studentById(studentId);
  if (!student) return;
  const month = selectedPaymentMonth();
  document.getElementById('paymentStudentId').value = student.id;
  document.getElementById('paymentStudentName').textContent = `${student.nome} - ${escapeHTML(student.plano_nome || 'sem plano')}`;
  document.getElementById('paymentReference').value = month;
  document.getElementById('paymentPaidAt').value = todayISO();
  document.getElementById('paymentValue').value = Number(student.mensalidade || 0).toFixed(2);
  document.getElementById('paymentMethod').value = 'Pix';
  document.getElementById('paymentNote').value = '';
  openModal('paymentModal');
}

async function markPaid(studentId) {
  const student = studentById(studentId);
  if (!student) return;
  const month = selectedPaymentMonth();
  const alreadyPaid = isPaidForMonth(student, month);
  if (!alreadyPaid) {
    openPayment(studentId);
    return;
  }
  if (!confirm(`Marcar ${student.nome} como NAO pago em ${month}?`)) return;
  if (apiMode) {
    await api(`/api/students/${studentId}`, { method: 'PUT', body: JSON.stringify({ ...student, pago_ate: '' }) });
    await loadData();
  } else {
    student.pago_ate = '';
    state.payments = (state.payments || []).filter((item) => !(String(item.aluno_id) === String(student.id) && paymentMonth(item) === month));
    recordAction('Professor', 'Pagamento reaberto', `${student.nome} foi marcado como nao pago em ${month}.`);
    saveAndRender();
  }
  toast('Mensalidade marcada como nao paga');
}

async function savePayment(event) {
  event.preventDefault();
  const studentId = document.getElementById('paymentStudentId').value;
  const student = studentById(studentId);
  if (!student) return;
  const month = document.getElementById('paymentReference').value || selectedPaymentMonth();
  const paidUntil = dueDateForMonth(student, month);
  const paidAt = document.getElementById('paymentPaidAt').value || todayISO();
  const value = Number(document.getElementById('paymentValue').value || student.mensalidade || 0);
  const method = document.getElementById('paymentMethod').value || 'Pix';
  const note = document.getElementById('paymentNote').value.trim();
  if (apiMode) {
    await api(`/api/students/${studentId}/pay`, {
      method: 'POST',
      body: JSON.stringify({
        referencia: month,
        vencimento: paidUntil,
        pago_em: paidAt,
        valor: value,
        forma_pagamento: method,
        observacao: note
      })
    });
    await loadData();
  } else {
    student.pago_ate = student.pago_ate && student.pago_ate > paidUntil ? student.pago_ate : paidUntil;
    state.payments = state.payments || [];
    state.payments.unshift({
      id: uid(),
      aluno_id: student.id,
      aluno_nome: student.nome,
      referencia: month,
      valor: value,
      vencimento: paidUntil,
      pago_em: paidAt,
      status: 'PAGO',
      forma_pagamento: method,
      observacao: note
    });
    recordAction('Professor', 'Pagamento', `${student.nome} pagou ${money.format(value)} via ${method} em ${month}.`);
    saveAndRender();
  }
  closeModal('paymentModal');
  toast('Mensalidade marcada como paga');
}

async function duplicateClass(id) {
  const item = classById(id);
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
    recordAction('Professor', 'Aula duplicada', `${item.turma || 'Turma'} foi duplicada para ${formatDate(next.data)}.`);
    saveAndRender();
  }
  toast('Aula duplicada para a próxima semana');
}

async function updateWaitStatus(id, status) {
  const item = state.waitlist.find((entry) => String(entry.id) === String(id));
  if (!item) return;
  item.status = status;
  if (apiMode) {
    await api(`/api/waitlist/${id}`, { method: 'PUT', body: JSON.stringify(item) });
    await loadData();
  } else {
    recordAction('Professor', 'Status da espera', `${item.nome} mudou para ${status}.`);
    saveAndRender();
  }
  toast('Status atualizado');
}

function convertWait(id) {
  const item = state.waitlist.find((entry) => String(entry.id) === String(id));
  if (!item) return;
  item.status = 'Convertido';
  if (!apiMode) {
    recordAction('Professor', 'Interessado convertido', `${item.nome} virou aluno em preparo.`);
    saveLocalState();
  }
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

async function createServerBackup() {
  if (!apiMode) {
    toast('Backup em servidor só com npm start');
    return;
  }
  const res = await api('/api/backups/create', { method: 'POST', body: JSON.stringify({}) });
  toast(`Backup criado: ${res.filename}`);
}

function bindEvents() {
  const renderStudentsLater = () => scheduleUiWork('students', renderStudents);
  const renderPaymentsLater = () => scheduleUiWork('payments', renderPayments);
  const renderActionsLater = () => scheduleUiWork('actions', renderActions);
  const renderGlobalResultsLater = () => scheduleUiWork('global-results', renderGlobalResults);
  const renderClassChecklistLater = () => scheduleUiWork('class-checklist', renderClassStudentChecklist);

  document.getElementById('bookingForm')?.addEventListener('submit', (event) => submitBooking(event).catch((err) => toast(err.message)));
  document.querySelectorAll('[data-public-tab]').forEach((button) => button.addEventListener('click', () => setPublicTab(button.dataset.publicTab)));
  document.getElementById('studentLookupForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    loadStudentConfirmations(document.getElementById('studentLookupPhone').value.trim()).catch((err) => {
      document.getElementById('studentConfirmStatus').textContent = err.message;
    });
  });
  document.getElementById('studentClassList')?.addEventListener('click', (event) => {
    const target = event.target.closest('[data-student-confirm]');
    if (!target) return;
    const [classId, confirmed] = target.dataset.studentConfirm.split(':');
    submitStudentConfirmation(classId, confirmed).catch((err) => {
      document.getElementById('studentConfirmStatus').textContent = err.message;
    });
  });
  document.getElementById('adminAccessBtn')?.addEventListener('click', () => {
    showBooking(false);
    showLogin(true);
  });
  document.getElementById('bookingClassList')?.addEventListener('click', (event) => {
    const target = event.target.closest('[data-booking-class]');
    if (!target) return;
    document.getElementById('bookingClass').value = target.dataset.bookingClass;
    document.getElementById('bookingName').focus();
  });
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
  document.querySelectorAll('[data-backup]').forEach((button) => button.addEventListener('click', () => downloadBackup().catch((err) => toast(err.message))));
  document.querySelectorAll('[data-copy-pending]').forEach((button) => button.addEventListener('click', () => copyPendingCharges().catch((err) => toast(err.message))));
  document.querySelectorAll('[data-server-backup]').forEach((button) => button.addEventListener('click', () => createServerBackup().catch((err) => toast(err.message))));
  document.querySelectorAll('[data-clear-class-filter]').forEach((button) => button.addEventListener('click', () => {
    document.getElementById('classDateFilter').value = '';
    document.getElementById('classTypeFilter').value = '';
    document.getElementById('classStatusFilter').value = '';
    renderClasses();
  }));
  document.getElementById('quickActions').addEventListener('click', (event) => {
    const target = event.target.closest('[data-action]');
    if (target) handleQuickAction(target.dataset.action);
  });
  document.getElementById('focusStrip').addEventListener('click', (event) => {
    const target = event.target.closest('[data-focus-action]');
    if (target) handleFocusAction(target.dataset.focusAction);
  });
  document.getElementById('studentForm').addEventListener('submit', (event) => saveStudent(event).catch((err) => toast(err.message)));
  document.getElementById('paymentForm').addEventListener('submit', (event) => savePayment(event).catch((err) => toast(err.message)));
  document.getElementById('classForm').addEventListener('submit', (event) => saveClass(event).catch((err) => toast(err.message)));
  document.getElementById('planForm').addEventListener('submit', (event) => savePlan(event).catch((err) => toast(err.message)));
  document.getElementById('waitlistForm').addEventListener('submit', (event) => saveWaitlist(event).catch((err) => toast(err.message)));
  document.getElementById('extraAttendanceForm').addEventListener('submit', (event) => addExtraAttendance(event).catch((err) => toast(err.message)));
  document.getElementById('markAllPresent').addEventListener('click', () => setClassAttendance(activeAttendanceClassId, true).catch((err) => toast(err.message)));
  document.getElementById('clearAttendance').addEventListener('click', () => setClassAttendance(activeAttendanceClassId, false).catch((err) => toast(err.message)));
  document.getElementById('copyAttendance').addEventListener('click', () => copyAttendanceSummary().catch((err) => toast(err.message)));
  document.getElementById('finishAttendance').addEventListener('click', () => finishAttendance().catch((err) => toast(err.message)));
  document.getElementById('studentSearch').addEventListener('input', renderStudentsLater);
  document.getElementById('globalSearch').addEventListener('input', renderGlobalResultsLater);
  document.getElementById('globalResults').addEventListener('click', (event) => {
    const target = event.target.closest('[data-global-result]');
    if (target) openGlobalResult(target.dataset.globalResult);
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.global-search')) document.getElementById('globalResults').classList.remove('open');
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const openModalEl = document.querySelector('.modal-wrap.open');
    if (openModalEl) {
      closeModal(openModalEl.id);
      return;
    }
    document.getElementById('globalResults').classList.remove('open');
  });
  document.getElementById('studentStatusFilter').addEventListener('change', renderStudents);
  document.getElementById('studentPaymentFilter').addEventListener('change', renderStudents);
  document.getElementById('paymentMonth').addEventListener('change', renderPayments);
  document.getElementById('paymentSearch').addEventListener('input', renderPaymentsLater);
  document.getElementById('paymentStatusFilter').addEventListener('change', renderPayments);
  document.getElementById('actionSearch')?.addEventListener('input', renderActionsLater);
  document.getElementById('actionActorFilter')?.addEventListener('change', renderActions);
  document.getElementById('classDateFilter').addEventListener('change', renderClasses);
  document.getElementById('classTypeFilter').addEventListener('change', renderClasses);
  document.getElementById('classStatusFilter').addEventListener('change', renderClasses);
  document.getElementById('classStudentSearch')?.addEventListener('input', renderClassChecklistLater);
  document.getElementById('waitStatusFilter').addEventListener('change', renderWaitlist);
  document.getElementById('studentPlan').addEventListener('change', (event) => {
    const plan = planById(event.target.value);
    if (plan) document.getElementById('studentFee').value = plan.preco || '';
  });
  document.getElementById('themeBtn').addEventListener('click', toggleTheme);
  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('classStudentChecklist')?.addEventListener('change', (event) => {
    const target = event.target.closest('[data-class-student-check]');
    if (!target) return;
    toggleClassStudent(target.value, target.checked);
  });
  document.body.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action],[data-report-student],[data-edit-student],[data-sync-student],[data-edit-class],[data-duplicate-class],[data-class-status],[data-copy-class],[data-copy-report],[data-edit-plan],[data-attendance],[data-toggle-attendance],[data-pay],[data-copy-charge],[data-edit-wait],[data-wait-status],[data-convert-wait],[data-remove-extra],[data-class-day],[data-more-page],[data-more-action],[data-booking-action]');
    if (!target) return;
    if (target.dataset.action && !target.closest('#quickActions')) handleQuickAction(target.dataset.action);
    if (target.dataset.morePage) setPage(target.dataset.morePage);
    if (target.dataset.moreAction === 'theme') toggleTheme();
    if (target.dataset.moreAction === 'logout') logout();
    if (target.dataset.reportStudent) openStudentReport(target.dataset.reportStudent);
    if (target.dataset.editStudent) openStudent(target.dataset.editStudent);
    if (target.dataset.syncStudent) syncStudentScheduleAction(target.dataset.syncStudent).catch((err) => toast(err.message));
    if (target.dataset.editClass) openClass(target.dataset.editClass);
    if (target.dataset.duplicateClass) duplicateClass(target.dataset.duplicateClass).catch((err) => toast(err.message));
    if (target.dataset.classStatus) {
      const [id, status] = target.dataset.classStatus.split(':');
      updateClassStatus(id, status).catch((err) => toast(err.message));
    }
    if (target.dataset.copyClass) copyClassRoster(target.dataset.copyClass).catch((err) => toast(err.message));
    if (target.dataset.copyReport) copyMonthlyReport().catch((err) => toast(err.message));
    if (target.dataset.editPlan) openPlan(target.dataset.editPlan);
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
    if (target.dataset.waitStatus) {
      const [id, status] = target.dataset.waitStatus.split(':');
      updateWaitStatus(id, status).catch((err) => toast(err.message));
    }
    if (target.dataset.convertWait) convertWait(target.dataset.convertWait);
    if (target.dataset.bookingAction) {
      const [id, action] = target.dataset.bookingAction.split(':');
      respondBooking(id, action).catch((err) => toast(err.message));
    }
  });
}

if (localStorage.getItem('fv_visual_theme_version') !== VISUAL_THEME_VERSION) {
  localStorage.setItem('fv_theme', 'light');
  localStorage.setItem('fv_visual_theme_version', VISUAL_THEME_VERSION);
}
document.documentElement.dataset.theme = localStorage.getItem('fv_theme') || 'light';
updatePerformanceMode();
updateThemeButton();
bindEvents();
window.addEventListener('resize', updatePerformanceMode);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) refreshActions({ force: true }).catch(() => {});
});
window.addEventListener('storage', (event) => {
  if (event.key === STORE_KEY) syncLocalStateFromStorage();
});
startActionRefresh();
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./service-worker.js?v=20260611-flow40', { scope: './' }).catch(() => {});
}
if (localStorage.getItem(PIN_KEY)) {
  showBooking(false);
  loadData().catch((err) => {
    if (/PIN|401/.test(err.message)) {
      localStorage.removeItem(PIN_KEY);
      showBooking(true);
      showLogin(false);
      return;
    }
    const modeStatus = document.getElementById('modeStatus');
    if (modeStatus) modeStatus.textContent = 'Local no navegador';
    apiMode = false;
    updateSystemNotice();
    toast(err.message);
    render();
  });
} else {
  showLogin(false);
  showBooking(true);
  updateSystemNotice();
}
