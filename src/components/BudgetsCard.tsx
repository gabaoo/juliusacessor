import { useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useOrcamentos, useResumoMensal } from "@/hooks/use-planning";
import { monthKey } from "@/lib/insights";
import { formatCurrency } from "@/lib/format";
import { Target } from "lucide-react";

export function BudgetsCard({
  instanceId,
  currency,
}: {
  instanceId: string | undefined;
  currency: string;
}) {
  const { data: orcamentos = [] } = useOrcamentos();
  const { data: rows = [] } = useResumoMensal(instanceId);

  const gastoPorCategoria = useMemo(() => {
    const atual = monthKey(new Date());
    const map = new Map<string, number>();
    for (const r of rows) {
      if (r.mes.slice(0, 7) !== atual || r.tipo !== "despesa") continue;
      const k = r.categoria.toLowerCase();
      map.set(k, (map.get(k) ?? 0) + r.total);
    }
    return map;
  }, [rows]);

  const itens = orcamentos.filter((o) => Number(o.valor_limite) > 0);

  return (
    <Card>
      <CardHeader>
        <h2 className="flex items-center gap-2 text-base font-semibold leading-none">
          <Target className="h-4 w-4 text-primary" /> Orçamentos do mês
        </h2>
      </CardHeader>
      <CardContent className="space-y-4">
        {itens.length ? (
          itens.map((o) => {
            const limite = Number(o.valor_limite);
            const gasto = gastoPorCategoria.get(o.categoria.toLowerCase()) ?? 0;
            const pct = (gasto / limite) * 100;
            return (
              <div key={o.id} className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium capitalize">{o.categoria}</span>
                    {pct > 100 ? (
                      <Badge variant="destructive">Estourou</Badge>
                    ) : pct > 80 ? (
                      <Badge className="border-transparent bg-warning/20 text-warning">Atenção</Badge>
                    ) : null}
                  </div>
                  <span className="tabular text-sm text-muted-foreground">
                    {formatCurrency(gasto, currency)} de {formatCurrency(limite, currency)}
                  </span>
                </div>
                <Progress
                  value={Math.min(pct, 100)}
                  className={pct > 100 ? "[&>div]:bg-expense" : pct > 80 ? "[&>div]:bg-warning" : ""}
                />
              </div>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhum orçamento definido ainda. Vá em Configurações → Orçamentos e diga quanto pode
            gastar por categoria. Dinheiro sem limite é igual criança sem hora pra dormir.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
