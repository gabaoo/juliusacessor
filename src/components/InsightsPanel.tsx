import { useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useResumoMensal } from "@/hooks/use-planning";
import { buildInsights } from "@/lib/insights";
import { formatCurrency } from "@/lib/format";
import { Lightbulb, TrendingDown, TrendingUp, Info } from "lucide-react";

export function InsightsPanel({
  instanceId,
  currency,
}: {
  instanceId: string | undefined;
  currency: string;
}) {
  const { data: rows = [], isLoading } = useResumoMensal(instanceId);
  const insights = useMemo(
    () => buildInsights(rows, (v) => formatCurrency(v, currency)),
    [rows, currency],
  );

  return (
    <Card>
      <CardHeader>
        <h2 className="flex items-center gap-2 text-base font-semibold leading-none">
          <Lightbulb className="h-4 w-4 text-primary" /> Julius observou
        </h2>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.length ? (
          insights.map((i) => {
            const Icon = i.tone === "up" ? TrendingUp : i.tone === "down" ? TrendingDown : Info;
            const color =
              i.tone === "up" ? "text-expense" : i.tone === "down" ? "text-income" : "text-primary";
            return (
              <div key={i.id} className="flex items-start gap-3 rounded-lg border bg-card p-3">
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} />
                <p className="text-sm text-foreground">{i.text}</p>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Fazendo as contas..."
              : "Ainda não há histórico suficiente para comparar dois meses. Registre mais lançamentos — o Julius não inventa número, ele confere."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
