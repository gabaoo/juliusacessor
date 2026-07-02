// Pure finance helpers — shared by the dashboard UI and unit tests.

export interface TxLike {
  tipo: string;
  valor: number | string;
  categoria?: string | null;
  descricao?: string | null;
  data: string;
}

export interface Totals {
  receitas: number;
  despesas: number;
  saldo: number;
}

const num = (v: number | string) => (typeof v === "string" ? parseFloat(v) || 0 : v);

export function computeTotals(txns: TxLike[]): Totals {
  let receitas = 0;
  let despesas = 0;
  for (const t of txns) {
    if (t.tipo === "receita") receitas += num(t.valor);
    else if (t.tipo === "despesa") despesas += num(t.valor);
  }
  return { receitas, despesas, saldo: receitas - despesas };
}

export function groupByCategory(txns: TxLike[], tipo = "despesa"): { name: string; value: number }[] {
  const map = new Map<string, number>();
  for (const t of txns) {
    if (t.tipo !== tipo) continue;
    const key = t.categoria || "Sem categoria";
    map.set(key, (map.get(key) ?? 0) + num(t.valor));
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function groupByDay(txns: TxLike[]): { data: string; receita: number; despesa: number }[] {
  const map = new Map<string, { data: string; receita: number; despesa: number }>();
  for (const t of txns) {
    const cur = map.get(t.data) ?? { data: t.data, receita: 0, despesa: 0 };
    if (t.tipo === "receita") cur.receita += num(t.valor);
    else if (t.tipo === "despesa") cur.despesa += num(t.valor);
    map.set(t.data, cur);
  }
  return Array.from(map.values()).sort((a, b) => a.data.localeCompare(b.data));
}

export interface FinanceFilter {
  from?: string;
  to?: string;
  categoria?: string;
  tipo?: string;
  minValor?: number;
  maxValor?: number;
  search?: string;
}

export function filterTransactions<T extends TxLike>(txns: T[], f: FinanceFilter): T[] {
  return txns.filter((t) => {
    if (f.from && t.data < f.from) return false;
    if (f.to && t.data > f.to) return false;
    if (f.categoria && t.categoria !== f.categoria) return false;
    if (f.tipo && t.tipo !== f.tipo) return false;
    if (f.minValor != null && num(t.valor) < f.minValor) return false;
    if (f.maxValor != null && num(t.valor) > f.maxValor) return false;
    if (f.search && !(t.descricao ?? "").toLowerCase().includes(f.search.toLowerCase())) return false;
    return true;
  });
}

/** Parse a possibly-string monetary value into a number (mirrors webhook logic). */
export function parseValor(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[^\d.,-]/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}
