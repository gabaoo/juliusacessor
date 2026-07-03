import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useProfile, useCategories, useInstance, type Category } from "@/hooks/use-app-data";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { refreshConnection } from "@/lib/evolution.functions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Plus,
  Trash2,
  Save,
  User,
  Tag,
  Plug,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Loader2,
  QrCode,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/_app/configuracoes")({
  component: Configuracoes,
});

const CURRENCIES = ["BRL", "USD", "EUR", "GBP"];
const TIMEZONES = ["America/Sao_Paulo", "America/New_York", "Europe/London", "Europe/Lisbon", "UTC"];

type Tab = "conta" | "categorias" | "integracao";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "conta", label: "Conta & Aparência", icon: User },
  { id: "categorias", label: "Categorias", icon: Tag },
  { id: "integracao", label: "Integração", icon: Plug },
];

function Configuracoes() {
  const [activeTab, setActiveTab] = useState<Tab>("conta");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">Ajuste sua conta, aparência, categorias e integrações.</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar nav */}
        <nav className="flex shrink-0 flex-row gap-1 lg:w-48 lg:flex-col">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left w-full",
                  activeTab === tab.id
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === "conta" && <ContaTab />}
          {activeTab === "categorias" && <CategoriasTab />}
          {activeTab === "integracao" && <IntegracaoTab />}
        </div>
      </div>
    </div>
  );
}

/* ─── Conta & Aparência ─────────────────────────────────────────── */

function ContaTab() {
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("BRL");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");

  useEffect(() => {
    if (profile) {
      setName(profile.display_name ?? "");
      setCurrency(profile.currency ?? "BRL");
      setTimezone(profile.timezone ?? "America/Sao_Paulo");
    }
  }, [profile]);

  async function saveProfile() {
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: name, currency, timezone })
      .eq("id", profile!.id);
    if (error) {
      console.error("[profiles] update error:", error);
      return toast.error("Não foi possível salvar. Tente novamente.");
    }
    toast.success("Preferências salvas.");
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conta</CardTitle>
          <CardDescription>Dados da sua conta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input value={profile?.email ?? ""} readOnly disabled />
            </div>
            <div className="space-y-1.5">
              <Label>Moeda</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fuso horário</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={saveProfile}>
            <Save className="mr-2 h-4 w-4" /> Salvar
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aparência</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="font-medium">Tema escuro</p>
            <p className="text-sm text-muted-foreground">Alterna entre claro e escuro.</p>
          </div>
          <Switch checked={theme === "dark"} onCheckedChange={(v) => setTheme(v ? "dark" : "light")} />
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Categorias ────────────────────────────────────────────────── */

function CategoriasTab() {
  const { data: profile } = useProfile();
  const { data: categories = [] } = useCategories();
  return <CategoriesManager categories={categories} userId={profile?.id} />;
}

function CategoriesManager({ categories, userId }: { categories: Category[]; userId?: string }) {
  const qc = useQueryClient();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#6366f1");
  const [newTipo, setNewTipo] = useState("despesa");

  async function addCategory() {
    if (!newName.trim() || !userId) return;
    const { error } = await supabase.from("categories").insert({
      user_id: userId,
      nome: newName.trim(),
      cor: newColor,
      tipo: newTipo,
    });
    if (error) {
      console.error("[categories] insert error:", error);
      return toast.error("Não foi possível criar a categoria. Tente novamente.");
    }
    setNewName("");
    toast.success("Categoria criada.");
    qc.invalidateQueries({ queryKey: ["categories"] });
  }

  async function updateCategory(id: string, patch: Partial<Category>) {
    const { error } = await supabase.from("categories").update(patch).eq("id", id);
    if (error) {
      console.error("[categories] update error:", error);
      return toast.error("Não foi possível atualizar a categoria. Tente novamente.");
    }
    qc.invalidateQueries({ queryKey: ["categories"] });
  }

  async function deleteCategory(id: string) {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      console.error("[categories] delete error:", error);
      return toast.error("Não foi possível remover a categoria. Tente novamente.");
    }
    toast.success("Categoria removida.");
    qc.invalidateQueries({ queryKey: ["categories"] });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Categorias</CardTitle>
        <CardDescription>Crie, renomeie e defina cores.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Nova categoria</Label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome" className="w-44" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Cor</Label>
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="h-9 w-12 cursor-pointer rounded border"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo</Label>
            <Select value={newTipo} onValueChange={setNewTipo}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="despesa">Despesa</SelectItem>
                <SelectItem value="receita">Receita</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={addCategory}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar
          </Button>
        </div>

        <div className="divide-y rounded-lg border">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-3">
              <input
                type="color"
                value={c.cor}
                onChange={(e) => updateCategory(c.id, { cor: e.target.value })}
                className="h-7 w-9 cursor-pointer rounded border"
              />
              <Input
                defaultValue={c.nome}
                onBlur={(e) => e.target.value !== c.nome && updateCategory(c.id, { nome: e.target.value })}
                className="max-w-xs"
              />
              <Select value={c.tipo} onValueChange={(v) => updateCategory(c.id, { tipo: v })}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="despesa">Despesa</SelectItem>
                  <SelectItem value="receita">Receita</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" aria-label={`Remover categoria ${c.nome}`} className="ml-auto" onClick={() => deleteCategory(c.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Integração ────────────────────────────────────────────────── */

function IntegracaoTab() {
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
    <div className="space-y-4">
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
              <Button variant="outline" size="icon" onClick={() => copy(webhookUrl, "URL")}>
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
              <Button variant="outline" size="icon" onClick={() => setRevealSecret((v) => !v)}>
                {revealSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={() => copy(instance?.webhook_secret ?? "", "Secret")}>
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
