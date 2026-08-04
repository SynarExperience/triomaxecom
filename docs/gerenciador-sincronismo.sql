-- ============================================================================
-- Schema de sincronismo aplicado no banco do GERENCIADOR DE ESTOQUE
-- (projeto Supabase `anttzsyczxbyhjuonirw`, "gerenciador trio max").
--
-- Mora aqui porque o código daquele sistema não está nesta máquina — sem esta
-- cópia, o desenho existiria só dentro do banco, sem histórico e sem revisão.
-- Não é executado por nada deste repositório; é referência versionada.
--
-- O `x-integracao-secret` real foi trocado por um marcador: ele vive em
-- INTEGRACAO_ESTOQUE_SECRET no .env.local da vitrine e dentro das funções lá.
--
-- Aplicado em 04/08/2026. Ver docs/cruzamento-estoque.md e
-- triomax-admin/supabase/migrations/0016_sincronismo_tempo_real.sql.
-- ============================================================================

-- Aplica um delta vindo da vitrine (venda ou estorno feitos no site).
create or replace function public.aplicar_delta_estoque(p_id bigint, p_delta int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_novo int;
begin
  update products
     set stock = greatest(0, coalesce(stock, 0) + p_delta)
   where id = p_id
  returning stock into v_novo;
  return v_novo;
end;
$$;

create extension if not exists pg_cron;

-- Fila de avisos pendentes para a vitrine.
--
-- O gatilho sozinho é "dispara e esquece": se a vitrine estiver fora do ar, no
-- meio de um deploy, ou o alias apontar para o lugar errado, o aviso se perde
-- em silêncio e os dois sistemas ficam divergentes sem ninguém saber. Foi o que
-- aconteceu em 04/08/2026 — o gatilho tomou 404 por horas.
--
-- Aqui cada mudança de estoque vira uma linha pendente, e o reprocessamento
-- periódico só a encerra quando a vitrine confirmar com 200.
create table if not exists public.integracao_fila (
  id            bigserial primary key,
  product_id    bigint not null references public.products(id) on delete cascade,
  request_id    bigint,
  tentativas    int not null default 0,
  ultimo_status int,
  criado_em     timestamptz not null default now(),
  concluido_em  timestamptz
);

-- No máximo uma pendência por produto: o envio manda sempre o saldo ATUAL, e
-- não o que estava valendo quando a linha nasceu — então cinco mudanças
-- seguidas do mesmo produto são um aviso só, com o valor mais novo.
create unique index if not exists integracao_fila_um_pendente_por_produto
  on public.integracao_fila (product_id)
  where concluido_em is null;

create index if not exists integracao_fila_pendentes
  on public.integracao_fila (criado_em)
  where concluido_em is null;

/*
 * Envia o saldo atual do produto para a vitrine e guarda o id da requisição,
 * que é como o reprocessamento depois descobre se deu certo.
 */
create or replace function public.integracao_despachar(p_fila_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_produto bigint;
  v_stock   int;
  v_req     bigint;
begin
  select f.product_id, p.stock into v_produto, v_stock
    from integracao_fila f
    join products p on p.id = f.product_id
   where f.id = p_fila_id;

  if not found then
    return;
  end if;

  select net.http_post(
    url := 'https://triomaxecom.vercel.app/api/integracao/estoque',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-integracao-secret', '<INTEGRACAO_ESTOQUE_SECRET>'
    ),
    body := jsonb_build_object(
      'record', jsonb_build_object('id', v_produto, 'stock', coalesce(v_stock, 0))
    ),
    timeout_milliseconds := 5000
  ) into v_req;

  update integracao_fila
     set request_id = v_req,
         tentativas = tentativas + 1
   where id = p_fila_id;
end;
$$;

-- Gatilho: enfileira e despacha na hora. A fila é só a rede de segurança; o
-- caminho normal continua sendo imediato.
create or replace function public.avisar_vitrine_estoque()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_fila bigint;
begin
  if TG_OP = 'UPDATE' and NEW.stock is not distinct from OLD.stock then
    return NEW;
  end if;

  insert into integracao_fila (product_id)
  values (NEW.id)
  on conflict (product_id) where concluido_em is null
  do update set criado_em = now(), tentativas = 0, ultimo_status = null
  returning id into v_fila;

  perform integracao_despachar(v_fila);
  return NEW;
end;
$$;

/*
 * Confere as pendências e reenvia o que não foi confirmado.
 *
 * Roda a cada 2 minutos pelo pg_cron. Uma resposta 200 encerra a linha; erro ou
 * silêncio (a vitrine caiu antes de responder) rende nova tentativa, até 5.
 * Depois disso a linha fica parada de propósito — é o que `integracao_travados`
 * mostra, e o que significa "precisa de gente olhando".
 */
create or replace function public.integracao_reprocessar()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  linha record;
  v_status int;
  v_reenviadas int := 0;
begin
  for linha in
    select * from integracao_fila
     where concluido_em is null
       and criado_em < now() - interval '30 seconds'
     order by criado_em
     limit 200
  loop
    select status_code into v_status
      from net._http_response
     where id = linha.request_id;

    if v_status = 200 then
      update integracao_fila
         set concluido_em = now(), ultimo_status = 200
       where id = linha.id;

    elsif linha.tentativas < 5 then
      -- Erro registrado, ou resposta que nunca chegou: tenta de novo com o
      -- saldo atual, que a esta altura já pode ser outro.
      update integracao_fila set ultimo_status = v_status where id = linha.id;
      perform integracao_despachar(linha.id);
      v_reenviadas := v_reenviadas + 1;
    else
      update integracao_fila set ultimo_status = coalesce(v_status, -1) where id = linha.id;
    end if;
  end loop;

  return v_reenviadas;
end;
$$;

/*
 * O alerta: produtos cujo aviso não fechou em 5 tentativas. Lista vazia é o
 * estado saudável.
 */
create or replace function public.integracao_travados()
returns table (product_id bigint, produto text, estoque int, tentativas int, ultimo_status int, desde timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select f.product_id, p.name, p.stock, f.tentativas, f.ultimo_status, f.criado_em
    from integracao_fila f
    join products p on p.id = f.product_id
   where f.concluido_em is null
     and f.tentativas >= 5
   order by f.criado_em
$$;

revoke execute on function public.integracao_despachar(bigint) from public, anon, authenticated;
revoke execute on function public.integracao_reprocessar() from public, anon, authenticated;
revoke execute on function public.integracao_travados() from public, anon;
grant execute on function public.integracao_travados() to service_role;

-- Faxina: pendência concluída não precisa virar arquivo eterno.
create or replace function public.integracao_limpar()
returns void
language sql
security definer
set search_path = public
as $$
  delete from integracao_fila where concluido_em < now() - interval '7 days';
$$;

select cron.unschedule('integracao-reprocessar') where exists (select 1 from cron.job where jobname = 'integracao-reprocessar');
select cron.schedule('integracao-reprocessar', '*/2 * * * *', 'select public.integracao_reprocessar()');
select cron.unschedule('integracao-limpar') where exists (select 1 from cron.job where jobname = 'integracao-limpar');
select cron.schedule('integracao-limpar', '17 4 * * *', 'select public.integracao_limpar()');

-- --- Revisão posterior: faixa lenta de reenvio (ver comentários) ---
alter table public.integracao_fila
  add column if not exists ultima_tentativa_em timestamptz;

create or replace function public.integracao_despachar(p_fila_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_produto bigint;
  v_stock   int;
  v_req     bigint;
begin
  select f.product_id, p.stock into v_produto, v_stock
    from integracao_fila f
    join products p on p.id = f.product_id
   where f.id = p_fila_id;

  if not found then
    return;
  end if;

  select net.http_post(
    url := 'https://triomaxecom.vercel.app/api/integracao/estoque',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-integracao-secret', '<INTEGRACAO_ESTOQUE_SECRET>'
    ),
    body := jsonb_build_object(
      'record', jsonb_build_object('id', v_produto, 'stock', coalesce(v_stock, 0))
    ),
    timeout_milliseconds := 5000
  ) into v_req;

  update integracao_fila
     set request_id = v_req,
         tentativas = tentativas + 1,
         ultima_tentativa_em = now()
   where id = p_fila_id;
end;
$$;

/*
 * Confere as pendências e reenvia o que não foi confirmado.
 *
 * Duas velocidades de propósito. As 5 primeiras tentativas saem a cada rodada
 * (2 min), para engolir uma falha passageira sem ninguém perceber. Depois disso
 * o produto entra em `integracao_travados` — é o alerta — mas continua tentando
 * de meia em meia hora: uma queda longa da vitrine, ou um deploy que derrubou a
 * rota por horas, se resolve sozinha quando o outro lado voltar, sem exigir que
 * alguém venha destravar a fila na mão.
 */
create or replace function public.integracao_reprocessar()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  linha record;
  v_status int;
  v_reenviadas int := 0;
begin
  for linha in
    select * from integracao_fila
     where concluido_em is null
       and criado_em < now() - interval '30 seconds'
     order by criado_em
     limit 200
  loop
    select status_code into v_status
      from net._http_response
     where id = linha.request_id;

    if v_status = 200 then
      update integracao_fila
         set concluido_em = now(), ultimo_status = 200
       where id = linha.id;

    elsif linha.tentativas < 5
       or linha.ultima_tentativa_em < now() - interval '30 minutes' then
      update integracao_fila set ultimo_status = v_status where id = linha.id;
      perform integracao_despachar(linha.id);
      v_reenviadas := v_reenviadas + 1;

    else
      update integracao_fila set ultimo_status = coalesce(v_status, -1) where id = linha.id;
    end if;
  end loop;

  return v_reenviadas;
end;
$$;
