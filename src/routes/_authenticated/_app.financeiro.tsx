import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useInstance, useProfile, useCategories } from "@/hooks/use-app-data";
import { useTransactions, type TxFilters } from "@/hooks/use-transactions";
import { FilterBar } from "@/components/FilterBar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate, formatTime, firstDayOfMonthISO, lastDayOfMonthISO } from "@/lib/format";
import { exportToCsv } from "@/lib/csv";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import type { Transaction } from "@/hooks/use-app-data";
import { toast } from "sonner";
import { Pencil, Trash2, Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_app/financeiro")({
  component: Financeiro,
});

function Financeiro() {
  const qc = useQueryClient();
  const { data: instance } = useInstance();
  const { data: profile } = useProfile();
  const { data: categories = [] } = useCategories();
  const [tab, setTab] = useState<"receita" | "despesa">("despesa");
  const [filters, setFilters] = useState<TxFilters>({ from: firstDayOfMonthISO(), to: lastDayOfMonthISO() });
  const { data: allTx = [] } = useTransactions(instance?.id, filters);
  const currency = profile?.currency ?? "BRL";

  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);

  const rows = useMemo(() => allTx.filter((t) => t.tipo === tab), [allTx, tab]);

  async function saveEdit(form: Partial<Transaction>) {
    if (!editing) return;
    const { error } = await supabase
      .from("transactions")
      .update({
        valor: form.valor,
        categoria: form.categoria,
        metodo_pagamento: form.metodo_pagamento,
        descricao: form.descricao,
        data: form.data,
        hora: form.hora,
      })
      .eq("id", editing.id);
    if (error) {
      console.error("[transactions] update error:", error);
      toast.error("Não foi possível atualizar o lançamento. Tente novamente.");
      return;
    }
    toast.success("Lançamento atualizado.");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["transactions"] });
  }

  async function confirmDelete() {
    if (!deleting) return;
    const { error } = await supabase.from("transactions").delete().eq("id", deleting.id);
    if (error) {
      console.error("[transactions] delete error:", error);
      toast.error("Não foi possível excluir o lançamento. Tente novamente.");
      return;
    }
    toast.success("Lançamento excluído.");
    setDeleting(null);
    qc.invalidateQueries({ queryKey: ["transactions"] });
  }

  function handleExport() {
    exportToCsv(
      `julius-${tab}s.csv`,
      rows.map((t) => ({
        data: t.data,
        hora: t.hora ?? "",
        valor: t.valor,
        categoria: t.categoria ?? "",
        metodo_pagamento: t.metodo_pagamento ?? "",
        descricao: t.descricao ?? "",
      })),
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-sm text-muted-foreground">Todos os lançamentos, prontos para revisar.</p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={!rows.length}>
          <Download className="mr-2 h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "receita" | "despesa")}>
        <TabsList>
          <TabsTrigger value="despesa">Despesas</TabsTrigger>
          <TabsTrigger value="receita">Receitas</TabsTrigger>
        </TabsList>
      </Tabs>

      <FilterBar filters={filters} onChange={setFilters} categories={categories} showType={false} />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length ? (
                  rows.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="tabular whitespace-nowrap">{formatDate(t.data)}</TableCell>
                      <TableCell className="tabular whitespace-nowrap">{formatTime(t.hora)}</TableCell>
                      <TableCell>{t.categoria ?? "—"}</TableCell>
                      <TableCell>{t.metodo_pagamento ?? "—"}</TableCell>
                      <TableCell className="max-w-xs truncate">{t.descricao ?? "—"}</TableCell>
                      <TableCell
                        className={`tabular whitespace-nowrap text-right font-semibold ${
                          t.tipo === "receita" ? "text-income" : "text-expense"
                        }`}
                      >
                        {formatCurrency(t.valor, currency)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" aria-label="Editar lançamento" onClick={() => setEditing(t)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" aria-label="Excluir lançamento" onClick={() => setDeleting(t)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                      Nenhum lançamento neste período.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar lançamento</DialogTitle>
          </DialogHeader>
          {editing && (
            <EditForm
              key={editing.id}
              tx={editing}
              categories={categories.map((c) => c.nome)}
              onSave={saveEdit}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. O lançamento será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EditForm({
  tx,
  categories,
  onSave,
  onCancel,
}: {
  tx: Transaction;
  categories: string[];
  onSave: (f: Partial<Transaction>) => void;
  onCancel: () => void;
}) {
  const [valor, setValor] = useState(String(tx.valor));
  const [categoria, setCategoria] = useState(tx.categoria ?? "");
  const [metodo, setMetodo] = useState(tx.metodo_pagamento ?? "");
  const [descricao, setDescricao] = useState(tx.descricao ?? "");
  const [data, setData] = useState(tx.data);
  const [hora, setHora] = useState(tx.hora ?? "");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Valor</Label>
          <Input type="number" value={valor} onChange={(e) => setValor(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Categoria</Label>
          <Select value={categoria || "__none__"} onValueChange={(v) => setCategoria(v === "__none__" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Sem categoria</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Data</Label>
          <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Hora</Label>
          <Input type="time" step="1" value={hora} onChange={(e) => setHora(e.target.value)} />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Método de pagamento</Label>
          <Input value={metodo} onChange={(e) => setMetodo(e.target.value)} placeholder="Pix, cartão..." />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Descrição</Label>
          <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          onClick={() =>
            onSave({
              valor: Number(valor),
              categoria: categoria || null,
              metodo_pagamento: metodo || null,
              descricao: descricao || null,
              data,
              hora: hora || null,
            })
          }
        >
          Salvar
        </Button>
      </DialogFooter>
    </div>
  );
}
