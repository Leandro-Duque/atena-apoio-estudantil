import { createFileRoute, redirect } from "@tanstack/react-router";
import { isEquipe } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Protocolos } from "@/components/atena/admin/Protocolos";
import { Indicadores } from "@/components/atena/admin/Indicadores";
import { Equidade } from "@/components/atena/admin/Equidade";
import { Decisoes } from "@/components/atena/admin/Decisoes";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    if (!(await isEquipe(context.userId))) throw redirect({ to: "/" });
  },
  head: () => ({
    meta: [
      { title: "Painel da equipe – Atena" },
      { name: "description", content: "Área restrita da equipe de permanência estudantil: protocolos, indicadores, equidade e decisões." },
      { property: "og:title", content: "Painel da equipe – Atena" },
      { property: "og:description", content: "Área restrita da equipe de permanência estudantil." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Admin,
});

function Admin() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <h1 className="text-3xl font-bold text-primary">Painel da equipe</h1>
      <Tabs defaultValue="protocolos">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="protocolos" className="text-base">Protocolos</TabsTrigger>
          <TabsTrigger value="indicadores" className="text-base">Indicadores</TabsTrigger>
          <TabsTrigger value="equidade" className="text-base">Equidade</TabsTrigger>
          <TabsTrigger value="decisoes" className="text-base">Decisões de design</TabsTrigger>
        </TabsList>
        <TabsContent value="protocolos" className="mt-6"><Protocolos /></TabsContent>
        <TabsContent value="indicadores" className="mt-6"><Indicadores /></TabsContent>
        <TabsContent value="equidade" className="mt-6"><Equidade /></TabsContent>
        <TabsContent value="decisoes" className="mt-6"><Decisoes /></TabsContent>
      </Tabs>
    </div>
  );
}
