-- Clear to Speak — Aviation English Training
-- Diagnostic assessment form (Mission 00 e futuras missões)
--
-- Rode este arquivo inteiro UMA VEZ no SQL Editor do Supabase
-- (dashboard do projeto > SQL Editor > New query > colar > Run).
-- Depois disso o formulário em avaliacao-pilotos-mission00.html já
-- consegue salvar e ler avaliações normalmente.

create table if not exists aviation_assessments (
  id uuid primary key default gen_random_uuid(),

  -- Vínculo com o aluno avaliado e a professora responsável
  student_id uuid not null references profiles(id) on delete cascade,
  teacher_id uuid not null references profiles(id),
  teacher_name text,

  -- Identificação da avaliação
  assessment_date date not null default current_date,
  mission text not null default 'Mission 00 — Diagnostic Flight Check',
  program text not null default 'Clear to Speak — Aviation English Training',

  -- As 6 competências ICAO: nível (1 a 6, ou null = "Not assessed"),
  -- anotações e exemplos concretos de fala/compreensão do aluno
  pronunciation_level smallint check (pronunciation_level between 1 and 6),
  pronunciation_notes text,
  pronunciation_examples text,

  structure_level smallint check (structure_level between 1 and 6),
  structure_notes text,
  structure_examples text,

  vocabulary_level smallint check (vocabulary_level between 1 and 6),
  vocabulary_notes text,
  vocabulary_examples text,

  fluency_level smallint check (fluency_level between 1 and 6),
  fluency_notes text,
  fluency_examples text,

  comprehension_level smallint check (comprehension_level between 1 and 6),
  comprehension_notes text,
  comprehension_examples text,

  interactions_level smallint check (interactions_level between 1 and 6),
  interactions_notes text,
  interactions_examples text,

  -- Observações por bloco de atividade da Mission 00 (chave = slug do
  -- bloco, valor = texto). Ex.: {"meet_the_pilot": "...", "listen_understand": "..."}
  activity_notes jsonb not null default '{}'::jsonb,

  -- Síntese diagnóstica final
  current_profile text,
  strengths text,
  areas_for_development text,
  recommended_priorities text,
  additional_notes text,

  -- Estimativa diagnóstica interna opcional, explicitamente não-oficial
  -- (nunca é uma certificação ICAO nem calculada automaticamente)
  internal_estimate text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists aviation_assessments_student_id_idx on aviation_assessments(student_id);
create index if not exists aviation_assessments_teacher_id_idx on aviation_assessments(teacher_id);

-- Mantém updated_at em dia a cada edição futura
create or replace function aviation_assessments_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists aviation_assessments_updated_at on aviation_assessments;
create trigger aviation_assessments_updated_at
  before update on aviation_assessments
  for each row execute function aviation_assessments_set_updated_at();

-- RLS: só contas com profiles.role = 'professora' enxergam ou gravam
-- qualquer linha dessa tabela. Alunos (role 'kids'/'adulto') e
-- responsáveis nunca têm acesso direto às anotações pedagógicas da
-- professora — a visualização pro aluno, se um dia existir, precisa
-- passar por uma tela própria que exponha só o que fizer sentido mostrar.
alter table aviation_assessments enable row level security;

drop policy if exists "Professoras leem avaliações de aviação" on aviation_assessments;
create policy "Professoras leem avaliações de aviação"
  on aviation_assessments for select
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'professora')
  );

drop policy if exists "Professoras criam avaliações de aviação" on aviation_assessments;
create policy "Professoras criam avaliações de aviação"
  on aviation_assessments for insert
  with check (
    teacher_id = auth.uid()
    and exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'professora')
  );

drop policy if exists "Professoras editam as próprias avaliações de aviação" on aviation_assessments;
create policy "Professoras editam as próprias avaliações de aviação"
  on aviation_assessments for update
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

-- Sem política de delete: ninguém apaga avaliação pelo cliente (fica só
-- leitura/criação/edição da própria professora que lançou).
