-- =====================================================================
-- BANCO DE DADOS — Igreja Batista Casa Profética (Supabase, plano gratuito)
-- Cole este script em: Supabase → SQL Editor → New query → Run
-- =====================================================================

-- Tabela única com tudo que chega pelos formulários do site
create table if not exists public.envios (
  id         bigint generated always as identity primary key,
  tipo       text        not null check (tipo in ('oracao', 'decisao', 'inscricao', 'celula')),
  dados      jsonb       not null check (pg_column_size(dados) < 8000),  -- evita envios gigantes
  lido       boolean     not null default false,
  criado_em  timestamptz not null default now()
);

create index if not exists envios_criado_em_idx on public.envios (criado_em desc);

-- Segurança por linha (RLS): sem isso a tabela ficaria aberta
alter table public.envios enable row level security;

-- Visitantes do site (chave "anon"): podem APENAS inserir. Não leem, não apagam.
drop policy if exists "visitante insere" on public.envios;
create policy "visitante insere" on public.envios
  for insert to anon
  with check (true);

-- Equipe logada (usuários que VOCÊ cadastrar no painel do Supabase): lê, marca como lido e apaga
drop policy if exists "equipe le" on public.envios;
create policy "equipe le" on public.envios
  for select to authenticated using (true);

drop policy if exists "equipe atualiza" on public.envios;
create policy "equipe atualiza" on public.envios
  for update to authenticated using (true) with check (true);

drop policy if exists "equipe apaga" on public.envios;
create policy "equipe apaga" on public.envios
  for delete to authenticated using (true);

-- IMPORTANTE: em Authentication → Sign In / Providers, DESATIVE "Allow new users to sign up".
-- Assim só entra na equipe quem você adicionar manualmente em Authentication → Users → Add user.
