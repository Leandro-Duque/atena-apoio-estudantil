alter table public.protocolos add column if not exists resposta text, add column if not exists respondido_em timestamptz, add column if not exists prazo_resposta date;
grant select(resposta,respondido_em,prazo_resposta) on public.protocolos to authenticated;
grant update(status,resposta,respondido_em) on public.protocolos to authenticated;

create or replace function public.somar_dias_uteis(_inicio date,_n int) returns date language plpgsql immutable set search_path = public as $$
declare d date := _inicio; c int := 0;
begin
  while c < _n loop d := d + 1; if extract(isodow from d) < 6 then c := c + 1; end if; end loop;
  return d;
end; $$;

create or replace function public.protocolo_prazo() returns trigger language plpgsql set search_path = public as $$
begin
  if new.tipo = 'contestacao' and new.prazo_resposta is null then new.prazo_resposta := public.somar_dias_uteis(coalesce(new.criado_em, now())::date, 3); end if;
  if new.status not in ('aberto','em_andamento','concluido') then raise exception 'status inválido'; end if;
  if tg_op = 'UPDATE' and new.resposta is distinct from old.resposta and new.resposta is not null then new.respondido_em := coalesce(old.respondido_em, now()); end if;
  return new;
end; $$;
drop trigger if exists protocolo_prazo_trg on public.protocolos;
create trigger protocolo_prazo_trg before insert or update on public.protocolos for each row execute function public.protocolo_prazo();
update public.protocolos set prazo_resposta = public.somar_dias_uteis(criado_em::date,3) where tipo='contestacao' and prazo_resposta is null;

drop policy if exists "equipe protocolos" on public.protocolos;
create policy "equipe protocolos setor" on public.protocolos for all to authenticated
  using (public.has_role(auth.uid(),'equipe') and public.pertence_setor(auth.uid(), setor))
  with check (public.has_role(auth.uid(),'equipe') and public.pertence_setor(auth.uid(), setor));

alter table public.perfis add column if not exists turno text, add column if not exists modalidade text;
update public.perfis set turno = (array['Matutino','Vespertino','Noturno'])[1+floor(random()*3)::int] where turno is null;
update public.perfis set modalidade = (array['Presencial','EAD'])[1+floor(random()*2)::int] where modalidade is null;
alter table public.perfis alter column turno set default 'Noturno', alter column modalidade set default 'Presencial';

create table public.decisoes_design (
  id uuid primary key default gen_random_uuid(),
  decisao text not null,
  alternativas_descartadas text not null default '',
  riscos text not null default '',
  responsavel text not null,
  data date not null default current_date,
  criado_por uuid,
  criado_em timestamptz not null default now()
);
grant select, insert, update, delete on public.decisoes_design to authenticated;
grant all on public.decisoes_design to service_role;
alter table public.decisoes_design enable row level security;
create policy "equipe decisoes" on public.decisoes_design for all to authenticated
  using (public.has_role(auth.uid(),'equipe')) with check (public.has_role(auth.uid(),'equipe'));
insert into public.decisoes_design (decisao, alternativas_descartadas, riscos, responsavel, data) values
('Mensagens do chat ficam só na memória do navegador e são apagadas ao encerrar a sessão (exemplo fictício).','Guardar o histórico completo no banco por 12 meses.','Estudante perde o histórico ao fechar a aba; mitigado pelo resumo de 3 linhas.','Ana Ribeiro (Privacidade)','2026-09-02'),
('Painel mostra apenas indicadores agregados; nenhum aviso individual de risco de evasão é enviado à coordenação (exemplo fictício).','Lista nominal de estudantes com risco de evasão para a coordenação.','Menor capacidade de busca ativa; contato individual só com aceite do estudante no chat.','Carlos Mendes (Coordenação de Permanência)','2026-09-10'),
('Contestações de orientação têm prazo de resposta de 3 dias úteis e aparecem em destaque (exemplo fictício).','Tratar contestações na fila comum, sem prazo.','Sobrecarga da equipe em período de editais.','Juliana Prado (Assistência Estudantil)','2026-09-18');

create or replace function public.painel_indicadores() returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r jsonb; conv int; temas jsonb;
begin
  if not public.has_role(auth.uid(),'equipe') then raise exception 'acesso negado'; end if;
  select count(*) into conv from public.conversas;
  select coalesce(jsonb_agg(jsonb_build_object('tema',t.tema,'total',t.total) order by t.total desc),'[]') into temas from (
    select x.tema, count(r.id)::int total from (values ('Calendário','calend'),('Trancamento','tranca'),('Aproveitamento','aproveit'),('Auxílio alimentação','aliment'),('Bolsa permanência','perman'),('Serviços de apoio','apoio')) x(tema,chave)
    left join public.resumos_conversa r on r.resumo ilike '%'||x.chave||'%' group by x.tema) t;
  select jsonb_build_object(
    'conversas', conv,
    'temas', temas,
    'pedidos_humanos', (select count(*) from public.protocolos where tipo in ('atendimento','urgencia','acolhimento','acessibilidade')),
    'taxa_humano', case when conv=0 then null else round(100.0*(select count(*) from public.protocolos where tipo in ('atendimento','urgencia','acolhimento','acessibilidade'))/conv,1) end,
    'feedbacks', (select count(*) from public.feedbacks),
    'taxa_nao_util', (select case when count(*)=0 then null else round(100.0*count(*) filter (where nota=0)/count(*),1) end from public.feedbacks),
    'tempo_medio_horas', (select round((avg(extract(epoch from respondido_em-criado_em))/3600)::numeric,1) from public.protocolos where respondido_em is not null),
    'contestacoes', (select count(*) from public.protocolos where tipo='contestacao')
  ) into r;
  return r;
end; $$;

create or replace function public.painel_equidade() returns jsonb language plpgsql stable security definer set search_path = public as $$
declare res jsonb := '{}'; dim text; tmp jsonb;
begin
  if not public.has_role(auth.uid(),'equipe') then raise exception 'acesso negado'; end if;
  foreach dim in array array['curso','turno','modalidade'] loop
    execute format($q$
      select coalesce(jsonb_agg(jsonb_build_object('grupo',g,'estudantes',n,'ocultado',n<3,
        'taxa_nao_util', case when n<3 or fb=0 then null else round(100.0*nu/fb,1) end,
        'taxa_contestacao', case when n<3 or cv=0 then null else round(100.0*ct/cv,1) end) order by g),'[]')
      from (select coalesce(p.%1$I,'Não informado') g, count(distinct p.id)::int n,
        (select count(*) from public.feedbacks f join public.perfis q on q.id=f.user_id where coalesce(q.%1$I,'Não informado')=coalesce(p.%1$I,'Não informado')) fb,
        (select count(*) from public.feedbacks f join public.perfis q on q.id=f.user_id where f.nota=0 and coalesce(q.%1$I,'Não informado')=coalesce(p.%1$I,'Não informado')) nu,
        (select count(*) from public.conversas c join public.perfis q on q.id=c.user_id where coalesce(q.%1$I,'Não informado')=coalesce(p.%1$I,'Não informado')) cv,
        (select count(*) from public.protocolos o join public.perfis q on q.id=o.user_id where o.tipo='contestacao' and coalesce(q.%1$I,'Não informado')=coalesce(p.%1$I,'Não informado')) ct
        from public.perfis p join public.user_roles ur on ur.user_id=p.id and ur.role='estudante' group by 1) s$q$, dim)
    into tmp;
    res := res || jsonb_build_object(dim, tmp);
  end loop;
  return res;
end; $$;
revoke all on function public.painel_indicadores() from public, anon;
revoke all on function public.painel_equidade() from public, anon;
grant execute on function public.painel_indicadores() to authenticated;
grant execute on function public.painel_equidade() to authenticated;