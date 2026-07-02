import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useInstance, useProfile, useCategories } from "@/hooks/use-app-data";
import { useTransactions, type TxFilters } from "@/hooks/use-transactions";
import { FilterBar } from "@/components/FilterBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, firstDayOfMonthISO, lastDayOfMonthISO, formatDate } from "@/lib/format";
import { computeTotals, groupByCategory, groupByDay } from "@/lib/finance";
import { exportToCsv } from "@/lib/csv";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, Wallet, Download, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_app/dashboard")({
  component: Dashboard,
});

const PIE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "oklch(0.6 0.15 200)",
  "oklch(0.65 0.18 340)",
];

function Dashboard() {
  const { data: instance } = useInstance();
  const { data: profile } = useProfile();
  const { data: categories = [] } = useCategories();
  const [filters, setFilters] = useState<TxFilters>({
    from: firstDayOfMonthISO(),
    to: lastDayOfMonthISO(),
  });
  const { data: txns = [], isLoading } = useTransactions(instance?.id, filters);
  const currency = profile?.currency ?? "BRL";

  const totals = useMemo(() => computeTotals(txns), [txns]);
  const byCategory = useMemo(() => groupByCategory(txns, "despesa"), [txns]);
  const byDay = useMemo(
    () => groupByDay(txns).map((d) => ({ ...d, label: formatDate(d.data).slice(0, 5) })),
    [txns],
  );

  function handleExport() {
    exportToCsv(
      `julius-dashboard-${filters.from}_${filters.to}.csv`,
      txns.map((t) => ({
        data: t.data,
        hora: t.hora ?? "",
        tipo: t.tipo,
        valor: t.valor,
        categoria: t.categoria ?? "",
        metodo_pagamento: t.metodo_pagamento ?? "",
        descricao: t.descricao ?? "",
      })),
      [
        { key: "data", label: "Data" },
        { key: "hora", label: "Hora" },
        { key: "tipo", label: "Tipo" },
        { key: "valor", label: "Valor" },
        { key: "categoria", label: "Categoria" },
        { key: "metodo_pagamento", label: "Método" },
        { key: "descricao", label: "Descrição" },
      ],
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Olá, {profile?.display_name ?? "por aqui"} — este é o resumo das suas finanças.
          </p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={!txns.length}>
          <Download className="mr-2 h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      <FilterBar filters={filters} onChange={setFilters} categories={categories} hideAdvanced />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Receitas"
          value={formatCurrency(totals.receitas, currency)}
          icon={<ArrowUpRight className="h-5 w-5" />}
          tone="income"
        />
        <SummaryCard
          title="Despesas"
          value={formatCurrency(totals.despesas, currency)}
          icon={<ArrowDownRight className="h-5 w-5" />}
          tone="expense"
        />
        <SummaryCard
          title="Saldo do período"
          value={formatCurrency(totals.saldo, currency)}
          icon={<Wallet className="h-5 w-5" />}
          tone={totals.saldo >= 0 ? "income" : "expense"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Despesas por categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {byCategory.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={55} outerRadius={100} paddingAngle={2}>
                    {byCategory.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Receitas x Despesas por dia</CardTitle>
          </CardHeader>
          <CardContent>
            {byDay.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={byDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" fontSize={12} stroke="var(--muted-foreground)" />
                  <YAxis fontSize={12} stroke="var(--muted-foreground)" width={48} />
                  <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
                  <Legend />
                  <Bar dataKey="receita" name="Receitas" fill="var(--income)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesa" name="Despesas" fill="var(--expense)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gastos diários</CardTitle>
        </CardHeader>
        <CardContent>
          {byDay.some((d) => d.despesa > 0) ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={byDay} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradDespesa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--expense)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--expense)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" fontSize={12} stroke="var(--muted-foreground)" />
                <YAxis fontSize={12} stroke="var(--muted-foreground)" width={52} />
                <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
                <Area
                  type="monotone"
                  dataKey="despesa"
                  name="Gastos"
                  stroke="var(--expense)"
                  strokeWidth={2}
                  fill="url(#gradDespesa)"
                  dot={{ r: 3, fill: "var(--expense)" }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </CardContent>
      </Card>

      {!isLoading && !txns.length && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <TrendingUp className="h-8 w-8 text-primary" />
            <p className="font-medium text-foreground">Nada por aqui ainda</p>
            <p className="max-w-sm text-sm">
              Mande uma mensagem pro Julius no WhatsApp registrando uma receita ou despesa. Ela aparece aqui na hora.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  tone,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  tone: "income" | "expense";
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="tabular mt-1 text-2xl font-bold">{value}</p>
        </div>
        <div
          className={
            tone === "income"
              ? "flex h-11 w-11 items-center justify-center rounded-xl bg-income/15 text-income"
              : "flex h-11 w-11 items-center justify-center rounded-xl bg-expense/15 text-expense"
          }
        >
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
      Sem dados no período selecionado.
    </div>
  );
}
