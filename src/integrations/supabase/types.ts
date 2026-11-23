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
      cart_history: {
        Row: {
          action: string
          actor: string | null
          cart_id: string
          created_at: string
          id: string
          product_name: string | null
          quantity: number | null
        }
        Insert: {
          action: string
          actor?: string | null
          cart_id: string
          created_at?: string
          id?: string
          product_name?: string | null
          quantity?: number | null
        }
        Update: {
          action?: string
          actor?: string | null
          cart_id?: string
          created_at?: string
          id?: string
          product_name?: string | null
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_history_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          currency: string
          id: string
          image: string | null
          name: string
          product_id: string
          quantity: number
          reference: string
          supplier: string | null
          unit_price: number
        }
        Insert: {
          cart_id: string
          created_at?: string
          currency: string
          id?: string
          image?: string | null
          name: string
          product_id: string
          quantity: number
          reference: string
          supplier?: string | null
          unit_price: number
        }
        Update: {
          cart_id?: string
          created_at?: string
          currency?: string
          id?: string
          image?: string | null
          name?: string
          product_id?: string
          quantity?: number
          reference?: string
          supplier?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "carts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          slug: string
          sort: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          sort?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          sort?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          assigned_to: string | null
          cart_id: string | null
          client_id: string
          created_at: string
          department: string
          id: string
          last_message_at: string
          subject: string | null
        }
        Insert: {
          assigned_to?: string | null
          cart_id?: string | null
          client_id: string
          created_at?: string
          department?: string
          id?: string
          last_message_at?: string
          subject?: string | null
        }
        Update: {
          assigned_to?: string | null
          cart_id?: string | null
          client_id?: string
          created_at?: string
          department?: string
          id?: string
          last_message_at?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: true
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          product_id: string
          user_id: string
        }
        Insert: {
          product_id: string
          user_id: string
        }
        Update: {
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string | null
          conversation_id: string
          created_at: string
          id: string
          kind: string
          payload: Json | null
          read_at: string | null
          reply_to: string | null
          sender_id: string | null
        }
        Insert: {
          body?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          kind?: string
          payload?: Json | null
          read_at?: string | null
          reply_to?: string | null
          sender_id?: string | null
        }
        Update: {
          body?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          kind?: string
          payload?: Json | null
          read_at?: string | null
          reply_to?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          agent_id: string | null
          client_id: string
          created_at: string
          currency: string
          description: string | null
          id: string
          order_number: string
          status: string
          total_amount: number | null
        }
        Insert: {
          agent_id?: string | null
          client_id: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          order_number?: string
          status?: string
          total_amount?: number | null
        }
        Update: {
          agent_id?: string | null
          client_id?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          order_number?: string
          status?: string
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          currency: string
          description: string | null
          dimensions: string | null
          id: string
          images: string[]
          lead_time: string | null
          min_qty: number
          name: string
          origin: string | null
          popularity: number
          price: number
          published: boolean
          reference: string
          slug: string
          stock: number | null
          supplier: string | null
          video_url: string | null
          weight_kg: number | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          dimensions?: string | null
          id?: string
          images?: string[]
          lead_time?: string | null
          min_qty?: number
          name: string
          origin?: string | null
          popularity?: number
          price: number
          published?: boolean
          reference: string
          slug: string
          stock?: number | null
          supplier?: string | null
          video_url?: string | null
          weight_kg?: number | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          dimensions?: string | null
          id?: string
          images?: string[]
          lead_time?: string | null
          min_qty?: number
          name?: string
          origin?: string | null
          popularity?: number
          price?: number
          published?: boolean
          reference?: string
          slug?: string
          stock?: number | null
          supplier?: string | null
          video_url?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      shipment_events: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          internal_note: string | null
          location: string | null
          occurred_at: string
          public_note: string | null
          shipment_id: string
          source: string
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          internal_note?: string | null
          location?: string | null
          occurred_at?: string
          public_note?: string | null
          shipment_id: string
          source?: string
          status: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          internal_note?: string | null
          location?: string | null
          occurred_at?: string
          public_note?: string | null
          shipment_id?: string
          source?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          awb: string | null
          bl: string | null
          booking: string | null
          carrier: string | null
          client_id: string
          container: string | null
          created_at: string
          created_by: string | null
          destination: string
          eta: string | null
          id: string
          mode: string
          order_id: string
          origin: string
          packages: number | null
          shipment_number: string
          status: string
          tracking_code: string | null
          updated_at: string
          vessel: string | null
          volume_cbm: number | null
          weight_kg: number | null
        }
        Insert: {
          awb?: string | null
          bl?: string | null
          booking?: string | null
          carrier?: string | null
          client_id: string
          container?: string | null
          created_at?: string
          created_by?: string | null
          destination?: string
          eta?: string | null
          id?: string
          mode: string
          order_id: string
          origin?: string
          packages?: number | null
          shipment_number?: string
          status?: string
          tracking_code?: string | null
          updated_at?: string
          vessel?: string | null
          volume_cbm?: number | null
          weight_kg?: number | null
        }
        Update: {
          awb?: string | null
          bl?: string | null
          booking?: string | null
          carrier?: string | null
          client_id?: string
          container?: string | null
          created_at?: string
          created_by?: string | null
          destination?: string
          eta?: string | null
          id?: string
          mode?: string
          order_id?: string
          origin?: string
          packages?: number | null
          shipment_number?: string
          status?: string
          tracking_code?: string | null
          updated_at?: string
          vessel?: string | null
          volume_cbm?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          address_cameroon: string | null
          address_china: string | null
          company_name: string
          email: string | null
          id: number
          phone: string | null
          rate_eur_xaf: number | null
          rate_usd_xaf: number | null
          rates_updated_at: string | null
          slogan: string | null
          tracking_prefix: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address_cameroon?: string | null
          address_china?: string | null
          company_name?: string
          email?: string | null
          id?: number
          phone?: string | null
          rate_eur_xaf?: number | null
          rate_usd_xaf?: number | null
          rates_updated_at?: string | null
          slogan?: string | null
          tracking_prefix?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address_cameroon?: string | null
          address_china?: string | null
          company_name?: string
          email?: string | null
          id?: number
          phone?: string | null
          rate_eur_xaf?: number | null
          rate_usd_xaf?: number | null
          rates_updated_at?: string | null
          slogan?: string | null
          tracking_prefix?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
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
      submit_cart: { Args: { _cart_id: string }; Returns: string }
      track_shipment: { Args: { _q: string }; Returns: Json }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "commercial"
        | "sourcing"
        | "logistique"
        | "support"
        | "finance"
        | "client"
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
      app_role: [
        "super_admin",
        "admin",
        "commercial",
        "sourcing",
        "logistique",
        "support",
        "finance",
        "client",
      ],
    },
  },
} as const
