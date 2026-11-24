import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar – Atena" },
      { name: "description", content: "Entre com seu e-mail para conversar com a Atena." },
      { property: "og:title", content: "Entrar – Atena" },
      { property: "og:description", content: "Acesso de estudantes e equipe à Atena." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [modo, setModo] = useState<"entrar" | "cadastrar">("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    if (modo === "entrar") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      setEnviando(false);
      if (error) { toast.error("E-mail ou senha incorretos."); return; }
      navigate({ to: "/chat" });
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: { emailRedirectTo: window.location.origin, data: { nome } },
      });
      setEnviando(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Conta criada! Confira seu e-mail para confirmar o cadastro.");
      setModo("entrar");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-bold text-primary">{modo === "entrar" ? "Entrar" : "Criar conta"}</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-5 rounded-xl border-2 bg-card p-6 shadow-soft">
        {modo === "cadastrar" && (
          <div className="space-y-2">
            <Label htmlFor="nome" className="text-lg">Nome</Label>
            <Input id="nome" className="h-12 text-lg" value={nome} onChange={(e) => setNome(e.target.value)} required autoComplete="name" />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-lg">E-mail</Label>
          <Input id="email" type="email" className="h-12 text-lg" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="senha" className="text-lg">Senha</Label>
          <Input id="senha" type="password" minLength={6} className="h-12 text-lg" value={senha} onChange={(e) => setSenha(e.target.value)} required autoComplete={modo === "entrar" ? "current-password" : "new-password"} />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={enviando}>
          {enviando ? "Aguarde…" : modo === "entrar" ? "Entrar" : "Criar conta"}
        </Button>
        <Button type="button" variant="link" className="w-full" onClick={() => setModo(modo === "entrar" ? "cadastrar" : "entrar")}>
          {modo === "entrar" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
        </Button>
      </form>
      <p className="mt-4 text-muted-foreground">Protótipo: matrícula e curso fictícios são criados no seu perfil.</p>
    </div>
  );
}
