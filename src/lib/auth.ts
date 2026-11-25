import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { mascarar } from "./privacidade";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  return { session, loading };
}

export async function isEquipe(userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "equipe")
    .maybeSingle();
  return !!data;
}

export async function registrarLog(acao: string, detalhes?: Record<string, unknown>) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  // Não gravar texto livre nem dados de conversa nos logs.
  void detalhes;
  const { error } = await supabase.from("logs_acoes").insert({ user_id: data.user.id, acao: mascarar(acao), detalhes: null });
  if (error) throw new Error("Não foi possível registrar a ação.");
}
