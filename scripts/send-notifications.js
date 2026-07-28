// Robô de notificações push (OneSignal) do itsbrendacleto.
// Roda periodicamente via GitHub Actions (.github/workflows/notifications.yml).
//
// 4 lembretes:
//   1. Aula em 1h (aluno)
//   2. Prática — 3 dias sem atividade (aluno)
//   3. Relatório de aula pendente (professora)
//   4. Relatório mensal pendente, a partir do dia 10 (professora)

const SUPABASE_URL = 'https://vbqumpzlxseakvmyvkem.supabase.co';
const ONESIGNAL_APP_ID = '58dbb455-e1d0-4871-9919-bdf37b56aafe';

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;
const DRY_RUN = process.env.DRY_RUN === 'true';

if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('Faltando SUPABASE_SERVICE_ROLE_KEY');
if (!ONESIGNAL_REST_API_KEY) throw new Error('Faltando ONESIGNAL_REST_API_KEY');

const TZ = 'America/Sao_Paulo';

function nowParts() {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });
  const parts = {};
  for (const p of fmt.formatToParts(new Date())) parts[p.type] = p.value;
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}:${parts.second}`,
    day: Number(parts.day),
    year: Number(parts.year),
    month: Number(parts.month)
  };
}

function minutesUntil(dateStr, timeStr, todayStr, nowTimeStr) {
  if (dateStr !== todayStr) return null;
  const [h1, m1] = nowTimeStr.split(':').map(Number);
  const [h2, m2] = timeStr.split(':').map(Number);
  return (h2 * 60 + m2) - (h1 * 60 + m1);
}

function daysBetween(isoA, isoB) {
  return (new Date(isoB) - new Date(isoA)) / 86400000;
}

function dateNDaysBefore(dateStr, n) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

async function sb(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': opts.method === 'PATCH' ? 'return=minimal' : 'return=representation',
      ...(opts.headers || {})
    }
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Supabase ${opts.method || 'GET'} ${path} -> ${res.status}: ${body}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function sendPush(externalIds, heading, content) {
  if (!externalIds.length) return;
  const payload = {
    app_id: ONESIGNAL_APP_ID,
    target_channel: 'push',
    include_aliases: { external_id: externalIds },
    headings: { en: heading },
    contents: { en: content }
  };
  if (DRY_RUN) {
    console.log('[DRY_RUN] enviaria push pra', externalIds, '->', heading, '|', content);
    return;
  }
  const res = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
    },
    body: JSON.stringify(payload)
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`OneSignal -> ${res.status}: ${body}`);
  console.log('push enviado pra', externalIds.length, 'destinatário(s):', heading);
}

// ─── 1. Lembrete de aula em 1h (aluno) ──────────────────────────────────
async function classReminders(now) {
  const logs = await sb(
    `class_logs?select=id,student_id,turma_id,class_date,start_time&status=eq.pendente&reminder_sent_at=is.null&class_date=eq.${now.date}`
  );
  const due = logs.filter((l) => {
    const mins = minutesUntil(l.class_date, l.start_time, now.date, now.time);
    return mins !== null && mins > 0 && mins <= 60;
  });
  for (const log of due) {
    let studentIds = [];
    if (log.student_id) {
      studentIds = [log.student_id];
    } else if (log.turma_id) {
      const members = await sb(`profiles?select=id&turma_id=eq.${log.turma_id}`);
      studentIds = members.map((m) => m.id);
    }
    if (studentIds.length) {
      await sendPush(studentIds, 'Aula em 1 hora! 📚', `Sua aula de inglês começa às ${log.start_time.slice(0, 5)}. Até já!`);
    }
    if (!DRY_RUN) {
      await sb(`class_logs?id=eq.${log.id}`, { method: 'PATCH', body: JSON.stringify({ reminder_sent_at: new Date().toISOString() }) });
    }
  }
  return due.length;
}

// ─── 2. Lembrete de prática — 3 dias sem atividade (aluno) ──────────────
async function practiceNudges(now) {
  const students = await sb(`profiles?select=id,created_at,last_practice_nudge_at&role=in.(adulto,kids)`);
  const progress = await sb(`lesson_progress?select=user_id,completed_at&order=completed_at.desc`);
  const lastActivity = {};
  for (const p of progress) {
    if (!lastActivity[p.user_id]) lastActivity[p.user_id] = p.completed_at;
  }
  const nowIso = new Date().toISOString();
  let sent = 0;
  for (const s of students) {
    const reference = lastActivity[s.id] || s.created_at;
    if (!reference) continue;
    if (daysBetween(reference, nowIso) < 3) continue;
    if (s.last_practice_nudge_at && daysBetween(s.last_practice_nudge_at, nowIso) < 3) continue;
    await sendPush([s.id], 'Hora de praticar! 📖', 'Já faz alguns dias que você não pratica inglês por aqui. Que tal um exercício rapidinho hoje?');
    if (!DRY_RUN) {
      await sb(`profiles?id=eq.${s.id}`, { method: 'PATCH', body: JSON.stringify({ last_practice_nudge_at: nowIso }) });
    }
    sent++;
  }
  return sent;
}

// ─── 3. Relatório de aula pendente (professora) ─────────────────────────
const REPORT_LOOKBACK_DAYS = 7;
const MAX_DATES_IN_MESSAGE = 5;

async function classReportReminders(now) {
  const sinceDate = dateNDaysBefore(now.date, REPORT_LOOKBACK_DAYS);
  const logs = await sb(
    `class_logs?select=id,class_date,created_by&status=eq.realizada&report_reminder_sent_at=is.null&class_date=lt.${now.date}&class_date=gte.${sinceDate}`
  );
  if (!logs.length) return 0;
  const ids = logs.map((l) => l.id).join(',');
  const reports = await sb(`reports?select=class_log_id&class_log_id=in.(${ids})`);
  const hasReport = new Set(reports.map((r) => r.class_log_id));
  const missing = logs.filter((l) => !hasReport.has(l.id));
  if (!missing.length) return 0;

  const byTeacher = {};
  for (const l of missing) {
    (byTeacher[l.created_by] = byTeacher[l.created_by] || []).push(l);
  }
  const nowIso = new Date().toISOString();
  for (const [teacherId, teacherLogs] of Object.entries(byTeacher)) {
    const shown = teacherLogs.slice(0, MAX_DATES_IN_MESSAGE).map((l) => l.class_date).join(', ');
    const extra = teacherLogs.length - MAX_DATES_IN_MESSAGE;
    const dates = extra > 0 ? `${shown} e mais ${extra}` : shown;
    const msg = teacherLogs.length === 1
      ? `A aula de ${dates} ainda está sem relatório.`
      : `${teacherLogs.length} aulas ainda estão sem relatório: ${dates}.`;
    await sendPush([teacherId], 'Relatório de aula pendente 📝', msg);
    if (!DRY_RUN) {
      const doneIds = teacherLogs.map((l) => l.id).join(',');
      await sb(`class_logs?id=in.(${doneIds})`, { method: 'PATCH', body: JSON.stringify({ report_reminder_sent_at: nowIso }) });
    }
  }
  return missing.length;
}

// ─── 4. Relatório mensal pendente, a partir do dia 10 (professora) ──────
async function monthlyReportReminders(now) {
  if (now.day < 10) return 0;
  const teachers = await sb(`profiles?select=id,last_monthly_report_reminder_at&role=eq.professora`);
  const monthStart = `${now.year}-${String(now.month).padStart(2, '0')}-01`;
  const nowIso = new Date().toISOString();
  let sent = 0;
  for (const t of teachers) {
    if (t.last_monthly_report_reminder_at) {
      const lastDate = t.last_monthly_report_reminder_at.slice(0, 10);
      if (lastDate === now.date) continue; // já avisado hoje
    }
    const reports = await sb(`reports?select=id&created_by=eq.${t.id}&class_log_id=is.null&created_at=gte.${monthStart}`);
    if (reports.length) continue;
    const diasRestantes = Math.max(0, 15 - now.day);
    const msg = diasRestantes > 0
      ? `Faltam ${diasRestantes} dia(s) pra entregar o relatório mensal (até dia 15).`
      : 'O prazo do relatório mensal (dia 15) já passou — não esqueça de preencher!';
    await sendPush([t.id], 'Relatório mensal pendente 🗓️', msg);
    if (!DRY_RUN) {
      await sb(`profiles?id=eq.${t.id}`, { method: 'PATCH', body: JSON.stringify({ last_monthly_report_reminder_at: nowIso }) });
    }
    sent++;
  }
  return sent;
}

// ─── Envio de teste avulso (não mexe em nenhum dos 4 lembretes reais) ───
async function sendTestPush(email) {
  const rows = await sb(`profiles?select=id,full_name&email=eq.${encodeURIComponent(email)}`);
  if (!rows.length) {
    console.log(`Nenhum perfil encontrado com o e-mail ${email}`);
    return;
  }
  await sendPush([rows[0].id], 'Teste de notificação 🔔', 'Se você recebeu essa mensagem, as notificações do itsbrendacleto estão funcionando!');
  console.log(`Teste enviado pra ${rows[0].full_name || email}`);
}

async function main() {
  const testEmail = process.env.TEST_EMAIL;
  if (testEmail) {
    await sendTestPush(testEmail);
    return;
  }

  const now = nowParts();
  console.log(`Rodando notificações às ${now.date} ${now.time} (America/Sao_Paulo)${DRY_RUN ? ' [DRY_RUN]' : ''}`);

  const results = {};
  results.classReminders = await classReminders(now);
  results.practiceNudges = await practiceNudges(now);
  results.classReportReminders = await classReportReminders(now);
  results.monthlyReportReminders = await monthlyReportReminders(now);

  console.log('Resumo:', JSON.stringify(results));
}

main().catch((err) => {
  console.error('Erro no robô de notificações:', err);
  process.exit(1);
});
