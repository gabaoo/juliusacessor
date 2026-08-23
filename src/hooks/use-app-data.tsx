import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Instance {
  id: string;
  user_id: string;
  nome_instancia: string;
  whatsapp_number: string;
  status: string;
  webhook_secret: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  theme: string;
  timezone: string;
  currency: string;
}

export interface Category {
  id: string;
  user_id: string;
  nome: string;
  cor: string;
  icone: string;
  tipo: string;
}

export interface Transaction {
  id: string;
  instance_id: string;
  tipo: string;
  valor: number;
  categoria: string | null;
  metodo_pagamento: string | null;
  descricao: string | null;
  data: string;
  hora: string | null;
  resposta_usuario: string | null;
  created_at: string;
  origem?: string | null;
}

export interface Message {
  id: string;
  instance_id: string;
  conteudo: string | null;
  resposta: string | null;
  created_at: string;
}

export function useInstance() {
  return useQuery({
    queryKey: ["instance"],
    queryFn: async (): Promise<Instance | null> => {
      const { data, error } = await supabase.from("instances").select("*").maybeSingle();
      if (error) throw error;
      return data as Instance | null;
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase.from("profiles").select("*").maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase.from("categories").select("*").order("nome");
      if (error) throw error;
      return (data ?? []) as Category[];
    },
  });
}

export async function signOutClean(navigate: (opts: { to: string; replace?: boolean }) => void) {
  await supabase.auth.signOut();
  navigate({ to: "/auth", replace: true });
}
