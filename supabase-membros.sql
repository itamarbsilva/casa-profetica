-- =====================================================================
-- ÁREA DE MEMBROS — perfis, 8 papéis, avisos e permissões por papel
-- (rodar DEPOIS do supabase.sql)
-- =====================================================================

-- ---------- PERFIS ----------
create table if not exists public.perfis (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  nome        text not null default '' check (char_length(nome) <= 120),
  telefone    text check (char_length(telefone) <= 30),
  papel       text not null default 'membro' check (papel in (
                'admin','pastor','secretaria','obreiro',
                'lider_ministerio','lider_celula','lider_treinamento','membro')),
  aprovado    boolean not null default false,
  celula      text check (char_length(celula) <= 120),
  ministerio  text check (char_length(ministerio) <= 120),
  criado_em   timestamptz not null default now()
);
alter table public.perfis enable row level security;

-- Cria o perfil automaticamente quando alguém se cadastra (entra como membro, não aprovado)
create or replace function public.criar_perfil_novo_usuario()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.perfis (id, email, nome, telefone)
  values (new.id, new.email,
          left(coalesce(new.raw_user_meta_data->>'nome', ''), 120),
          left(new.raw_user_meta_data->>'telefone', 30))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario after insert on auth.users
  for each row execute function public.criar_perfil_novo_usuario();

-- Papel do usuário logado (só conta se aprovado)
create or replace function public.meu_papel()
returns text language sql stable security definer set search_path = '' as $$
  select papel from public.perfis where id = auth.uid() and aprovado
$$;

create or replace function public.minha_celula()
returns text language sql stable security definer set search_path = '' as $$
  select celula from public.perfis where id = auth.uid() and aprovado
$$;

-- Perfis: cada um vê o seu; admin, pastor e secretaria veem todos
drop policy if exists "ver perfis" on public.perfis;
create policy "ver perfis" on public.perfis for select to authenticated
  using (id = (select auth.uid()) or (select public.meu_papel()) in ('admin','pastor','secretaria'));

-- Cada um edita só nome e telefone do próprio perfil (papel/aprovação só via função do admin)
drop policy if exists "editar meu perfil" on public.perfis;
create policy "editar meu perfil" on public.perfis for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

revoke all on public.perfis from anon, authenticated;
grant select on public.perfis to authenticated;
grant update (nome, telefone) on public.perfis to authenticated;

-- Somente o ADMINISTRADOR define papel, aprovação, célula e ministério
create or replace function public.admin_definir_perfil(
  p_id uuid, p_papel text, p_aprovado boolean, p_celula text default null, p_ministerio text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if public.meu_papel() is distinct from 'admin' then
    raise exception 'Apenas o administrador pode alterar papéis';
  end if;
  if p_id = auth.uid() and (p_papel <> 'admin' or not p_aprovado) then
    raise exception 'Você não pode remover o seu próprio acesso de administrador';
  end if;
  update public.perfis
     set papel = p_papel, aprovado = p_aprovado,
         celula = nullif(trim(p_celula), ''), ministerio = nullif(trim(p_ministerio), '')
   where id = p_id;
end $$;
revoke all on function public.admin_definir_perfil(uuid, text, boolean, text, text) from public, anon;
grant execute on function public.admin_definir_perfil(uuid, text, boolean, text, text) to authenticated;

-- ---------- ENVIOS (formulários do site): leitura por papel ----------
drop policy if exists "equipe le" on public.envios;
drop policy if exists "equipe atualiza" on public.envios;
drop policy if exists "equipe apaga" on public.envios;

create or replace function public.pode_ver_envio(p_tipo text, p_dados jsonb)
returns boolean language sql stable security definer set search_path = '' as $$
  select case public.meu_papel()
    when 'admin'             then true
    when 'pastor'            then true
    when 'secretaria'        then p_tipo in ('inscricao','decisao','celula')
    when 'obreiro'           then p_tipo in ('oracao','decisao')
    when 'lider_ministerio'  then p_tipo = 'inscricao'
    when 'lider_celula'      then p_tipo = 'celula' and p_dados->>'celula' = public.minha_celula()
    when 'lider_treinamento' then p_tipo = 'celula' and p_dados->>'celula' = public.minha_celula()
    else false end
$$;

create policy "ver envios por papel" on public.envios for select to authenticated
  using ((select public.pode_ver_envio(tipo, dados)));

-- Marcar como lido: quem vê, menos o líder em treinamento (só leitura)
create policy "marcar lido por papel" on public.envios for update to authenticated
  using ((select public.pode_ver_envio(tipo, dados)) and (select public.meu_papel()) <> 'lider_treinamento')
  with check ((select public.pode_ver_envio(tipo, dados)));

-- Apagar: administrador e pastores
create policy "apagar envios" on public.envios for delete to authenticated
  using ((select public.meu_papel()) in ('admin','pastor'));

revoke all on public.envios from authenticated;
grant select, delete on public.envios to authenticated;
grant update (lido) on public.envios to authenticated;

-- ---------- AVISOS (comunicados internos) ----------
create table if not exists public.avisos (
  id         bigint generated always as identity primary key,
  titulo     text not null check (char_length(titulo) between 1 and 150),
  texto      text not null check (char_length(texto) between 1 and 4000),
  publico    text[] not null default '{}',   -- vazio = todos os membros aprovados
  autor      uuid default auth.uid() references auth.users(id) on delete set null,
  criado_em  timestamptz not null default now()
);
alter table public.avisos enable row level security;

create policy "ver avisos" on public.avisos for select to authenticated
  using ((select public.meu_papel()) is not null
         and (publico = '{}' or (select public.meu_papel()) = any(publico)
              or (select public.meu_papel()) in ('admin','pastor','secretaria')));

create policy "publicar avisos" on public.avisos for insert to authenticated
  with check ((select public.meu_papel()) in ('admin','pastor','secretaria') and autor = (select auth.uid()));

create policy "apagar avisos" on public.avisos for delete to authenticated
  using ((select public.meu_papel()) in ('admin','pastor') or autor = (select auth.uid()));

revoke all on public.avisos from anon, authenticated;
grant select, insert, delete on public.avisos to authenticated;

-- ---------- Usuários já existentes ganham perfil ----------
insert into public.perfis (id, email, nome)
select id, email, coalesce(raw_user_meta_data->>'nome', split_part(email, '@', 1)) from auth.users
on conflict (id) do nothing;
