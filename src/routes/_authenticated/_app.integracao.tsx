import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { refreshConnection } from "@/lib/evolution.functions";
import { useInstance } from "@/hooks/use-app-data";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Eye, EyeOff, RefreshCw, Loader2, QrCode, Plug } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_app/integracao")({
  head: () => ({
    meta: [
      { title: "Integração — Julius" },
      { name: "description", content: "Conecte o N8N e a Evolution API ao Julius para registrar lançamentos pelo WhatsApp." },
    ],
  }),
  component: Integracao,
});

function Integracao() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: instance } = useInstance();
  const refresh = useServerFn(refreshConnection);
  const [revealSecret, setRevealSecret] = useState(false);
  const [checking, setChecking] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const webhookUrl = instance ? `${origin}/api/public/webhook/${instance.nome_instancia}` : "";
  const connected = instance?.status === "connected";

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado.`);
  }

  async function check() {
    setChecking(true);
    try {
      const res = await refresh({});
      await qc.invalidateQueries({ queryKey: ["instance"] });
      toast.success(res.status === "connected" ? "Conectado!" : "Status atualizado.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setChecking(false);
    }
  }

  const examplePayload = `{
  "tipo": "receita",
  "valor": 700,
  "categoria": "serviços",
  "metodo_pagamento": null,
  "descricao": "Recebimento de cliente",
  "data": "2026-06-24",
  "hora": "10:58:15",
  "resposta_usuario": "Registrei sua receita de R$ 700 recebida do cliente!"
}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integração</h1>
        <p className="text-sm text-muted-foreground">Conecte o N8N e a Evolution API ao Julius.</p>
      </div>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plug className="h-4 w-4" /> Status da instância
          </CardTitle>
          <CardDescription>Instância: {instance?.nome_instancia}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${connected ? "bg-success" : "bg-muted-foreground/50"}`} />
            <Badge variant={connected ? "default" : "secondary"}>
              {connected ? "Conectada" : "Desconectada"}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={check} disabled={checking}>
              {checking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Verificar
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate({ to: "/conectar" })}>
              <QrCode className="mr-2 h-4 w-4" /> Reconectar (novo QR)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Webhook config */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Webhook para o N8N</CardTitle>
          <CardDescription>
            Configure seu fluxo do N8N para enviar cada lançamento para esta URL, incluindo o cabeçalho{" "}
            <code className="rounded bg-muted px-1">x-webhook-secret</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>URL do webhook (endpoint que recebe os dados)</Label>
            <div className="flex gap-2">
              <Input readOnly value={webhookUrl} className="font-mono text-xs" />
              <Button variant="outline" size="icon" aria-label="Copiar URL do webhook" onClick={() => copy(webhookUrl, "URL")}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Webhook secret (valida que a requisição vem do N8N)</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                type={revealSecret ? "text" : "password"}
                value={instance?.webhook_secret ?? ""}
                className="font-mono text-xs"
              />
              <Button variant="outline" size="icon" aria-label={revealSecret ? "Ocultar secret" : "Mostrar secret"} onClick={() => setRevealSecret((v) => !v)}>
                {revealSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon" aria-label="Copiar webhook secret" onClick={() => copy(instance?.webhook_secret ?? "", "Secret")}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Envie como cabeçalho HTTP <code className="rounded bg-muted px-1">x-webhook-secret</code>.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Evolution API global credentials */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Credenciais da Evolution API</CardTitle>
          <CardDescription>
            A URL e a API Key globais do provedor são armazenadas com segurança no back-end como secrets
            (<code className="rounded bg-muted px-1">EVOLUTION_API_URL</code> e{" "}
            <code className="rounded bg-muted px-1">EVOLUTION_API_KEY</code>) e nunca são exibidas em texto puro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Essas credenciais permitem que o Julius crie a instância e gere o QR Code automaticamente. Peça para o
            time configurá-las caso o QR Code não apareça.
          </p>
        </CardContent>
      </Card>

      {/* Docs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Formato esperado do JSON</CardTitle>
          <CardDescription>Estrutura que o N8N deve enviar (POST) para o webhook.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <pre className="overflow-x-auto rounded-lg bg-muted p-4 font-mono text-xs">{examplePayload}</pre>
          <ul className="list-inside list-disc space-y-1 text-xs text-muted-foreground">
            <li>
              <code className="rounded bg-muted px-1">tipo</code>: "receita" ou "despesa".
            </li>
            <li>
              <code className="rounded bg-muted px-1">valor</code>: número. <code className="rounded bg-muted px-1">data</code>{" "}
              no formato AAAA-MM-DD, <code className="rounded bg-muted px-1">hora</code> em HH:MM:SS.
            </li>
            <li>
              <code className="rounded bg-muted px-1">resposta_usuario</code>: resposta do agente exibida em Conversas.
            </li>
            <li>Campos opcionais podem vir como null. Sempre envie o cabeçalho do secret.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
