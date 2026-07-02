import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { TxFilters } from "@/hooks/use-transactions";
import type { Category } from "@/hooks/use-app-data";
import { firstDayOfMonthISO, lastDayOfMonthISO } from "@/lib/format";
import { RotateCcw } from "lucide-react";

const ALL = "__all__";

interface Props {
  filters: TxFilters;
  onChange: (f: TxFilters) => void;
  categories: Category[];
  showType?: boolean;
  hideAdvanced?: boolean;
}

export function FilterBar({ filters, onChange, categories, showType = true, hideAdvanced = false }: Props) {
  const set = (patch: Partial<TxFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="grid grid-cols-1 gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-1.5">
        <Label className="text-xs">De</Label>
        <Input type="date" value={filters.from ?? ""} onChange={(e) => set({ from: e.target.value || undefined })} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Até</Label>
        <Input type="date" value={filters.to ?? ""} onChange={(e) => set({ to: e.target.value || undefined })} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Categoria</Label>
        <Select
          value={filters.categoria ?? ALL}
          onValueChange={(v) => set({ categoria: v === ALL ? undefined : v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.nome}>
                {c.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {showType && (
        <div className="space-y-1.5">
          <Label className="text-xs">Tipo</Label>
          <Select value={filters.tipo ?? ALL} onValueChange={(v) => set({ tipo: v === ALL ? undefined : v })}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos</SelectItem>
              <SelectItem value="receita">Receitas</SelectItem>
              <SelectItem value="despesa">Despesas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      {!hideAdvanced && (
        <div className="space-y-1.5">
          <Label className="text-xs">Valor mín.</Label>
          <Input
            type="number"
            inputMode="decimal"
            value={filters.minValor ?? ""}
            onChange={(e) => set({ minValor: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="0"
          />
        </div>
      )}
      {!hideAdvanced && (
        <div className="space-y-1.5">
          <Label className="text-xs">Valor máx.</Label>
          <Input
            type="number"
            inputMode="decimal"
            value={filters.maxValor ?? ""}
            onChange={(e) => set({ maxValor: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="∞"
          />
        </div>
      )}
      {!hideAdvanced && (
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
          <Label className="text-xs">Busca (descrição)</Label>
          <Input
            value={filters.search ?? ""}
            onChange={(e) => set({ search: e.target.value || undefined })}
            placeholder="Palavra-chave..."
          />
        </div>
      )}
      <div className="flex items-end">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => onChange({ from: firstDayOfMonthISO(), to: lastDayOfMonthISO() })}
        >
          <RotateCcw className="mr-2 h-4 w-4" /> Mês atual
        </Button>
      </div>
    </div>
  );
}
