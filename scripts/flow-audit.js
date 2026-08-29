const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.FLOW_AUDIT_PORT || 4322);
const DB_PATH = path.join(ROOT, 'tmp-flow-audit.db');
const PIN = process.env.ADMIN_PIN || '1234';
const BASE = `http://127.0.0.1:${PORT}`;
const todayIso = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).format(new Date());
const addDaysIso = (dateIso, days) => {
  const date = new Date(`${dateIso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};
const auditDate = addDaysIso(todayIso(), 1);
const auditMonth = auditDate.slice(0, 7);

function cleanupDb() {
  [DB_PATH, `${DB_PATH}-shm`, `${DB_PATH}-wal`].forEach((file) => {
    fs.rmSync(file, { force: true });
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(pathname, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.public ? {} : { 'X-Admin-Pin': PIN }),
    ...(options.headers || {})
  };
  const response = await fetch(`${BASE}${pathname}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) {
    throw new Error(`${options.method || 'GET'} ${pathname}: ${data.error || response.statusText}`);
  }
  return data;
}

async function waitForServer(child) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Servidor encerrou cedo com codigo ${child.exitCode}`);
    try {
      await request('/health', { public: true });
      return;
    } catch (_err) {
      await wait(250);
    }
  }
  throw new Error('Servidor nao respondeu no tempo esperado');
}

async function stopServer(child) {
  if (!child || child.exitCode !== null) return;
  await new Promise((resolve) => {
    const timeout = setTimeout(resolve, 3000);
    child.once('exit', () => {
      clearTimeout(timeout);
      resolve();
    });
    child.kill();
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function expectFailure(pathname, options, expected) {
  let failed = false;
  try {
    await request(pathname, options);
  } catch (err) {
    failed = true;
    assert(err.message.includes(expected), `Erro inesperado para ${pathname}: ${err.message}`);
  }
  assert(failed, `Esperava falha para ${pathname}`);
}

async function main() {
  cleanupDb();
  const server = spawn(process.execPath, ['server/index.js'], {
    cwd: ROOT,
    env: {
      ...process.env,
      DB_PATH,
      PORT: String(PORT),
      AUTO_BACKUP_ON_START: 'false'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let serverOutput = '';
  server.stdout.on('data', (chunk) => { serverOutput += chunk; });
  server.stderr.on('data', (chunk) => { serverOutput += chunk; });

  try {
    await waitForServer(server);

    await expectFailure('/api/students', { headers: { 'X-Admin-Pin': '' } }, 'PIN');

    const student = await request('/api/students', {
      method: 'POST',
      body: JSON.stringify({
        nome: 'Fluxo Audit',
        telefone: '(15) 99999-1111',
        email: 'fluxo@audit.test',
        plano_nome: '2x semana',
        mensalidade: 260,
        status: 'Ativo',
        nivel: 'Intermediario',
        dia_fixo: '6',
        horario_fixo: '08:00',
        turma_fixa: 'Audit Sabado'
      })
    });

    const classItem = await request('/api/classes', {
      method: 'POST',
      body: JSON.stringify({
        data: auditDate,
        horario: '08:00',
        turma: 'Audit Sabado',
        professor: 'Lucao',
        tipo: 'Regular',
        capacidade: 8,
        status: 'Marcada',
        aluno_ids: [student.item.id]
      })
    });

    const expiredClass = await request('/api/classes', {
      method: 'POST',
      body: JSON.stringify({
        data: addDaysIso(todayIso(), -1),
        horario: '07:00',
        turma: 'Audit Encerrada',
        professor: 'Lucao',
        tipo: 'Regular',
        capacidade: 8,
        status: 'Marcada'
      })
    });
    const normalizedClass = await request('/api/classes', {
      method: 'POST',
      body: JSON.stringify({
        data: '2026-02-30',
        horario: '99:99',
        turma: 'Audit Validacao',
        capacidade: 999,
        status: 'Marcada'
      })
    });
    assert(normalizedClass.item.data === todayIso(), 'Data invalida nao foi normalizada para o dia operacional');
    assert(normalizedClass.item.horario === '18:30', 'Horario invalido nao recebeu o padrao seguro');
    assert(Number(normalizedClass.item.capacidade) === 30, 'Capacidade nao foi limitada ao teto operacional');
    const fullClass = await request('/api/classes', {
      method: 'POST',
      body: JSON.stringify({
        data: auditDate,
        horario: '09:00',
        turma: 'Audit Lotada',
        professor: 'Lucao',
        tipo: 'Regular',
        capacidade: 1,
        status: 'Marcada',
        aluno_ids: [student.item.id]
      })
    });
    const publicClasses = await request('/api/public/classes', { public: true });
    assert(!publicClasses.items.some((item) => Number(item.id) === Number(expiredClass.item.id)), 'Aula vencida apareceu no acesso publico');
    const publicWait = await request('/api/public/waitlist', {
      public: true,
      method: 'POST',
      body: JSON.stringify({ nome: 'Espera Publica', telefone: '(15) 99999-5555', aula_id: fullClass.item.id })
    });
    assert(Number(publicWait.item.aula_id) === Number(fullClass.item.id), 'Espera publica nao ficou vinculada a aula');
    await expectFailure('/api/public/waitlist', {
      public: true,
      method: 'POST',
      body: JSON.stringify({ nome: 'Espera Duplicada', telefone: '(15) 99999-5555', aula_id: fullClass.item.id })
    }, 'ja esta na espera');
    await expectFailure('/api/public/bookings', {
      public: true,
      method: 'POST',
      body: JSON.stringify({ nome: 'Sem WhatsApp', aula_id: classItem.item.id })
    }, 'WhatsApp');
    await expectFailure('/api/public/bookings', {
      public: true,
      method: 'POST',
      body: JSON.stringify({ nome: 'Pedido vencido', telefone: '(15) 99999-4444', aula_id: expiredClass.item.id })
    }, 'ja passou');

    await request(`/api/classes/${classItem.item.id}/attendance`, {
      method: 'PUT',
      body: JSON.stringify({ attendance: { [student.item.id]: true } })
    });

    await request('/api/public/student-confirm', {
      public: true,
      method: 'POST',
      body: JSON.stringify({
        telefone: '999991111',
        aula_id: classItem.item.id,
        confirmado: 'sim'
      })
    });

    await request(`/api/students/${student.item.id}/pay`, {
      method: 'POST',
      body: JSON.stringify({
        referencia: auditMonth,
        valor: 260,
        forma_pagamento: 'Pix',
        pago_em: auditDate
      })
    });

    const booking = await request('/api/public/bookings', {
      public: true,
      method: 'POST',
      body: JSON.stringify({
        nome: 'Pedido Audit',
        telefone: '(15) 99999-2222',
        aula_id: classItem.item.id,
        observacao: 'Aula experimental'
      })
    });
    await expectFailure('/api/public/bookings', {
      public: true,
      method: 'POST',
      body: JSON.stringify({
        nome: 'Pedido duplicado',
        telefone: '(15) 99999-2222',
        aula_id: classItem.item.id
      })
    }, 'Ja existe');
    await request(`/api/bookings/${booking.item.id}/respond`, {
      method: 'POST',
      body: JSON.stringify({ action: 'approve', force: true })
    });

    const waitItem = await request('/api/waitlist', {
      method: 'POST',
      body: JSON.stringify({
        nome: 'Espera Audit',
        telefone: '(15) 99999-3333',
        preferencia: 'Manha',
        status: 'Novo'
      })
    });
    await request(`/api/waitlist/${waitItem.item.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...waitItem.item,
        status: 'Contatado',
        observacao: 'Chamado no WhatsApp'
      })
    });

    const logs = await request('/api/tables/logs?limit=50');
    const actions = logs.rows.map((item) => `${item.ator}|${item.acao}|${item.detalhe}`);
    const joined = actions.join('\n');

    [
      'Aluno cadastrado',
      'Aula criada',
      'Presenca',
      'Confirmacao aluno',
      'Pagamento',
      'Pedido de aula',
      'Pedido aprovado',
      'Entrada na espera',
      'Interessado cadastrado',
      'Espera atualizada'
    ].forEach((action) => assert(joined.includes(action), `Log ausente: ${action}`));
    assert(!joined.includes('API|'), 'Central contem log tecnico de API');
    assert(actions.some((entry) => entry.startsWith('Aluno|Confirmacao aluno|')), 'Confirmacao do aluno nao ficou atribuida ao aluno');

    const classes = await request('/api/classes');
    const auditedClass = classes.items.find((item) => Number(item.id) === Number(classItem.item.id));
    assert(auditedClass.alunos.some((item) => Number(item.id) === Number(student.item.id) && Number(item.presente) === 1), 'Presenca nao persistiu na aula');

    const payments = await request(`/api/payments?month=${auditMonth}`);
    assert(payments.items.some((item) => Number(item.aluno_id) === Number(student.item.id)), 'Pagamento nao foi registrado');

    console.log(JSON.stringify({
      ok: true,
      logs: logs.rows.length,
      checkedActions: actions.slice(0, 9)
    }, null, 2));
  } catch (err) {
    console.error(serverOutput);
    throw err;
  } finally {
    await stopServer(server);
    cleanupDb();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
