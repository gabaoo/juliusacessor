// Regras puras de insights — recebem o resumo mensal vindo da view do banco.

export interface ResumoRow {
  mes: string;
  tipo: string;
  categoria: string;
  total: number;
}

export interface Insight {
  id: string;
  tone: "up" | "down" | "neutral";
  text: string;
}

export function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const key = (mes: string) => mes.slice(0, 7);

function sumByCategoria(rows: ResumoRow[], mes: string, tipo: string) {
  const map = new Map<string, number>();
  for (const r of rows) {
    if (key(r.mes) !== mes || r.tipo !== tipo) continue;
    map.set(r.categoria, (map.get(r.categoria) ?? 0) + r.total);
  }
  return map;
}

function sumTipo(rows: ResumoRow[], mes: string, tipo: string) {
  let total = 0;
  for (const r of rows) if (key(r.mes) === mes && r.tipo === tipo) total += r.total;
  return total;
}

const pct = (n: number) => `${Math.round(Math.abs(n))}%`;

export function buildInsights(
  rows: ResumoRow[],
  fmt: (v: number) => string,
  now = new Date(),
): Insight[] {
  const atual = monthKey(now);
  const anterior = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  const despAtual = sumByCategoria(rows, atual, "despesa");
  const despAnterior = sumByCategoria(rows, anterior, "despesa");
  const insights: Insight[] = [];

  // 1. Maior variação percentual por categoria (exige dados nos dois meses)
  let best: { cat: string; variacao: number } | null = null;
  for (const [cat, valor] of despAtual) {
    const antes = despAnterior.get(cat);
    if (!antes || antes <= 0 || valor <= 0) continue;
    const variacao = ((valor - antes) / antes) * 100;
    if (Math.abs(variacao) < 5) continue;
    if (!best || Math.abs(variacao) > Math.abs(best.variacao)) best = { cat, variacao };
  }
  if (best) {
    insights.push({
      id: "variacao",
      tone: best.variacao > 0 ? "up" : "down",
      text:
        best.variacao > 0
          ? `Você gastou ${pct(best.variacao)} a mais em ${best.cat} este mês que no mês passado.`
          : `Você gastou ${pct(best.variacao)} a menos em ${best.cat} este mês. Continua assim que a gente se entende.`,
    });
  }

  // 2. Categoria que mais pesa no total de despesas do mês
  const totalDespesa = sumTipo(rows, atual, "despesa");
  if (totalDespesa > 0) {
    let top: { cat: string; valor: number } | null = null;
    for (const [cat, valor] of despAtual) {
      if (!top || valor > top.valor) top = { cat, valor };
    }
    if (top) {
      insights.push({
        id: "maior-peso",
        tone: "neutral",
        text: `${top.cat} é sua maior despesa este mês: ${fmt(top.valor)}, ou seja ${pct(
          (top.valor / totalDespesa) * 100,
        )} de tudo que saiu.`,
      });
    }
  }

  // 3. Saldo vs mês anterior (só com dados do mês anterior)
  const temAnterior = rows.some((r) => key(r.mes) === anterior);
  if (temAnterior) {
    const saldoAtual = sumTipo(rows, atual, "receita") - totalDespesa;
    const saldoAnterior = sumTipo(rows, anterior, "receita") - sumTipo(rows, anterior, "despesa");
    const dif = saldoAtual - saldoAnterior;
    if (Math.abs(dif) > 0.005) {
      insights.push({
        id: "saldo",
        tone: dif > 0 ? "down" : "up",
        text:
          dif > 0
            ? `Seu saldo está ${fmt(dif)} melhor que o do mês passado (${fmt(saldoAtual)} agora).`
            : `Seu saldo caiu ${fmt(Math.abs(dif))} em relação ao mês passado — hoje está em ${fmt(saldoAtual)}.`,
      });
    }
  }

  return insights.slice(0, 3);
}
