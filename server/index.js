const express = require('express');
const cors = require('cors');
const path = require('node:path');
const fs = require('node:fs');
const {
  DATA_TABLES,
  DB_PATH,
  deleteRow,
  insertRow,
  logAction,
  publicState,
  restoreState,
  row,
  rows,
  run,
  stateSnapshot,
  tableColumns,
  tableResponse,
  updateRow
} = require('./db');

const app = express();
const PORT = Number(process.env.PORT || 3020);
const ROOT_DIR = path.resolve(__dirname, '..');
const BACKUPS_DIR = process.env.BACKUPS_DIR || path.join(ROOT_DIR, 'backups');
const ADMIN_PIN = String(process.env.ADMIN_PIN || '1234');
const AUTO_BACKUP_ON_START = String(process.env.AUTO_BACKUP_ON_START || 'true') !== 'false';
const AUTO_BACKUP_INTERVAL_HOURS = Number(process.env.AUTO_BACKUP_INTERVAL_HOURS || 0);
const BACKUP_RETENTION = Math.max(1, Number(process.env.BACKUP_RETENTION || 30));

app.use(cors());
app.use(express.json({ limit: '8mb' }));
app.use(express.static(ROOT_DIR));

function jsonError(res, err, fallback = 400) {
  return res.status(err.status || fallback).json({ ok: false, error: err.message || String(err) });
}

function moneyNumber(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addMonthsIso(dateIso, months = 1) {
  const date = dateIso ? new Date(`${dateIso}T12:00:00`) : new Date();
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function dueDateForMonth(student = {}, month = currentMonth()) {
  const [year, monthNumber] = String(month || currentMonth()).slice(0, 7).split('-').map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  const dueDay = Math.min(31, Math.max(1, Number(student.dia_vencimento || 10) || 10));
  return `${year}-${String(monthNumber).padStart(2, '0')}-${String(Math.min(dueDay, lastDay)).padStart(2, '0')}`;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function backupStamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function createBackup(prefix = 'backup_manual') {
  ensureDir(BACKUPS_DIR);
  const filename = `${prefix}_${backupStamp()}.json`;
  const snapshot = stateSnapshot({ includeLogs: true });
  fs.writeFileSync(path.join(BACKUPS_DIR, filename), JSON.stringify(snapshot, null, 2), 'utf8');
  pruneBackups();
  return { filename, snapshot };
}

function listBackups() {
  ensureDir(BACKUPS_DIR);
  return fs.readdirSync(BACKUPS_DIR)
    .filter((filename) => filename.endsWith('.json') && filename.startsWith('backup_'))
    .map((filename) => {
      const fullPath = path.join(BACKUPS_DIR, filename);
      const stat = fs.statSync(fullPath);
      return {
        filename,
        size: stat.size,
        created_at: stat.mtime.toISOString()
      };
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

function pruneBackups() {
  const backups = listBackups();
  backups.slice(BACKUP_RETENTION).forEach((backup) => {
    fs.unlinkSync(path.join(BACKUPS_DIR, backup.filename));
  });
}

function scheduleAutomaticBackups() {
  if (AUTO_BACKUP_ON_START) {
    try {
      const backup = createBackup('backup_startup');
      console.log(`Backup inicial criado: ${backup.filename}`);
    } catch (err) {
      console.warn(`Falha ao criar backup inicial: ${err.message}`);
    }
  }
  if (AUTO_BACKUP_INTERVAL_HOURS > 0) {
    const ms = AUTO_BACKUP_INTERVAL_HOURS * 60 * 60 * 1000;
    setInterval(() => {
      try {
        const backup = createBackup('backup_auto');
        console.log(`Backup automatico criado: ${backup.filename}`);
      } catch (err) {
        console.warn(`Falha no backup automatico: ${err.message}`);
      }
    }, ms).unref();
  }
}

function requirePin(req, res, next) {
  if (!req.path.startsWith('/api/')) return next();
  if (req.path === '/api/login') return next();
  const pin = String(req.get('x-admin-pin') || '');
  if (pin !== ADMIN_PIN) return res.status(401).json({ ok: false, error: 'PIN invalido' });
  return next();
}

app.use(requirePin);

function normalizeStudentPayload(body = {}) {
  const plan = body.plano_id ? row('SELECT * FROM planos WHERE id=?', [body.plano_id]) : null;
  return {
    nome: String(body.nome || body.name || '').trim(),
    telefone: String(body.telefone || body.phone || '').trim(),
    email: String(body.email || '').trim(),
    plano_id: plan?.id || body.plano_id || null,
    plano_nome: plan?.nome || body.plano_nome || body.plan || '',
    mensalidade: moneyNumber(plan?.preco ?? body.mensalidade ?? body.fee),
    dia_vencimento: Math.min(31, Math.max(1, Number(body.dia_vencimento || body.vencimento_dia || body.dueDay || 10) || 10)),
    status: String(body.status || 'Ativo'),
    nivel: String(body.nivel || body.level || 'Iniciante'),
    dia_fixo: String(body.dia_fixo ?? body.fixedDay ?? ''),
    horario_fixo: String(body.horario_fixo || body.fixedTime || '').slice(0, 5),
    turma_fixa: String(body.turma_fixa || body.fixedGroup || '').trim(),
    observacao: String(body.observacao || body.note || ''),
    pago_ate: String(body.pago_ate || body.paidUntil || '')
  };
}

function normalizeClassPayload(body = {}) {
  const plan = body.plano_id ? row('SELECT * FROM planos WHERE id=?', [body.plano_id]) : null;
  const extras = body.extra_presentes ?? body.extras ?? [];
  return {
    data: String(body.data || body.date || today()).slice(0, 10),
    horario: String(body.horario || body.time || '18:30').slice(0, 5),
    turma: String(body.turma || body.group || '').trim(),
    tipo: String(body.tipo || body.tipo_aula || body.type || 'Regular'),
    professor: String(body.professor || body.coach || '').trim(),
    plano_id: plan?.id || body.plano_id || null,
    plano_nome: plan?.nome || body.plano_nome || '',
    capacidade: Number(body.capacidade || body.capacity || 8),
    status: String(body.status || 'Marcada'),
    valor_avulso: moneyNumber(body.valor_avulso),
    extras: typeof extras === 'string' ? extras : JSON.stringify(extras),
    observacao: String(body.observacao || body.note || '')
  };
}

function classWithStudents(item) {
  const students = rows(`
    SELECT aa.*, a.nome, a.telefone, a.plano_nome, a.status
    FROM aula_alunos aa
    JOIN alunos a ON a.id=aa.aluno_id
    WHERE aa.aula_id=?
    ORDER BY a.nome
  `, [item.id]);
  return {
    ...item,
    alunos: students,
    aluno_ids: students.map((student) => student.aluno_id),
    extra_presentes: parseJsonList(item.extras),
    presencas: students.reduce((acc, student) => ({ ...acc, [student.aluno_id]: Number(student.presente || 0) === 1 }), {})
  };
}

function parseJsonList(value) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function upsertClassStudents(classId, studentIds = [], attendance = {}) {
  const cleanIds = [...new Set(studentIds.map(Number).filter(Boolean))];
  rows('SELECT aluno_id FROM aula_alunos WHERE aula_id=?', [classId]).forEach((item) => {
    if (!cleanIds.includes(Number(item.aluno_id))) run('DELETE FROM aula_alunos WHERE aula_id=? AND aluno_id=?', [classId, item.aluno_id]);
  });
  cleanIds.forEach((studentId) => {
    const present = attendance[String(studentId)] || attendance[studentId] ? 1 : 0;
    run('INSERT OR IGNORE INTO aula_alunos (aula_id, aluno_id, presente) VALUES (?, ?, ?)', [classId, studentId, present]);
  });
}

app.get('/', (_req, res) => res.sendFile(path.join(ROOT_DIR, 'index.html')));
app.get('/health', (_req, res) => res.json(publicState(stateSnapshot({ includeLogs: false }))));
app.post('/api/login', (req, res) => {
  if (String(req.body.pin || '') !== ADMIN_PIN) return jsonError(res, new Error('PIN invalido'), 401);
  return res.json({ ok: true });
});
app.get('/api/state', (_req, res) => res.json({ ok: true, state: stateSnapshot({ includeLogs: true }) }));
app.post('/api/sync', (_req, res) => res.json({ ok: true, state: stateSnapshot({ includeLogs: true }) }));
app.get('/api/backup.json', (_req, res) => res.json(stateSnapshot({ includeLogs: true })));

app.post('/api/backups/create', (_req, res) => {
  try {
    const backup = createBackup();
    res.json({ ok: true, filename: backup.filename, backups: listBackups() });
  } catch (err) {
    jsonError(res, err, 500);
  }
});

app.get('/api/backups', (_req, res) => {
  try {
    res.json({ ok: true, retention: BACKUP_RETENTION, items: listBackups() });
  } catch (err) {
    jsonError(res, err, 500);
  }
});

app.get('/api/backups/:filename', (req, res) => {
  try {
    const filename = path.basename(req.params.filename || '');
    if (!filename.endsWith('.json') || !filename.startsWith('backup_')) {
      const err = new Error('Backup invalido');
      err.status = 400;
      throw err;
    }
    const fullPath = path.join(BACKUPS_DIR, filename);
    if (!fs.existsSync(fullPath)) {
      const err = new Error('Backup nao encontrado');
      err.status = 404;
      throw err;
    }
    res.download(fullPath);
  } catch (err) {
    jsonError(res, err, 500);
  }
});

app.post('/api/import', (req, res) => {
  try {
    res.json(restoreState(req.body, req.query.mode || req.body.mode || 'merge'));
  } catch (err) {
    jsonError(res, err);
  }
});

app.get('/api/dashboard', (req, res) => {
  const date = String(req.query.date || today()).slice(0, 10);
  const month = String(req.query.month || currentMonth()).slice(0, 7);
  const classes = rows('SELECT * FROM aulas WHERE data=? ORDER BY horario, turma', [date]).map(classWithStudents);
  const pending = rows("SELECT * FROM alunos WHERE COALESCE(status, 'Ativo') != 'Pausado' AND (pago_ate IS NULL OR pago_ate < ?) ORDER BY nome", [today()]);
  const paid = row("SELECT COALESCE(SUM(valor), 0) AS total FROM pagamentos WHERE status='PAGO' AND pago_em LIKE ?", [`${month}%`])?.total || 0;
  const activeStudents = row("SELECT COUNT(*) AS total FROM alunos WHERE COALESCE(status, 'Ativo')='Ativo'")?.total || 0;
  res.json({
    ok: true,
    date,
    month,
    aulas: classes,
    pendencias: pending,
    stats: {
      aulas_hoje: classes.length,
      alunos_ativos: activeStudents,
      presencas_hoje: classes.reduce((sum, item) => sum + item.alunos.filter((student) => Number(student.presente) === 1).length, 0),
      pagamentos_pendentes: pending.length,
      faturamento_mes: paid
    }
  });
});

app.get('/api/students', (req, res) => {
  const search = String(req.query.search || '').trim();
  const params = [];
  let sql = 'SELECT * FROM alunos';
  if (search) {
    sql += ' WHERE nome LIKE ? OR telefone LIKE ? OR plano_nome LIKE ? OR nivel LIKE ?';
    params.push(...Array(4).fill(`%${search}%`));
  }
  sql += ' ORDER BY nome';
  res.json({ ok: true, items: rows(sql, params) });
});

app.get('/api/students/:id', (req, res) => {
  const student = row('SELECT * FROM alunos WHERE id=?', [req.params.id]);
  if (!student) return jsonError(res, new Error('Aluno não encontrado'), 404);
  return res.json({ ok: true, item: student });
});

app.post('/api/students', (req, res) => {
  try {
    const payload = normalizeStudentPayload(req.body);
    if (!payload.nome) throw new Error('Informe o nome do aluno');
    const result = insertRow('alunos', payload);
    res.json({ ...result, item: row('SELECT * FROM alunos WHERE id=?', [result.id]) });
  } catch (err) {
    jsonError(res, err);
  }
});

app.put('/api/students/:id', (req, res) => {
  try {
    const payload = normalizeStudentPayload(req.body);
    if (!payload.nome) throw new Error('Informe o nome do aluno');
    updateRow('alunos', req.params.id, payload);
    res.json({ ok: true, item: row('SELECT * FROM alunos WHERE id=?', [req.params.id]) });
  } catch (err) {
    jsonError(res, err);
  }
});

app.delete('/api/students/:id', (req, res) => {
  try {
    res.json(deleteRow('alunos', req.params.id));
  } catch (err) {
    jsonError(res, err);
  }
});

app.post('/api/students/:id/pay', (req, res) => {
  try {
    const student = row('SELECT * FROM alunos WHERE id=?', [req.params.id]);
    if (!student) throw new Error('Aluno não encontrado');
    const reference = String(req.body.referencia || '').slice(0, 7) || currentMonth();
    const monthDueDate = String(req.body.vencimento || dueDateForMonth(student, reference)).slice(0, 10);
    const paidUntil = student.pago_ate && student.pago_ate > monthDueDate ? student.pago_ate : monthDueDate;
    const value = moneyNumber(req.body.valor ?? student.mensalidade);
    run('UPDATE alunos SET pago_ate=? WHERE id=?', [paidUntil, student.id]);
    run('INSERT INTO pagamentos (aluno_id, referencia, valor, vencimento, pago_em, status, forma_pagamento, observacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
      student.id,
      reference,
      value,
      monthDueDate,
      today(),
      'PAGO',
      req.body.forma_pagamento || 'manual',
      req.body.observacao || 'Mensalidade marcada pelo painel'
    ]);
    logAction('Pagamento', `${student.nome} pago até ${paidUntil}.`);
    res.json({ ok: true, paidUntil, item: row('SELECT * FROM alunos WHERE id=?', [student.id]) });
  } catch (err) {
    jsonError(res, err);
  }
});

app.get('/api/classes', (req, res) => {
  const params = [];
  let sql = 'SELECT * FROM aulas WHERE 1=1';
  if (req.query.date) {
    sql += ' AND data=?';
    params.push(String(req.query.date).slice(0, 10));
  }
  sql += ' ORDER BY data, horario, turma';
  res.json({ ok: true, items: rows(sql, params).map(classWithStudents) });
});

app.post('/api/classes', (req, res) => {
  try {
    const payload = normalizeClassPayload(req.body);
    const studentIds = req.body.aluno_ids || req.body.studentIds || [];
    const result = insertRow('aulas', payload);
    upsertClassStudents(result.id, studentIds, req.body.presencas || req.body.attendance || {});
    res.json({ ok: true, item: classWithStudents(row('SELECT * FROM aulas WHERE id=?', [result.id])) });
  } catch (err) {
    jsonError(res, err);
  }
});

app.put('/api/classes/:id', (req, res) => {
  try {
    const payload = normalizeClassPayload(req.body);
    updateRow('aulas', req.params.id, payload);
    upsertClassStudents(req.params.id, req.body.aluno_ids || req.body.studentIds || [], req.body.presencas || req.body.attendance || {});
    res.json({ ok: true, item: classWithStudents(row('SELECT * FROM aulas WHERE id=?', [req.params.id])) });
  } catch (err) {
    jsonError(res, err);
  }
});

app.delete('/api/classes/:id', (req, res) => {
  try {
    res.json(deleteRow('aulas', req.params.id));
  } catch (err) {
    jsonError(res, err);
  }
});

app.put('/api/classes/:id/attendance', (req, res) => {
  try {
    const classItem = row('SELECT * FROM aulas WHERE id=?', [req.params.id]);
    if (!classItem) throw new Error('Aula não encontrada');
    const attendance = req.body.attendance || req.body.presencas || {};
    Object.entries(attendance).forEach(([studentId, present]) => {
      run('UPDATE aula_alunos SET presente=? WHERE aula_id=? AND aluno_id=?', [present ? 1 : 0, req.params.id, studentId]);
    });
    logAction('Presença', `Presenças atualizadas na aula ${req.params.id}.`);
    res.json({ ok: true, item: classWithStudents(classItem) });
  } catch (err) {
    jsonError(res, err);
  }
});

app.get('/api/plans', (_req, res) => {
  res.json({ ok: true, items: rows('SELECT * FROM planos ORDER BY ativo DESC, preco, nome') });
});

app.get('/api/payments', (req, res) => {
  const month = String(req.query.month || currentMonth()).slice(0, 7);
  const payments = rows('SELECT p.*, a.nome AS aluno_nome FROM pagamentos p LEFT JOIN alunos a ON a.id=p.aluno_id WHERE referencia=? OR pago_em LIKE ? ORDER BY id DESC', [month, `${month}%`]);
  res.json({ ok: true, month, items: payments });
});

app.get('/api/waitlist', (_req, res) => {
  res.json({ ok: true, items: rows('SELECT * FROM lista_espera ORDER BY id DESC') });
});

app.post('/api/waitlist', (req, res) => {
  try {
    const payload = {
      nome: String(req.body.nome || req.body.name || '').trim(),
      telefone: String(req.body.telefone || req.body.phone || '').trim(),
      preferencia: String(req.body.preferencia || '').trim(),
      status: String(req.body.status || 'Novo').trim(),
      observacao: String(req.body.observacao || '').trim(),
      data_cadastro: today()
    };
    if (!payload.nome) throw new Error('Informe o nome');
    const result = insertRow('lista_espera', payload);
    res.json({ ...result, item: row('SELECT * FROM lista_espera WHERE id=?', [result.id]) });
  } catch (err) {
    jsonError(res, err);
  }
});

app.put('/api/waitlist/:id', (req, res) => {
  try {
    const payload = {
      nome: String(req.body.nome || '').trim(),
      telefone: String(req.body.telefone || '').trim(),
      preferencia: String(req.body.preferencia || '').trim(),
      status: String(req.body.status || 'Novo').trim(),
      observacao: String(req.body.observacao || '').trim()
    };
    if (!payload.nome) throw new Error('Informe o nome');
    updateRow('lista_espera', req.params.id, payload);
    res.json({ ok: true, item: row('SELECT * FROM lista_espera WHERE id=?', [req.params.id]) });
  } catch (err) {
    jsonError(res, err);
  }
});

app.delete('/api/waitlist/:id', (req, res) => {
  try {
    res.json(deleteRow('lista_espera', req.params.id));
  } catch (err) {
    jsonError(res, err);
  }
});

app.get('/api/availability', (_req, res) => {
  res.json({ ok: true, items: rows('SELECT * FROM disponibilidade ORDER BY dia') });
});

app.put('/api/availability', (req, res) => {
  try {
    (req.body.items || []).forEach((item) => {
      run('INSERT OR REPLACE INTO disponibilidade (dia, inicio, fim) VALUES (?, ?, ?)', [Number(item.dia), item.inicio, item.fim]);
    });
    logAction('Agenda', 'Disponibilidade atualizada.');
    res.json({ ok: true, items: rows('SELECT * FROM disponibilidade ORDER BY dia') });
  } catch (err) {
    jsonError(res, err);
  }
});

app.get('/api/tables', (_req, res) => {
  res.json({ ok: true, tables: DATA_TABLES.map((table) => ({ table, columns: tableColumns(table) })) });
});

app.get('/api/tables/:table', (req, res) => {
  try {
    res.json(tableResponse(req.params.table, req.query));
  } catch (err) {
    jsonError(res, err);
  }
});

app.post('/api/tables/:table', (req, res) => {
  try {
    res.json(insertRow(req.params.table, req.body));
  } catch (err) {
    jsonError(res, err);
  }
});

app.put('/api/tables/:table/:id', (req, res) => {
  try {
    res.json(updateRow(req.params.table, req.params.id, req.body));
  } catch (err) {
    jsonError(res, err);
  }
});

app.delete('/api/tables/:table/:id', (req, res) => {
  try {
    res.json(deleteRow(req.params.table, req.params.id));
  } catch (err) {
    jsonError(res, err);
  }
});

app.get('/api/db/download', (_req, res) => res.download(DB_PATH));

app.listen(PORT, () => {
  scheduleAutomaticBackups();
  console.log(`Team Lucão Futevôlei rodando em http://localhost:${PORT}`);
});
