const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
const formatDate = (value) => { const [year, month, day] = String(value || '').slice(0, 10).split('-'); return `${day}/${month}/${year}`; };
const loginForm = document.getElementById('quickLoginForm');
const pinInput = document.getElementById('quickPin');
const status = document.getElementById('status');
const pendingSection = document.getElementById('pendingSection');
const pendingList = document.getElementById('pendingList');
const updatedAt = document.getElementById('updatedAt');
let pin = '';

async function fetchPending() {
  status.textContent = 'Atualizando...';
  const response = await fetch('/api/quick/confirmations', { headers: { 'X-Admin-Pin': pin } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) throw new Error(data.error || 'PIN inválido.');
  const items = data.items || [];
  pendingList.innerHTML = items.length ? items.map((item) => `<article><div><strong>${escapeHTML(item.aluno_nome)}</strong><small>${formatDate(item.data)} às ${escapeHTML(item.horario)} - ${escapeHTML(item.turma || 'Turma')}</small></div><button type="button" data-confirm="${item.aula_id}:${item.aluno_id}">Autorizar</button></article>`).join('') : '<p class="empty">Nenhuma indicação pendente.</p>';
  updatedAt.textContent = `Atualizado às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  status.textContent = '';
}

async function login(event) {
  event.preventDefault(); pin = pinInput.value.trim(); if (!pin) return;
  status.textContent = 'Entrando...';
  try {
    const response = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': pin }, body: JSON.stringify({ pin }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw new Error(data.error || 'PIN inválido.');
    document.getElementById('loginSection').hidden = true; pendingSection.hidden = false; await fetchPending();
  } catch (error) { status.textContent = error.message; }
}

async function confirm(button) {
  const [classId, studentId] = button.dataset.confirm.split(':'); button.disabled = true;
  try {
    const response = await fetch(`/api/classes/${classId}/student-confirmation`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': pin }, body: JSON.stringify({ student_id: studentId, action: 'approve' }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw new Error(data.error || 'Não foi possível autorizar.');
    await fetchPending();
  } catch (error) { button.disabled = false; status.textContent = error.message; }
}

loginForm.addEventListener('submit', login);
document.getElementById('refreshButton').addEventListener('click', () => fetchPending().catch((error) => { status.textContent = error.message; }));
pendingList.addEventListener('click', (event) => { const button = event.target.closest('[data-confirm]'); if (button) confirm(button); });
