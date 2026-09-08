const phoneDigits = (value) => String(value || '').replace(/\D/g, '');
const formatDate = (value) => { const [year, month, day] = String(value || '').slice(0, 10).split('-'); return `${day}/${month}/${year}`; };
const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
const form = document.getElementById('studentFastForm');
const phoneInput = document.getElementById('studentFastPhone');
const status = document.getElementById('studentFastStatus');
const list = document.getElementById('studentFastList');
const filters = document.getElementById('studentFastFilters');
const dateFilter = document.getElementById('studentFastDate');
const timeFilter = document.getElementById('studentFastTime');
const submitButton = form.querySelector('button[type="submit"]');
let availableItems = [];

function setStatus(message = '', state = '') {
  status.textContent = message;
  if (state) status.dataset.state = state;
  else delete status.dataset.state;
}

function formatPhone(value) {
  const digits = phoneDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  const split = digits.length === 11 ? 7 : 6;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, split)}-${digits.slice(split)}`;
}

function dateLabel(value) {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
    .format(new Date(String(value) + 'T12:00:00'));
}

function setupFilters(items) {
  availableItems = items;
  if (!items.length) { filters.hidden = true; return; }
  const dates = [...new Set(items.map((item) => item.data))];
  const times = [...new Set(items.map((item) => item.horario))].sort();
  dateFilter.innerHTML = '<option value="">Todas as datas</option>' + dates.map((date) => '<option value="' + escapeHTML(date) + '">' + escapeHTML(dateLabel(date)) + '</option>').join('');
  timeFilter.innerHTML = '<option value="">Todos os horários</option>' + times.map((time) => '<option value="' + escapeHTML(time) + '">' + escapeHTML(time) + '</option>').join('');
  dateFilter.value = '';
  timeFilter.value = '';
  filters.hidden = false;
}

function applyFilters() {
  renderAvailable(availableItems.filter((item) =>
    (!dateFilter.value || item.data === dateFilter.value)
    && (!timeFilter.value || item.horario === timeFilter.value)
  ));
}

function render(items) {
  list.innerHTML = items.length ? items.map((item) => {
    const approved = item.confirmado_professor === 'sim';
    const indicated = item.confirmado === 'sim';
    return `<article><div><strong>${formatDate(item.data)} às ${escapeHTML(item.horario)} - ${escapeHTML(item.turma || 'Turma')}</strong><br /><small>${escapeHTML(item.tipo || 'Regular')}</small></div>${approved ? '<span class="done">Confirmado pelo professor</span>' : `<button type="button" data-class-id="${escapeHTML(item.id)}" ${indicated ? 'disabled' : ''}>${indicated ? 'Indicação enviada' : 'Vou'}</button>`}</article>`;
  }).join('') : '<p>Nenhuma aula futura encontrada para este WhatsApp.</p>';
}

function renderAvailable(items) {
  list.innerHTML = items.length ? `
    <p>Você não tem aula agendada. Escolha um horário regular nesta semana:</p>
    ${items.map((item) => `
      <article>
        <div><strong>${formatDate(item.data)} às ${escapeHTML(item.horario)}</strong><br /><small>${escapeHTML(item.turma || 'Turma')} · ${Math.max(0, Number(item.capacidade || 8) - Number(item.inscritos || 0))} vaga(s) livres</small></div>
        <button type="button" data-book-class-id="${escapeHTML(item.id)}">Escolher horário</button>
      </article>
    `).join('')}
  ` : '<p>Nenhum horário regular com vaga nesta semana.</p>';
}

async function findClasses(event) {
  event.preventDefault();
  const telefone = phoneInput.value.trim();
  if (phoneDigits(telefone).length < 10) { setStatus('Informe um WhatsApp válido com DDD.', 'error'); phoneInput.focus(); return; }
  submitButton.disabled = true;
  submitButton.textContent = 'Buscando...';
  setStatus('Buscando sua agenda...');
  list.innerHTML = '';
  list.setAttribute('aria-busy', 'true');
  try {
    const response = await fetch(`/api/public/student-classes?telefone=${encodeURIComponent(telefone)}`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw new Error(data.error || 'Aluno não encontrado.');
    phoneInput.dataset.phone = telefone;
    const booked = data.items || [];
    phoneInput.dataset.studentName = data.student?.nome || 'Aluno';
    filters.hidden = true;
    render(booked.length ? booked : []);
    if (!booked.length) {
      setupFilters(data.available || []);
      renderAvailable(data.available || []);
    }
    setStatus(data.items?.length ? 'Toque em “Vou” para indicar presença.' : 'Escolha um horário regular com vaga nesta semana.');
  } catch (error) { setStatus(error.message, 'error'); }
  finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Ver minhas aulas';
    list.removeAttribute('aria-busy');
  }
}

async function requestClass(classId, button) {
  button.disabled = true; setStatus('Salvando solicitação...');
  try {
    const response = await fetch('/api/public/bookings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: phoneInput.dataset.studentName || 'Aluno', telefone: phoneInput.dataset.phone, aula_id: classId, observacao: 'Solicitação de horário regular pelo aluno.' })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw new Error(data.error || 'Não foi possível salvar.');
    await findClasses({ preventDefault() {} });
    setStatus('Solicitação salva. Aguarde a confirmação do professor.', 'success');
  } catch (error) { button.disabled = false; setStatus(error.message, 'error'); }
}

async function indicate(classId, button) {
  button.disabled = true; setStatus('Salvando indicação...');
  try {
    const response = await fetch('/api/public/student-confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ telefone: phoneInput.dataset.phone, aula_id: classId, confirmado: 'sim' }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw new Error(data.error || 'Não foi possível salvar.');
    await findClasses({ preventDefault() {} });
    setStatus('Presença indicada. Aguarde a confirmação do professor.', 'success');
  } catch (error) { button.disabled = false; setStatus(error.message, 'error'); }
}

form.addEventListener('submit', findClasses);
phoneInput.addEventListener('input', () => { phoneInput.value = formatPhone(phoneInput.value); });
dateFilter.addEventListener('change', applyFilters);
timeFilter.addEventListener('change', applyFilters);
list.addEventListener('click', (event) => {
  const confirmButton = event.target.closest('[data-class-id]');
  if (confirmButton) return indicate(confirmButton.dataset.classId, confirmButton);
  const bookingButton = event.target.closest('[data-book-class-id]');
  if (bookingButton) requestClass(bookingButton.dataset.bookClassId, bookingButton);
});
