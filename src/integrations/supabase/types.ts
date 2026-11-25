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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      conversas: {
        Row: {
          criado_em: string
          id: string
          titulo: string
          user_id: string
        }
        Insert: {
          criado_em?: string
          id?: string
          titulo?: string
          user_id: string
        }
        Update: {
          criado_em?: string
          id?: string
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      documentos_oficiais: {
        Row: {
          criado_em: string
          data_vigencia: string | null
          fonte: string | null
          id: string
          texto: string
          tipo: string
          titulo: string
        }
        Insert: {
          criado_em?: string
          data_vigencia?: string | null
          fonte?: string | null
          id?: string
          texto: string
          tipo: string
          titulo: string
        }
        Update: {
          criado_em?: string
          data_vigencia?: string | null
          fonte?: string | null
          id?: string
          texto?: string
          tipo?: string
          titulo?: string
        }
        Relationships: []
      }
      equipe_setores: {
        Row: {
          setor: string
          user_id: string
        }
        Insert: {
          setor: string
          user_id: string
        }
        Update: {
          setor?: string
          user_id?: string
        }
        Relationships: []
      }
      feedbacks: {
        Row: {
          comentario: string | null
          criado_em: string
          id: string
          mensagem_id: string | null
          nota: number | null
          user_id: string
        }
        Insert: {
          comentario?: string | null
          criado_em?: string
          id?: string
          mensagem_id?: string | null
          nota?: number | null
          user_id: string
        }
        Update: {
          comentario?: string | null
          criado_em?: string
          id?: string
          mensagem_id?: string | null
          nota?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedbacks_mensagem_id_fkey"
            columns: ["mensagem_id"]
            isOneToOne: false
            referencedRelation: "mensagens"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_acoes: {
        Row: {
          acao: string
          criado_em: string
          detalhes: Json | null
          id: string
          user_id: string | null
        }
        Insert: {
          acao: string
          criado_em?: string
          detalhes?: Json | null
          id?: string
          user_id?: string | null
        }
        Update: {
          acao?: string
          criado_em?: string
          detalhes?: Json | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      mensagens: {
        Row: {
          conteudo: string
          conversa_id: string
          criado_em: string
          id: string
          papel: string
          user_id: string
        }
        Insert: {
          conteudo: string
          conversa_id: string
          criado_em?: string
          id?: string
          papel: string
          user_id: string
        }
        Update: {
          conteudo?: string
          conversa_id?: string
          criado_em?: string
          id?: string
          papel?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "conversas"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis: {
        Row: {
          aceite_privacidade_em: string | null
          criado_em: string
          curso: string
          email: string | null
          id: string
          matricula: string
          nome: string
          semestre: string | null
        }
        Insert: {
          aceite_privacidade_em?: string | null
          criado_em?: string
          curso?: string
          email?: string | null
          id: string
          matricula?: string
          nome?: string
          semestre?: string | null
        }
        Update: {
          aceite_privacidade_em?: string | null
          criado_em?: string
          curso?: string
          email?: string | null
          id?: string
          matricula?: string
          nome?: string
          semestre?: string | null
        }
        Relationships: []
      }
      preferencias: {
        Row: {
          atualizado_em: string
          canal_preferido: string | null
          lembretes_ativos: boolean | null
          memoria_longa_ativa: boolean
          nivel_linguagem: string | null
          user_id: string
        }
        Insert: {
          atualizado_em?: string
          canal_preferido?: string | null
          lembretes_ativos?: boolean | null
          memoria_longa_ativa?: boolean
          nivel_linguagem?: string | null
          user_id: string
        }
        Update: {
          atualizado_em?: string
          canal_preferido?: string | null
          lembretes_ativos?: boolean | null
          memoria_longa_ativa?: boolean
          nivel_linguagem?: string | null
          user_id?: string
        }
        Relationships: []
      }
      protocolos: {
        Row: {
          criado_em: string
          detalhes_restritos: string | null
          id: string
          restrito: boolean
          resumo: string
          setor: string
          status: string
          tipo: string
          user_id: string
        }
        Insert: {
          criado_em?: string
          detalhes_restritos?: string | null
          id?: string
          restrito?: boolean
          resumo: string
          setor: string
          status?: string
          tipo: string
          user_id: string
        }
        Update: {
          criado_em?: string
          detalhes_restritos?: string | null
          id?: string
          restrito?: boolean
          resumo?: string
          setor?: string
          status?: string
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
      protocolos_restritos: {
        Row: {
          conteudo: string
          protocolo_id: string
          setor: string
        }
        Insert: {
          conteudo: string
          protocolo_id: string
          setor: string
        }
        Update: {
          conteudo?: string
          protocolo_id?: string
          setor?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocolos_restritos_protocolo_id_fkey"
            columns: ["protocolo_id"]
            isOneToOne: true
            referencedRelation: "protocolos"
            referencedColumns: ["id"]
          },
        ]
      }
      resumos_conversa: {
        Row: {
          conversa_id: string | null
          criado_em: string
          expira_em: string
          id: string
          resumo: string
          user_id: string
        }
        Insert: {
          conversa_id?: string | null
          criado_em?: string
          expira_em?: string
          id?: string
          resumo: string
          user_id: string
        }
        Update: {
          conversa_id?: string | null
          criado_em?: string
          expira_em?: string
          id?: string
          resumo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resumos_conversa_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "conversas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mascarar_texto: { Args: { t: string }; Returns: string }
      pertence_setor: {
        Args: { _setor: string; _user_id: string }
        Returns: boolean
      }
      salvar_resumo_seguro: {
        Args: { _conversa_id: string; _temas: string[] }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "estudante" | "equipe"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["estudante", "equipe"],
    },
  },
} as const
