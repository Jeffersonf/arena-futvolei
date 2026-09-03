const phoneDigits = (value) => String(value || '').replace(/\D/g, '');
const formatDate = (value) => { const [year, month, day] = String(value || '').slice(0, 10).split('-'); return `${day}/${month}/${year}`; };
const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
const form = document.getElementById('studentFastForm');
const phoneInput = document.getElementById('studentFastPhone');
const status = document.getElementById('studentFastStatus');
const list = document.getElementById('studentFastList');

function render(items) {
  list.innerHTML = items.length ? items.map((item) => {
    const approved = item.confirmado_professor === 'sim';
    const indicated = item.confirmado === 'sim';
    return `<article><div><strong>${formatDate(item.data)} às ${escapeHTML(item.horario)} - ${escapeHTML(item.turma || 'Turma')}</strong><br /><small>${escapeHTML(item.tipo || 'Regular')}</small></div>${approved ? '<span class="done">Confirmado pelo professor</span>' : `<button type="button" data-class-id="${escapeHTML(item.id)}" ${indicated ? 'disabled' : ''}>${indicated ? 'Indicação enviada' : 'Vou'}</button>`}</article>`;
  }).join('') : '<p>Nenhuma aula futura encontrada para este WhatsApp.</p>';
}

async function findClasses(event) {
  event.preventDefault();
  const telefone = phoneInput.value.trim();
  if (phoneDigits(telefone).length < 8) { status.textContent = 'Informe um WhatsApp válido.'; return; }
  status.textContent = 'Buscando...'; list.innerHTML = '';
  try {
    const response = await fetch(`/api/public/student-classes?telefone=${encodeURIComponent(telefone)}`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw new Error(data.error || 'Aluno não encontrado.');
    phoneInput.dataset.phone = telefone;
    render(data.items || []);
    status.textContent = data.items?.length ? 'Toque em “Vou” para indicar presença.' : 'Nenhuma aula futura encontrada.';
  } catch (error) { status.textContent = error.message; }
}

async function indicate(classId, button) {
  button.disabled = true; status.textContent = 'Salvando indicação...';
  try {
    const response = await fetch('/api/public/student-confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ telefone: phoneInput.dataset.phone, aula_id: classId, confirmado: 'sim' }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw new Error(data.error || 'Não foi possível salvar.');
    status.textContent = 'Indicação salva. Aguarde a confirmação do professor.';
    await findClasses({ preventDefault() {} });
  } catch (error) { button.disabled = false; status.textContent = error.message; }
}

form.addEventListener('submit', findClasses);
list.addEventListener('click', (event) => { const button = event.target.closest('[data-class-id]'); if (button) indicate(button.dataset.classId, button); });
