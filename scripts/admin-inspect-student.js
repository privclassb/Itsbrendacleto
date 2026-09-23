// Mostra o cadastro completo de um aluno (pra diagnosticar problemas tipo
// "aluno não aparece no checklist de relatórios da professora").
// Uso: workflow_dispatch com input student_query (nome ou e-mail).
// Só leitura, não altera nada.

const SUPABASE_URL = 'https://vbqumpzlxseakvmyvkem.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STUDENT_QUERY = process.env.STUDENT_QUERY;

if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('Faltando SUPABASE_SERVICE_ROLE_KEY');
if (!STUDENT_QUERY) throw new Error('Faltando STUDENT_QUERY (nome ou e-mail)');

async function sb(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    }
  });
  if (!res.ok) throw new Error(`Supabase GET ${path} -> ${res.status}: ${await res.text()}`);
  return res.json();
}

async function main() {
  const isEmail = STUDENT_QUERY.includes('@');
  const filter = isEmail
    ? `email=eq.${encodeURIComponent(STUDENT_QUERY)}`
    : `full_name=ilike.*${encodeURIComponent(STUDENT_QUERY)}*`;
  const matches = await sb(`profiles?select=*&${filter}`);

  if (matches.length === 0) {
    console.log(`Nenhum perfil encontrado pra "${STUDENT_QUERY}".`);
    return;
  }

  for (const s of matches) {
    console.log('----------------------------------------');
    console.log(`Nome: ${s.full_name}`);
    console.log(`id: ${s.id}`);
    console.log(`role: ${s.role}`);
    console.log(`email: ${s.email}`);
    console.log(`active: ${s.active}`);
    console.log(`teacher_id: ${s.teacher_id}`);
    console.log(`contract_start: ${s.contract_start}`);
    console.log(`contract_end: ${s.contract_end}`);
    console.log(`created_at: ${s.created_at}`);

    if (s.teacher_id) {
      const teacher = await sb(`profiles?select=id,full_name,role&id=eq.${s.teacher_id}`);
      if (teacher.length === 0) {
        console.log(`>> teacher_id APONTA PRA UM PERFIL QUE NÃO EXISTE (órfão)`);
      } else {
        console.log(`>> professora vinculada: ${teacher[0].full_name} (role=${teacher[0].role})`);
      }
    } else {
      console.log('>> SEM professora vinculada (teacher_id vazio)');
    }
  }

  console.log('----------------------------------------');
  console.log('Professoras cadastradas:');
  const teachers = await sb(`profiles?select=id,full_name&role=eq.professora&order=full_name`);
  teachers.forEach((t) => console.log(`- ${t.full_name} id=${t.id}`));
}

main().catch((err) => {
  console.error('Erro:', err);
  process.exit(1);
});
