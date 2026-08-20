export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          cor: string
          created_at: string
          icone: string
          id: string
          nome: string
          tipo: string
          user_id: string
        }
        Insert: {
          cor?: string
          created_at?: string
          icone?: string
          id?: string
          nome: string
          tipo?: string
          user_id: string
        }
        Update: {
          cor?: string
          created_at?: string
          icone?: string
          id?: string
          nome?: string
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
      instances: {
        Row: {
          created_at: string
          id: string
          nome_instancia: string
          status: string
          updated_at: string
          user_id: string
          webhook_secret: string
          whatsapp_number: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome_instancia: string
          status?: string
          updated_at?: string
          user_id: string
          webhook_secret?: string
          whatsapp_number: string
        }
        Update: {
          created_at?: string
          id?: string
          nome_instancia?: string
          status?: string
          updated_at?: string
          user_id?: string
          webhook_secret?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
      lancamentos_recorrentes: {
        Row: {
          ativo: boolean
          categoria: string | null
          created_at: string
          descricao: string | null
          dia_do_mes: number
          id: string
          instance_id: string
          metodo_pagamento: string | null
          tipo: string
          ultimo_mes_gerado: string | null
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          dia_do_mes?: number
          id?: string
          instance_id: string
          metodo_pagamento?: string | null
          tipo?: string
          ultimo_mes_gerado?: string | null
          updated_at?: string
          user_id: string
          valor?: number
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          dia_do_mes?: number
          id?: string
          instance_id?: string
          metodo_pagamento?: string | null
          tipo?: string
          ultimo_mes_gerado?: string | null
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_recorrentes_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          conteudo: string | null
          created_at: string
          id: string
          instance_id: string
          resposta: string | null
        }
        Insert: {
          conteudo?: string | null
          created_at?: string
          id?: string
          instance_id: string
          resposta?: string | null
        }
        Update: {
          conteudo?: string | null
          created_at?: string
          id?: string
          instance_id?: string
          resposta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
        ]
      }
      metas_economia: {
        Row: {
          ativo: boolean
          created_at: string
          data_alvo: string | null
          id: string
          titulo: string
          updated_at: string
          user_id: string
          valor_alvo: number
          valor_atual: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          data_alvo?: string | null
          id?: string
          titulo: string
          updated_at?: string
          user_id: string
          valor_alvo?: number
          valor_atual?: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          data_alvo?: string | null
          id?: string
          titulo?: string
          updated_at?: string
          user_id?: string
          valor_alvo?: number
          valor_atual?: number
        }
        Relationships: []
      }
      orcamentos: {
        Row: {
          categoria: string
          created_at: string
          id: string
          recorrente: boolean
          updated_at: string
          user_id: string
          valor_limite: number
        }
        Insert: {
          categoria: string
          created_at?: string
          id?: string
          recorrente?: boolean
          updated_at?: string
          user_id: string
          valor_limite?: number
        }
        Update: {
          categoria?: string
          created_at?: string
          id?: string
          recorrente?: boolean
          updated_at?: string
          user_id?: string
          valor_limite?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          currency: string
          display_name: string | null
          email: string | null
          id: string
          theme: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          display_name?: string | null
          email?: string | null
          id: string
          theme?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          display_name?: string | null
          email?: string | null
          id?: string
          theme?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          categoria: string | null
          created_at: string
          data: string
          descricao: string | null
          hora: string | null
          id: string
          instance_id: string
          metodo_pagamento: string | null
          origem: string
          resposta_usuario: string | null
          tipo: string
          updated_at: string
          valor: number
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          data?: string
          descricao?: string | null
          hora?: string | null
          id?: string
          instance_id: string
          metodo_pagamento?: string | null
          origem?: string
          resposta_usuario?: string | null
          tipo: string
          updated_at?: string
          valor?: number
        }
        Update: {
          categoria?: string | null
          created_at?: string
          data?: string
          descricao?: string | null
          hora?: string | null
          id?: string
          instance_id?: string
          metodo_pagamento?: string | null
          origem?: string
          resposta_usuario?: string | null
          tipo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_resumo_mensal_categoria: {
        Row: {
          categoria: string | null
          instance_id: string | null
          mes: string | null
          qtd: number | null
          tipo: string | null
          total: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      gerar_lancamentos_recorrentes: { Args: never; Returns: number }
      owns_instance: { Args: { _instance_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
