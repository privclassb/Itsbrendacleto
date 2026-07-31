// Corrige o e-mail de login (auth) de um usuário quando foi cadastrado errado.
// Uso: workflow_dispatch com inputs student_name (ou email atual) e new_email.
// Precisa da service_role key (bypassa RLS e tem acesso à Auth admin API).

const SUPABASE_URL = 'https://vbqumpzlxseakvmyvkem.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const STUDENT_QUERY = process.env.STUDENT_QUERY;
const NEW_EMAIL = process.env.NEW_EMAIL;

if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('Faltando SUPABASE_SERVICE_ROLE_KEY');
if (!STUDENT_QUERY) throw new Error('Faltando STUDENT_QUERY (nome ou e-mail atual)');
if (!NEW_EMAIL) throw new Error('Faltando NEW_EMAIL');

async function sb(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {})
    }
  });
  if (!res.ok) throw new Error(`Supabase ${opts.method || 'GET'} ${path} -> ${res.status}: ${await res.text()}`);
  return res.json();
}

async function main() {
  const isEmail = STUDENT_QUERY.includes('@');
  const filter = isEmail
    ? `email=eq.${encodeURIComponent(STUDENT_QUERY)}`
    : `full_name=ilike.*${encodeURIComponent(STUDENT_QUERY)}*`;
  const matches = await sb(`profiles?select=id,full_name,email,role&${filter}`);

  if (matches.length === 0) {
    console.log(`Nenhum perfil encontrado pra "${STUDENT_QUERY}".`);
    return;
  }
  if (matches.length > 1) {
    console.log(`Mais de um perfil encontrado, seja mais específico:`);
    matches.forEach((m) => console.log(`- ${m.full_name} (${m.email}) [${m.role}] id=${m.id}`));
    return;
  }

  const student = matches[0];
  console.log(`Encontrado: ${student.full_name} (${student.email}) [${student.role}] id=${student.id}`);

  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${student.id}`, {
    method: 'PUT',
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email: NEW_EMAIL, email_confirm: true })
  });
  const authBody = await authRes.text();
  if (!authRes.ok) throw new Error(`Auth admin update -> ${authRes.status}: ${authBody}`);
  console.log('E-mail de login (auth) atualizado com sucesso.');

  await sb(`profiles?id=eq.${student.id}`, {
    method: 'PATCH',
    headers: { 'Prefer': 'return=minimal' },
    body: JSON.stringify({ email: NEW_EMAIL })
  });
  console.log(`E-mail do perfil também atualizado pra ${NEW_EMAIL}.`);
  console.log(`Pronto! ${student.full_name} já pode usar "Esqueci minha senha" com o e-mail novo.`);
}

main().catch((err) => {
  console.error('Erro:', err);
  process.exit(1);
});
