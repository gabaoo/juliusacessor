import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/* ─── Tipos ─────────────────────────────────────────────────────── */

export interface Orcamento {
  id: string;
  user_id: string;
  categoria: string;
  valor_limite: number;
  recorrente: boolean;
}

export interface Recorrente {
  id: string;
  user_id: string;
  instance_id: string;
  tipo: string;
  valor: number;
  categoria: string | null;
  metodo_pagamento: string | null;
  descricao: string | null;
  dia_do_mes: number;
  ativo: boolean;
  ultimo_mes_gerado: string | null;
}

export interface Meta {
  id: string;
  user_id: string;
  titulo: string;
  valor_alvo: number;
  valor_atual: number;
  data_alvo: string | null;
  ativo: boolean;
  created_at: string;
}

export interface ResumoMensal {
  instance_id: string;
  mes: string;
  tipo: string;
  categoria: string;
  total: number;
  qtd: number;
}

/* ─── Queries ───────────────────────────────────────────────────── */

export function useOrcamentos() {
  return useQuery({
    queryKey: ["orcamentos"],
    queryFn: async (): Promise<Orcamento[]> => {
      const { data, error } = await supabase.from("orcamentos").select("*").order("categoria");
      if (error) throw error;
      return (data ?? []) as unknown as Orcamento[];
    },
  });
}

export function useRecorrentes() {
  return useQuery({
    queryKey: ["recorrentes"],
    queryFn: async (): Promise<Recorrente[]> => {
      const { data, error } = await supabase
        .from("lancamentos_recorrentes")
        .select("*")
        .order("dia_do_mes");
      if (error) throw error;
      return (data ?? []) as unknown as Recorrente[];
    },
  });
}

export function useMetas() {
  return useQuery({
    queryKey: ["metas"],
    queryFn: async (): Promise<Meta[]> => {
      const { data, error } = await supabase
        .from("metas_economia")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Meta[];
    },
  });
}

/** Resumo mensal por categoria (view no banco) para o mês atual e o anterior. */
export function useResumoMensal(instanceId: string | undefined) {
  return useQuery({
    queryKey: ["resumo-mensal", instanceId],
    enabled: !!instanceId,
    queryFn: async (): Promise<ResumoMensal[]> => {
      const now = new Date();
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const iso = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
      const { data, error } = await supabase
        .from("v_resumo_mensal_categoria")
        .select("*")
        .eq("instance_id", instanceId!)
        .gte("mes", iso(prev));
      if (error) throw error;
      return (data ?? []).map((r) => ({
        ...(r as unknown as ResumoMensal),
        total: Number((r as { total: number | string }).total) || 0,
      }));
    },
  });
}
