// Corrige a data de início de contrato de um aluno quando foi digitada errada
// (ex: ano trocado). Uso: workflow_dispatch com inputs student_query
// (nome ou e-mail) e new_contract_start (formato YYYY-MM-DD).

const SUPABASE_URL = 'https://vbqumpzlxseakvmyvkem.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STUDENT_QUERY = process.env.STUDENT_QUERY;
const NEW_CONTRACT_START = process.env.NEW_CONTRACT_START;

if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('Faltando SUPABASE_SERVICE_ROLE_KEY');
if (!STUDENT_QUERY) throw new Error('Faltando STUDENT_QUERY (nome ou e-mail)');
if (!/^\d{4}-\d{2}-\d{2}$/.test(NEW_CONTRACT_START || '')) throw new Error('NEW_CONTRACT_START precisa estar no formato YYYY-MM-DD');

async function sb(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {})
    }
  });
  if (!res.ok) throw new Error(`Supabase ${opts.method || 'GET'} ${path} -> ${res.status}: ${await res.text()}`);
  if (res.status === 204) return null;
  return res.json();
}

async function main() {
  const isEmail = STUDENT_QUERY.includes('@');
  const filter = isEmail
    ? `email=eq.${encodeURIComponent(STUDENT_QUERY)}`
    : `full_name=ilike.*${encodeURIComponent(STUDENT_QUERY)}*`;
  const matches = await sb(`profiles?select=id,full_name,contract_start&${filter}`);

  if (matches.length === 0) {
    console.log(`Nenhum perfil encontrado pra "${STUDENT_QUERY}".`);
    return;
  }
  if (matches.length > 1) {
    console.log(`Mais de um perfil encontrado, seja mais específico:`);
    matches.forEach((m) => console.log(`- ${m.full_name} id=${m.id}`));
    return;
  }

  const student = matches[0];
  console.log(`Encontrado: ${student.full_name} id=${student.id}`);
  console.log(`contract_start atual: ${student.contract_start}`);

  await sb(`profiles?id=eq.${student.id}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ contract_start: NEW_CONTRACT_START })
  });
  console.log(`contract_start atualizado pra ${NEW_CONTRACT_START}.`);
}

main().catch((err) => {
  console.error('Erro:', err);
  process.exit(1);
});
