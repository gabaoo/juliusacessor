import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories, useInstance, useProfile } from "@/hooks/use-app-data";
import { useOrcamentos, useRecorrentes, useMetas, type Meta } from "@/hooks/use-planning";
import { formatCurrency, formatDate } from "@/lib/format";
import { Plus, Save, Trash2, PartyPopper, Repeat } from "lucide-react";

/* ─── Orçamentos ────────────────────────────────────────────────── */

export function OrcamentosTab() {
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const { data: categories = [] } = useCategories();
  const { data: orcamentos = [] } = useOrcamentos();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const currency = profile?.currency ?? "BRL";

  const despesas = categories.filter((c) => c.tipo === "despesa");

  async function save(categoria: string) {
    if (!profile) return;
    const valor = parseFloat((draft[categoria] ?? "").replace(",", "."));
    if (isNaN(valor) || valor < 0) return toast.error("Informe um valor válido.");
    const { error } = await supabase
      .from("orcamentos")
      .upsert(
        { user_id: profile.id, categoria, valor_limite: valor } as never,
        { onConflict: "user_id,categoria" },
      );
    if (error) {
      console.error("[orcamentos] upsert error:", error);
      return toast.error("Não foi possível salvar o orçamento.");
    }
    toast.success("Orçamento salvo.");
    qc.invalidateQueries({ queryKey: ["orcamentos"] });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("orcamentos").delete().eq("id", id);
    if (error) {
      console.error("[orcamentos] delete error:", error);
      return toast.error("Não foi possível remover o orçamento.");
    }
    qc.invalidateQueries({ queryKey: ["orcamentos"] });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Orçamentos</CardTitle>
        <CardDescription>
          Defina quanto pode gastar por categoria a cada mês. O que não tem limite vira despesa sem
          fim — e aí o Julius reclama.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {despesas.length ? (
          despesas.map((c) => {
            const atual = orcamentos.find(
              (o) => o.categoria.toLowerCase() === c.nome.toLowerCase(),
            );
            const value = draft[c.nome] ?? (atual ? String(atual.valor_limite) : "");
            return (
              <div key={c.id} className="flex flex-wrap items-end gap-2 rounded-lg border p-3">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Label className="text-xs capitalize">{c.nome}</Label>
                  <Input
                    inputMode="decimal"
                    placeholder="Sem limite"
                    value={value}
                    onChange={(e) => setDraft((d) => ({ ...d, [c.nome]: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-2">
                  {atual && (
                    <span className="tabular text-sm text-muted-foreground">
                      {formatCurrency(Number(atual.valor_limite), currency)}
                    </span>
                  )}
                  <Button size="sm" onClick={() => save(c.nome)}>
                    <Save className="mr-2 h-4 w-4" /> Salvar
                  </Button>
                  {atual && (
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Remover orçamento"
                      onClick={() => remove(atual.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground">Cadastre categorias de despesa primeiro.</p>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Recorrentes ───────────────────────────────────────────────── */

const emptyRec = {
  tipo: "despesa",
  valor: "",
  categoria: "",
  metodo_pagamento: "",
  descricao: "",
  dia_do_mes: "5",
};

export function RecorrentesTab() {
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const { data: instance } = useInstance();
  const { data: categories = [] } = useCategories();
  const { data: recorrentes = [] } = useRecorrentes();
  const [form, setForm] = useState({ ...emptyRec });
  const currency = profile?.currency ?? "BRL";

  async function create() {
    if (!profile || !instance) return;
    const valor = parseFloat(form.valor.replace(",", "."));
    const dia = parseInt(form.dia_do_mes, 10);
    if (isNaN(valor) || valor <= 0) return toast.error("Informe um valor válido.");
    if (isNaN(dia) || dia < 1 || dia > 28) return toast.error("O dia deve ser entre 1 e 28.");
    if (!form.descricao.trim()) return toast.error("Dê um nome à recorrência.");
    const { error } = await supabase.from("lancamentos_recorrentes").insert({
      user_id: profile.id,
      instance_id: instance.id,
      tipo: form.tipo,
      valor,
      categoria: form.categoria || null,
      metodo_pagamento: form.metodo_pagamento || null,
      descricao: form.descricao.trim().slice(0, 200),
      dia_do_mes: dia,
    } as never);
    if (error) {
      console.error("[recorrentes] insert error:", error);
      return toast.error("Não foi possível criar a recorrência.");
    }
    setForm({ ...emptyRec });
    toast.success("Recorrência criada.");
    qc.invalidateQueries({ queryKey: ["recorrentes"] });
  }

  async function toggle(id: string, ativo: boolean) {
    const { error } = await supabase
      .from("lancamentos_recorrentes")
      .update({ ativo } as never)
      .eq("id", id);
    if (error) {
      console.error("[recorrentes] update error:", error);
      return toast.error("Não foi possível atualizar a recorrência.");
    }
    qc.invalidateQueries({ queryKey: ["recorrentes"] });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("lancamentos_recorrentes").delete().eq("id", id);
    if (error) {
      console.error("[recorrentes] delete error:", error);
      return toast.error("Não foi possível remover a recorrência.");
    }
    toast.success("Recorrência removida.");
    qc.invalidateQueries({ queryKey: ["recorrentes"] });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nova recorrência</CardTitle>
          <CardDescription>
            Aluguel, Netflix, salário: o que se repete todo mês entra sozinho na data certa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Descrição</Label>
              <Input
                value={form.descricao}
                placeholder="Aluguel"
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Valor</Label>
              <Input
                inputMode="decimal"
                value={form.valor}
                placeholder="1500"
                onChange={(e) => setForm({ ...form, valor: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="despesa">Despesa</SelectItem>
                  <SelectItem value="receita">Receita</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Categoria</Label>
              <Select
                value={form.categoria}
                onValueChange={(v) => setForm({ ...form, categoria: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Escolher" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.nome}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Método</Label>
              <Input
                value={form.metodo_pagamento}
                placeholder="Pix, cartão..."
                onChange={(e) => setForm({ ...form, metodo_pagamento: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Dia do mês (1 a 28)</Label>
              <Input
                inputMode="numeric"
                value={form.dia_do_mes}
                onChange={(e) => setForm({ ...form, dia_do_mes: e.target.value })}
              />
            </div>
          </div>
          <Button onClick={create} disabled={!instance}>
            <Plus className="mr-2 h-4 w-4" /> Criar recorrência
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Suas recorrências</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recorrentes.length ? (
            recorrentes.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium">
                    <Repeat className="h-4 w-4 text-primary" />
                    <span className="truncate">{r.descricao ?? "Sem descrição"}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(Number(r.valor), currency)} · todo dia {r.dia_do_mes}
                    {r.categoria ? ` · ${r.categoria}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={r.tipo === "receita" ? "secondary" : "outline"}>{r.tipo}</Badge>
                  <Switch checked={r.ativo} onCheckedChange={(v) => toggle(r.id, v)} />
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Remover recorrência"
                    onClick={() => remove(r.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma recorrência cadastrada. Conta que chega todo mês merece estar aqui.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Metas ─────────────────────────────────────────────────────── */

export function MetasTab() {
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const { data: metas = [] } = useMetas();
  const [titulo, setTitulo] = useState("");
  const [alvo, setAlvo] = useState("");
  const [dataAlvo, setDataAlvo] = useState("");
  const currency = profile?.currency ?? "BRL";

  async function create() {
    if (!profile) return;
    const valor = parseFloat(alvo.replace(",", "."));
    if (!titulo.trim()) return toast.error("Dê um nome à meta.");
    if (isNaN(valor) || valor <= 0) return toast.error("Informe um valor alvo válido.");
    const { error } = await supabase.from("metas_economia").insert({
      user_id: profile.id,
      titulo: titulo.trim().slice(0, 120),
      valor_alvo: valor,
      data_alvo: dataAlvo || null,
    } as never);
    if (error) {
      console.error("[metas] insert error:", error);
      return toast.error("Não foi possível criar a meta.");
    }
    setTitulo("");
    setAlvo("");
    setDataAlvo("");
    toast.success("Meta criada.");
    qc.invalidateQueries({ queryKey: ["metas"] });
  }

  async function aportar(meta: Meta, valorStr: string) {
    const valor = parseFloat(valorStr.replace(",", "."));
    if (isNaN(valor) || valor <= 0) return toast.error("Informe um aporte válido.");
    const novo = Number(meta.valor_atual) + valor;
    const { error } = await supabase
      .from("metas_economia")
      .update({ valor_atual: novo } as never)
      .eq("id", meta.id);
    if (error) {
      console.error("[metas] update error:", error);
      return toast.error("Não foi possível registrar o aporte.");
    }
    qc.invalidateQueries({ queryKey: ["metas"] });
    if (novo >= Number(meta.valor_alvo)) {
      toast.success(`Meta "${meta.titulo}" concluída. Guardou tudo — isso é que é responsabilidade.`);
    } else {
      toast.success("Aporte registrado.");
    }
  }

  async function remove(id: string) {
    const { error } = await supabase.from("metas_economia").delete().eq("id", id);
    if (error) {
      console.error("[metas] delete error:", error);
      return toast.error("Não foi possível remover a meta.");
    }
    qc.invalidateQueries({ queryKey: ["metas"] });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nova meta de economia</CardTitle>
          <CardDescription>Ex.: "Viagem para o Rio — R$ 3.000 até dezembro".</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Título</Label>
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Viagem" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Valor alvo</Label>
              <Input
                inputMode="decimal"
                value={alvo}
                onChange={(e) => setAlvo(e.target.value)}
                placeholder="3000"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Data alvo (opcional)</Label>
              <Input type="date" value={dataAlvo} onChange={(e) => setDataAlvo(e.target.value)} />
            </div>
          </div>
          <Button onClick={create}>
            <Plus className="mr-2 h-4 w-4" /> Criar meta
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {metas.length ? (
          metas.map((m) => <MetaCard key={m.id} meta={m} currency={currency} onAporte={aportar} onRemove={remove} />)
        ) : (
          <Card className="md:col-span-2">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma meta ainda. Dinheiro guardado sem objetivo some — crie uma meta e o Julius fica
              de olho.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function MetaCard({
  meta,
  currency,
  onAporte,
  onRemove,
}: {
  meta: Meta;
  currency: string;
  onAporte: (m: Meta, v: string) => void;
  onRemove: (id: string) => void;
}) {
  const [aporte, setAporte] = useState("");
  const atual = Number(meta.valor_atual);
  const total = Number(meta.valor_alvo);
  const pct = total > 0 ? (atual / total) * 100 : 0;
  const concluida = pct >= 100;

  let restante: string | null = null;
  if (meta.data_alvo) {
    const dias = Math.ceil(
      (new Date(`${meta.data_alvo}T00:00:00`).getTime() - Date.now()) / 86400000,
    );
    restante =
      dias > 0
        ? dias >= 14
          ? `faltam ${Math.floor(dias / 7)} semanas`
          : `faltam ${dias} dias`
        : "prazo vencido";
  }

  return (
    <Card className={concluida ? "border-income/50" : undefined}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{meta.titulo}</CardTitle>
            <CardDescription>
              {formatCurrency(atual, currency)} de {formatCurrency(total, currency)}
              {meta.data_alvo ? ` · ${formatDate(meta.data_alvo)} (${restante})` : ""}
            </CardDescription>
          </div>
          <Button size="icon" variant="ghost" aria-label="Remover meta" onClick={() => onRemove(meta.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={Math.min(pct, 100)} className={concluida ? "[&>div]:bg-income" : ""} />
        {concluida ? (
          <div className="flex items-center gap-2 rounded-lg border border-income/40 bg-income/10 p-3 text-sm">
            <PartyPopper className="h-4 w-4 text-income" />
            <span>
              Meta concluída: {formatCurrency(total, currency)} guardados. Guardou tudo — o Julius
              aprova, mas continua conferindo.
            </span>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Label className="text-xs">Novo aporte</Label>
              <Input
                inputMode="decimal"
                value={aporte}
                placeholder="100"
                onChange={(e) => setAporte(e.target.value)}
              />
            </div>
            <Button
              onClick={() => {
                onAporte(meta, aporte);
                setAporte("");
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Aportar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
