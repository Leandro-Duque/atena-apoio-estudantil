import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession, isEquipe } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { encerrarSessao } from "@/lib/memoria.functions";

export function Header() {
  const { session } = useSession();
  const [equipe, setEquipe] = useState(false);
  const navigate = useNavigate();
  const encerrar = useServerFn(encerrarSessao);
  useEffect(() => {
    if (session?.user) isEquipe(session.user.id).then(setEquipe);
    else setEquipe(false);
  }, [session?.user?.id]);

  const link = "rounded-md px-3 py-2 font-semibold text-foreground hover:bg-muted [&.active]:text-primary [&.active]:underline";
  return (
    <header className="border-b-2 border-border bg-card">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-primary focus:p-3 focus:text-primary-foreground">
        Pular para o conteúdo
      </a>
      <nav aria-label="Principal" className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-3">
        <Link to="/" className="mr-auto flex items-center gap-2 text-2xl font-bold text-primary">
          <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-full bg-accent text-accent-foreground">A</span>
          Atena
        </Link>
        {session ? (
          <>
            <Link to="/chat" className={link}>Conversar</Link>
            <Link to="/meus-dados" className={link}>Meus dados</Link>
            {equipe && <Link to="/admin" className={link}>Painel da equipe</Link>}
            <Button
              variant="outline"
              onClick={async () => {
                try { await encerrar(); } catch (e) { console.error(e); }
                await supabase.auth.signOut();
                navigate({ to: "/auth", replace: true });
              }}
            >
              Sair
            </Button>
          </>
        ) : (
          <Button asChild><Link to="/auth">Entrar</Link></Button>
        )}
      </nav>
    </header>
  );
}
