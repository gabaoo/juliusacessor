import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Transaction, Message } from "./use-app-data";

export interface TxFilters {
  from?: string;
  to?: string;
  categoria?: string;
  tipo?: string;
  minValor?: number;
  maxValor?: number;
  search?: string;
}

export function useTransactions(instanceId: string | undefined, filters: TxFilters) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["transactions", instanceId, filters],
    enabled: !!instanceId,
    queryFn: async (): Promise<Transaction[]> => {
      let q = supabase
        .from("transactions")
        .select("*")
        .eq("instance_id", instanceId!)
        .order("data", { ascending: false })
        .order("hora", { ascending: false });

      if (filters.from) q = q.gte("data", filters.from);
      if (filters.to) q = q.lte("data", filters.to);
      if (filters.categoria) q = q.eq("categoria", filters.categoria);
      if (filters.tipo) q = q.eq("tipo", filters.tipo);
      if (filters.minValor != null) q = q.gte("valor", filters.minValor);
      if (filters.maxValor != null) q = q.lte("valor", filters.maxValor);
      if (filters.search) q = q.ilike("descricao", `%${filters.search}%`);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Transaction[];
    },
  });

  useEffect(() => {
    if (!instanceId) return;
    const channel = supabase
      .channel(`tx-${instanceId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions", filter: `instance_id=eq.${instanceId}` },
        () => qc.invalidateQueries({ queryKey: ["transactions"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [instanceId, qc]);

  return query;
}

export function useMessages(instanceId: string | undefined, search: string, from?: string, to?: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["messages", instanceId, search, from, to],
    enabled: !!instanceId,
    queryFn: async (): Promise<Message[]> => {
      let q = supabase
        .from("messages")
        .select("*")
        .eq("instance_id", instanceId!)
        .order("created_at", { ascending: false })
        .limit(500);
      if (from) q = q.gte("created_at", `${from}T00:00:00`);
      if (to) q = q.lte("created_at", `${to}T23:59:59`);
      if (search) q = q.or(`conteudo.ilike.%${search}%,resposta.ilike.%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Message[];
    },
  });

  useEffect(() => {
    if (!instanceId) return;
    const channel = supabase
      .channel(`msg-${instanceId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `instance_id=eq.${instanceId}` },
        () => qc.invalidateQueries({ queryKey: ["messages"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [instanceId, qc]);

  return query;
}
