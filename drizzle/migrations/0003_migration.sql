alter table public.protocolos add column if not exists prioridade text not null default 'normal' check (prioridade in ('normal','alta'));
grant select (prioridade), insert (prioridade) on public.protocolos to authenticated;
create or replace function public.mascarar_log() returns trigger language plpgsql set search_path to 'public' as $$
begin
 new.acao := case when new.acao in ('aceite_privacidade','download_dados','pedido_exclusao','pedido_exclusao_conta','memoria_longa_ligada','memoria_longa_desligada','resumo_apagado','todos_resumos_apagados','preferencias_atualizadas','sessao_encerrada','consulta_documento','protocolo_aberto','contestacao_aberta','encaminhamento','urgencia_detectada','feedback_registrado','conversa_encerrada') then public.mascarar_texto(new.acao) else 'acao_registrada' end;
 new.detalhes := null;
 return new;
end $$;