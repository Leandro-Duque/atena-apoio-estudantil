import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { registrarLog } from "@/lib/auth";
import { PrivacyText } from "@/components/atena/PrivacyText";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/aviso")({
  head: () => ({
    meta: [
      { title: "Aviso de privacidade – Atena" },
      { name: "description", content: "Saiba como a Atena trata seus dados antes de conversar." },
      { property: "og:title", content: "Aviso de privacidade – Atena" },
      { property: "og:description", content: "Privacidade em linguagem simples." },
    ],
  }),
  component: Aviso,
});

function Aviso() {
  const { userId } = Route.useRouteContext();
  const [ciente, setCiente] = useState(false);
  const navigate = useNavigate();
  async function continuar() {
    const { error } = await supabase.from("perfis").update({ aceite_privacidade_em: new Date().toISOString() }).eq("id", userId);
    if (error) { toast.error("Não foi possível salvar. Tente de novo."); return; }
    await registrarLog("aceite_privacidade");
    navigate({ to: "/chat" });
  }
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold text-primary">Antes de começar: sua privacidade</h1>
      <PrivacyText />
      <div className="mt-8 flex items-start gap-3 rounded-lg border-2 bg-card p-4">
        <Checkbox id="ciente" className="mt-1 h-6 w-6" checked={ciente} onCheckedChange={(v) => setCiente(v === true)} />
        <Label htmlFor="ciente" className="text-lg leading-snug">
          Li e entendi este aviso. Sei que estou falando com uma IA.
        </Label>
      </div>
      <Button size="lg" className="mt-6" disabled={!ciente} onClick={continuar}>Continuar</Button>
    </div>
  );
}
