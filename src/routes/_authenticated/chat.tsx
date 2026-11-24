import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/chat")({
  beforeLoad: async ({ context }) => {
    const { data } = await supabase.from("perfis").select("aceite_privacidade_em").eq("id", context.userId).maybeSingle();
    if (!data?.aceite_privacidade_em) throw redirect({ to: "/aviso" });
  },
  head: () => ({
    meta: [
      { title: "Conversar com a Atena" },
      { name: "description", content: "Converse com a Atena sobre a vida acadêmica." },
      { property: "og:title", content: "Conversar com a Atena" },
      { property: "og:description", content: "Assistente de IA de permanência estudantil." },
    ],
  }),
  component: Chat,
});

function Chat() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="rounded-lg border-2 border-primary bg-muted p-3 font-bold text-primary" role="note">Você está falando com uma IA.</p>
      <h1 className="mt-6 text-3xl font-bold text-primary">Conversa com a Atena</h1>
      <p className="mt-3 text-lg text-muted-foreground">O chat será montado no próximo passo.</p>
    </div>
  );
}
