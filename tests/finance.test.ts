import { describe, it, expect } from "vitest";
import {
  computeTotals,
  groupByCategory,
  groupByDay,
  filterTransactions,
  parseValor,
  type TxLike,
} from "../src/lib/finance";

const sample: TxLike[] = [
  { tipo: "receita", valor: 700, categoria: "Serviços", descricao: "Cliente A", data: "2026-06-01" },
  { tipo: "despesa", valor: 100, categoria: "Alimentação", descricao: "Mercado", data: "2026-06-01" },
  { tipo: "despesa", valor: 50, categoria: "Alimentação", descricao: "Padaria", data: "2026-06-02" },
  { tipo: "despesa", valor: 200, categoria: "Transporte", descricao: "Uber", data: "2026-06-03" },
  { tipo: "receita", valor: "150.50", categoria: "Salário", descricao: "Extra", data: "2026-06-03" },
];

describe("computeTotals (dashboard totals)", () => {
  it("sums receitas, despesas and saldo, handling string values", () => {
    const t = computeTotals(sample);
    expect(t.receitas).toBeCloseTo(850.5);
    expect(t.despesas).toBe(350);
    expect(t.saldo).toBeCloseTo(500.5);
  });

  it("returns zeros for an empty list", () => {
    expect(computeTotals([])).toEqual({ receitas: 0, despesas: 0, saldo: 0 });
  });
});

describe("groupByCategory", () => {
  it("aggregates expenses by category, sorted desc", () => {
    const g = groupByCategory(sample, "despesa");
    expect(g[0]).toEqual({ name: "Transporte", value: 200 });
    expect(g.find((x) => x.name === "Alimentação")?.value).toBe(150);
  });
});

describe("groupByDay", () => {
  it("aggregates receita/despesa per day in date order", () => {
    const g = groupByDay(sample);
    expect(g[0]).toEqual({ data: "2026-06-01", receita: 700, despesa: 100 });
    expect(g[2]).toEqual({ data: "2026-06-03", receita: 150.5, despesa: 200 });
  });
});

describe("filterTransactions (advanced filters)", () => {
  it("filters by date range", () => {
    const r = filterTransactions(sample, { from: "2026-06-02", to: "2026-06-02" });
    expect(r).toHaveLength(1);
    expect(r[0].descricao).toBe("Padaria");
  });

  it("filters by category and type", () => {
    expect(filterTransactions(sample, { categoria: "Alimentação" })).toHaveLength(2);
    expect(filterTransactions(sample, { tipo: "receita" })).toHaveLength(2);
  });

  it("filters by value range (inclusive, coercing strings)", () => {
    const r = filterTransactions(sample, { minValor: 100, maxValor: 200 });
    expect(r.map((x) => Number(x.valor)).sort((a, b) => a - b)).toEqual([100, 150.5, 200]);
  });

  it("filters by keyword in description (case-insensitive)", () => {
    const r = filterTransactions(sample, { search: "uber" });
    expect(r).toHaveLength(1);
    expect(r[0].categoria).toBe("Transporte");
  });
});

describe("parseValor (webhook value coercion)", () => {
  it("passes numbers through", () => {
    expect(parseValor(700)).toBe(700);
  });
  it("parses currency-like strings", () => {
    expect(parseValor("R$ 1.234,56".replace(".", ""))).toBeCloseTo(1234.56);
    expect(parseValor("42,90")).toBeCloseTo(42.9);
  });
  it("returns 0 for invalid input", () => {
    expect(parseValor(null)).toBe(0);
    expect(parseValor(undefined)).toBe(0);
    expect(parseValor("abc")).toBe(0);
  });
});
