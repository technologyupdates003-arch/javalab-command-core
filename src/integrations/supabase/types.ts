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
      api_keys: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          key_prefix: string
          label: string
          last_used_at: string | null
          revoked: boolean
          scopes: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          key_prefix: string
          label: string
          last_used_at?: string | null
          revoked?: boolean
          scopes?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          key_prefix?: string
          label?: string
          last_used_at?: string | null
          revoked?: boolean
          scopes?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          assigned_manager: string | null
          company: string | null
          created_at: string
          email: string | null
          id: string
          kyc_status: string
          name: string
          notes: string | null
          phone: string | null
          status: string
          tags: string[] | null
          type: string
          updated_at: string
        }
        Insert: {
          assigned_manager?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          kyc_status?: string
          name: string
          notes?: string | null
          phone?: string | null
          status?: string
          tags?: string[] | null
          type?: string
          updated_at?: string
        }
        Update: {
          assigned_manager?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          kyc_status?: string
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string
          tags?: string[] | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          color: string
          created_at: string
          description: string | null
          id: string
          lead_id: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          lead_id?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          lead_id?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_lead_fk"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_orders: {
        Row: {
          auth_code: string | null
          autorenew: boolean
          contact: Json | null
          created_at: string
          currency: string
          domain: string
          expires_at: string | null
          id: string
          ns1: string | null
          ns2: string | null
          ns3: string | null
          ns4: string | null
          operation: Database["public"]["Enums"]["domain_op"]
          ordered_by: string | null
          price: number
          raw_response: Json | null
          registrar: string
          registrar_order_id: string | null
          status: Database["public"]["Enums"]["domain_status"]
          tenant_id: string | null
          tld: string | null
          updated_at: string
          years: number
        }
        Insert: {
          auth_code?: string | null
          autorenew?: boolean
          contact?: Json | null
          created_at?: string
          currency?: string
          domain: string
          expires_at?: string | null
          id?: string
          ns1?: string | null
          ns2?: string | null
          ns3?: string | null
          ns4?: string | null
          operation?: Database["public"]["Enums"]["domain_op"]
          ordered_by?: string | null
          price?: number
          raw_response?: Json | null
          registrar?: string
          registrar_order_id?: string | null
          status?: Database["public"]["Enums"]["domain_status"]
          tenant_id?: string | null
          tld?: string | null
          updated_at?: string
          years?: number
        }
        Update: {
          auth_code?: string | null
          autorenew?: boolean
          contact?: Json | null
          created_at?: string
          currency?: string
          domain?: string
          expires_at?: string | null
          id?: string
          ns1?: string | null
          ns2?: string | null
          ns3?: string | null
          ns4?: string | null
          operation?: Database["public"]["Enums"]["domain_op"]
          ordered_by?: string | null
          price?: number
          raw_response?: Json | null
          registrar?: string
          registrar_order_id?: string | null
          status?: Database["public"]["Enums"]["domain_status"]
          tenant_id?: string | null
          tld?: string | null
          updated_at?: string
          years?: number
        }
        Relationships: [
          {
            foreignKeyName: "domain_orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_mailboxes: {
        Row: {
          address: string
          cpanel_response: Json | null
          created_at: string
          created_by: string | null
          domain: string
          expires_at: string | null
          hosting_account_id: string | null
          id: string
          password: string | null
          plan_id: string | null
          quota_mb: number
          status: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          address: string
          cpanel_response?: Json | null
          created_at?: string
          created_by?: string | null
          domain: string
          expires_at?: string | null
          hosting_account_id?: string | null
          id?: string
          password?: string | null
          plan_id?: string | null
          quota_mb?: number
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          cpanel_response?: Json | null
          created_at?: string
          created_by?: string | null
          domain?: string
          expires_at?: string | null
          hosting_account_id?: string | null
          id?: string
          password?: string | null
          plan_id?: string | null
          quota_mb?: number
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_mailboxes_hosting_account_id_fkey"
            columns: ["hosting_account_id"]
            isOneToOne: false
            referencedRelation: "hosting_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_mailboxes_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "email_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_mailboxes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_plans: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          id: string
          is_active: boolean
          mailbox_quota_mb: number
          max_mailboxes: number
          monthly_price: number
          name: string
          slug: string
          sort_order: number
          updated_at: string
          yearly_price: number
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          mailbox_quota_mb?: number
          max_mailboxes?: number
          monthly_price?: number
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
          yearly_price?: number
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          mailbox_quota_mb?: number
          max_mailboxes?: number
          monthly_price?: number
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
          yearly_price?: number
        }
        Relationships: []
      }
      finance_transactions: {
        Row: {
          amount: number
          category: string
          client_id: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          paid_at: string | null
          project_id: string | null
          reference: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          category?: string
          client_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          paid_at?: string | null
          project_id?: string | null
          reference?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          client_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          paid_at?: string | null
          project_id?: string | null
          reference?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      hosting_accounts: {
        Row: {
          billing_cycle: string
          cpanel_password: string | null
          cpanel_username: string | null
          created_at: string
          domain: string
          email: string | null
          expires_at: string | null
          id: string
          notes: string | null
          plan_id: string | null
          server_id: string | null
          status: Database["public"]["Enums"]["hosting_status"]
          suspended_at: string | null
          tenant_id: string | null
          updated_at: string
          whm_response: Json | null
        }
        Insert: {
          billing_cycle?: string
          cpanel_password?: string | null
          cpanel_username?: string | null
          created_at?: string
          domain: string
          email?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          plan_id?: string | null
          server_id?: string | null
          status?: Database["public"]["Enums"]["hosting_status"]
          suspended_at?: string | null
          tenant_id?: string | null
          updated_at?: string
          whm_response?: Json | null
        }
        Update: {
          billing_cycle?: string
          cpanel_password?: string | null
          cpanel_username?: string | null
          created_at?: string
          domain?: string
          email?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          plan_id?: string | null
          server_id?: string | null
          status?: Database["public"]["Enums"]["hosting_status"]
          suspended_at?: string | null
          tenant_id?: string | null
          updated_at?: string
          whm_response?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "hosting_accounts_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "hosting_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hosting_accounts_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "whm_servers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hosting_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      hosting_plans: {
        Row: {
          addon_domains: number | null
          bandwidth_mb: number | null
          created_at: string
          currency: string
          databases: number | null
          description: string | null
          disk_quota_mb: number | null
          email_accounts: number | null
          id: string
          is_active: boolean
          monthly_price: number
          name: string
          parked_domains: number | null
          slug: string
          subdomains: number | null
          updated_at: string
          whm_package: string
          yearly_price: number
        }
        Insert: {
          addon_domains?: number | null
          bandwidth_mb?: number | null
          created_at?: string
          currency?: string
          databases?: number | null
          description?: string | null
          disk_quota_mb?: number | null
          email_accounts?: number | null
          id?: string
          is_active?: boolean
          monthly_price?: number
          name: string
          parked_domains?: number | null
          slug: string
          subdomains?: number | null
          updated_at?: string
          whm_package: string
          yearly_price?: number
        }
        Update: {
          addon_domains?: number | null
          bandwidth_mb?: number | null
          created_at?: string
          currency?: string
          databases?: number | null
          description?: string | null
          disk_quota_mb?: number | null
          email_accounts?: number | null
          id?: string
          is_active?: boolean
          monthly_price?: number
          name?: string
          parked_domains?: number | null
          slug?: string
          subdomains?: number | null
          updated_at?: string
          whm_package?: string
          yearly_price?: number
        }
        Relationships: []
      }
      marketing_campaigns: {
        Row: {
          audience: string | null
          budget: number
          channel: string
          clicked: number
          created_at: string
          id: string
          name: string
          opened: number
          scheduled_at: string | null
          sent: number
          spent: number
          status: string
          updated_at: string
        }
        Insert: {
          audience?: string | null
          budget?: number
          channel?: string
          clicked?: number
          created_at?: string
          id?: string
          name: string
          opened?: number
          scheduled_at?: string | null
          sent?: number
          spent?: number
          status?: string
          updated_at?: string
        }
        Update: {
          audience?: string | null
          budget?: number
          channel?: string
          clicked?: number
          created_at?: string
          id?: string
          name?: string
          opened?: number
          scheduled_at?: string | null
          sent?: number
          spent?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      mpesa_transactions: {
        Row: {
          account_reference: string | null
          amount: number
          checkout_request_id: string | null
          created_at: string
          description: string | null
          id: string
          initiated_by: string | null
          merchant_request_id: string | null
          mpesa_receipt: string | null
          phone: string
          purpose: Database["public"]["Enums"]["mpesa_purpose"]
          raw_callback: Json | null
          raw_request: Json | null
          reference_id: string | null
          result_code: number | null
          result_desc: string | null
          status: Database["public"]["Enums"]["mpesa_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          account_reference?: string | null
          amount: number
          checkout_request_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          initiated_by?: string | null
          merchant_request_id?: string | null
          mpesa_receipt?: string | null
          phone: string
          purpose?: Database["public"]["Enums"]["mpesa_purpose"]
          raw_callback?: Json | null
          raw_request?: Json | null
          reference_id?: string | null
          result_code?: number | null
          result_desc?: string | null
          status?: Database["public"]["Enums"]["mpesa_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          account_reference?: string | null
          amount?: number
          checkout_request_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          initiated_by?: string | null
          merchant_request_id?: string | null
          mpesa_receipt?: string | null
          phone?: string
          purpose?: Database["public"]["Enums"]["mpesa_purpose"]
          raw_callback?: Json | null
          raw_request?: Json | null
          reference_id?: string | null
          result_code?: number | null
          result_desc?: string | null
          status?: Database["public"]["Enums"]["mpesa_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mpesa_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      office_items: {
        Row: {
          assignee_id: string | null
          body: string | null
          created_at: string
          created_by: string | null
          due_date: string | null
          id: string
          priority: string
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          body?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          body?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          display_name: string | null
          id: string
          job_title: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          id: string
          job_title?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          id?: string
          job_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          budget: number
          client_id: string | null
          code: string | null
          created_at: string
          currency: string
          department_id: string | null
          description: string | null
          due_date: string | null
          id: string
          lead_id: string | null
          name: string
          priority: string
          progress: number
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          budget?: number
          client_id?: string | null
          code?: string | null
          created_at?: string
          currency?: string
          department_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          name: string
          priority?: string
          progress?: number
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          budget?: number
          client_id?: string | null
          code?: string | null
          created_at?: string
          currency?: string
          department_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          name?: string
          priority?: string
          progress?: number
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          created_at: string
          description: string | null
          event_type: string
          id: string
          ip: string | null
          resolved: boolean
          severity: string
          source: string | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          ip?: string | null
          resolved?: boolean
          severity?: string
          source?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          ip?: string | null
          resolved?: boolean
          severity?: string
          source?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      site_blog_posts: {
        Row: {
          author: string | null
          body: string | null
          category: string
          cover_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_featured: boolean
          is_published: boolean
          published_at: string | null
          slug: string
          tags: Json
          title: string
          updated_at: string
          views: number
        }
        Insert: {
          author?: string | null
          body?: string | null
          category?: string
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          published_at?: string | null
          slug: string
          tags?: Json
          title: string
          updated_at?: string
          views?: number
        }
        Update: {
          author?: string | null
          body?: string | null
          category?: string
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          published_at?: string | null
          slug?: string
          tags?: Json
          title?: string
          updated_at?: string
          views?: number
        }
        Relationships: []
      }
      site_faqs: {
        Row: {
          answer: string
          category: string
          created_at: string
          id: string
          is_active: boolean
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      site_job_applications: {
        Row: {
          cover_letter: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          job_id: string | null
          phone: string | null
          resume_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          cover_letter?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          job_id?: string | null
          phone?: string | null
          resume_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          cover_letter?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          job_id?: string | null
          phone?: string | null
          resume_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "site_job_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      site_job_listings: {
        Row: {
          closes_at: string | null
          created_at: string
          department: string | null
          description: string | null
          employment_type: string
          experience_level: string | null
          id: string
          is_active: boolean
          location: string | null
          posted_at: string
          requirements: string | null
          salary_range: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          closes_at?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          employment_type?: string
          experience_level?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          posted_at?: string
          requirements?: string | null
          salary_range?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          closes_at?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          employment_type?: string
          experience_level?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          posted_at?: string
          requirements?: string | null
          salary_range?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_leads: {
        Row: {
          assigned_to: string | null
          attachments: Json
          budget_range: string | null
          company: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          message: string | null
          phone: string | null
          service_interest: string | null
          source: string
          status: string
          timeline: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          attachments?: Json
          budget_range?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          message?: string | null
          phone?: string | null
          service_interest?: string | null
          source?: string
          status?: string
          timeline?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          attachments?: Json
          budget_range?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          message?: string | null
          phone?: string | null
          service_interest?: string | null
          source?: string
          status?: string
          timeline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_partners: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          sort_order: number
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          sort_order?: number
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          sort_order?: number
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      site_portfolio: {
        Row: {
          category: string
          client_name: string | null
          completed_at: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          gallery: Json
          id: string
          is_active: boolean
          is_featured: boolean
          slug: string
          sort_order: number
          summary: string | null
          tech_stack: Json
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          category?: string
          client_name?: string | null
          completed_at?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          gallery?: Json
          id?: string
          is_active?: boolean
          is_featured?: boolean
          slug: string
          sort_order?: number
          summary?: string | null
          tech_stack?: Json
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          category?: string
          client_name?: string | null
          completed_at?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          gallery?: Json
          id?: string
          is_active?: boolean
          is_featured?: boolean
          slug?: string
          sort_order?: number
          summary?: string | null
          tech_stack?: Json
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      site_products: {
        Row: {
          billing_cycle: string
          category: string
          created_at: string
          currency: string
          description: string | null
          features: Json
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          name: string
          price: number
          screenshots: Json
          slug: string
          sort_order: number
          summary: string | null
          updated_at: string
        }
        Insert: {
          billing_cycle?: string
          category?: string
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          name: string
          price?: number
          screenshots?: Json
          slug: string
          sort_order?: number
          summary?: string | null
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          category?: string
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          name?: string
          price?: number
          screenshots?: Json
          slug?: string
          sort_order?: number
          summary?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_services: {
        Row: {
          category: string
          created_at: string
          currency: string
          description: string | null
          features: Json
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          slug: string
          sort_order: number
          starting_price: number
          tagline: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          slug: string
          sort_order?: number
          starting_price?: number
          tagline?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          slug?: string
          sort_order?: number
          starting_price?: number
          tagline?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_stats: {
        Row: {
          icon: string | null
          id: string
          key: string
          label: string
          sort_order: number
          suffix: string | null
          updated_at: string
          value: number
        }
        Insert: {
          icon?: string | null
          id?: string
          key: string
          label: string
          sort_order?: number
          suffix?: string | null
          updated_at?: string
          value?: number
        }
        Update: {
          icon?: string | null
          id?: string
          key?: string
          label?: string
          sort_order?: number
          suffix?: string | null
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      site_testimonials: {
        Row: {
          author: string
          avatar_url: string | null
          company: string | null
          created_at: string
          id: string
          is_active: boolean
          is_featured: boolean
          quote: string
          rating: number
          role: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          author: string
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          quote: string
          rating?: number
          role?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          author?: string
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          quote?: string
          rating?: number
          role?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      sms_campaigns: {
        Row: {
          audience: Json
          body: string
          cost: number
          created_at: string
          created_by: string | null
          delivered: number
          failed: number
          id: string
          name: string
          recurring: string | null
          schedule_at: string | null
          sender_id: string | null
          sent: number
          status: string
          template_id: string | null
          tenant_id: string
          total_recipients: number
          updated_at: string
        }
        Insert: {
          audience?: Json
          body: string
          cost?: number
          created_at?: string
          created_by?: string | null
          delivered?: number
          failed?: number
          id?: string
          name: string
          recurring?: string | null
          schedule_at?: string | null
          sender_id?: string | null
          sent?: number
          status?: string
          template_id?: string | null
          tenant_id: string
          total_recipients?: number
          updated_at?: string
        }
        Update: {
          audience?: Json
          body?: string
          cost?: number
          created_at?: string
          created_by?: string | null
          delivered?: number
          failed?: number
          id?: string
          name?: string
          recurring?: string | null
          schedule_at?: string | null
          sender_id?: string | null
          sent?: number
          status?: string
          template_id?: string | null
          tenant_id?: string
          total_recipients?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "sms_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_campaigns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_contact_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_contact_groups_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_contacts: {
        Row: {
          blacklisted: boolean
          created_at: string
          group_id: string | null
          id: string
          metadata: Json
          name: string | null
          phone: string
          tags: string[]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          blacklisted?: boolean
          created_at?: string
          group_id?: string | null
          id?: string
          metadata?: Json
          name?: string | null
          phone: string
          tags?: string[]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          blacklisted?: boolean
          created_at?: string
          group_id?: string | null
          id?: string
          metadata?: Json
          name?: string | null
          phone?: string
          tags?: string[]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_contacts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "sms_contact_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_contacts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_messages: {
        Row: {
          body: string
          campaign_id: string | null
          cost: number
          created_at: string
          id: string
          recipient: string
          segments: number
          sender_id: string | null
          sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          body: string
          campaign_id?: string | null
          cost?: number
          created_at?: string
          id?: string
          recipient: string
          segments?: number
          sender_id?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          body?: string
          campaign_id?: string | null
          cost?: number
          created_at?: string
          id?: string
          recipient?: string
          segments?: number
          sender_id?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      sms_outbox: {
        Row: {
          body: string
          campaign_id: string | null
          cost: number
          created_at: string
          delivered_at: string | null
          error: string | null
          id: string
          kind: string
          provider: string
          provider_message_id: string | null
          recipient: string
          scheduled_at: string | null
          segments: number
          sender_id: string | null
          sent_at: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          body: string
          campaign_id?: string | null
          cost?: number
          created_at?: string
          delivered_at?: string | null
          error?: string | null
          id?: string
          kind?: string
          provider?: string
          provider_message_id?: string | null
          recipient: string
          scheduled_at?: string | null
          segments?: number
          sender_id?: string | null
          sent_at?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          body?: string
          campaign_id?: string | null
          cost?: number
          created_at?: string
          delivered_at?: string | null
          error?: string | null
          id?: string
          kind?: string
          provider?: string
          provider_message_id?: string | null
          recipient?: string
          scheduled_at?: string | null
          segments?: number
          sender_id?: string | null
          sent_at?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_outbox_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "sms_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_outbox_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_sender_ids: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          network: string | null
          notes: string | null
          requested_by: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sender_id: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          network?: string | null
          notes?: string | null
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sender_id: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          network?: string | null
          notes?: string | null
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sender_id?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_sender_ids_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_templates: {
        Row: {
          body: string
          category: string
          created_at: string
          id: string
          name: string
          tenant_id: string
          updated_at: string
          variables: string[]
        }
        Insert: {
          body: string
          category?: string
          created_at?: string
          id?: string
          name: string
          tenant_id: string
          updated_at?: string
          variables?: string[]
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          id?: string
          name?: string
          tenant_id?: string
          updated_at?: string
          variables?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "sms_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_tenant_api_keys: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          key_hash: string
          key_prefix: string
          label: string
          last_used_at: string | null
          revoked: boolean
          scopes: string[]
          tenant_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          key_hash: string
          key_prefix: string
          label: string
          last_used_at?: string | null
          revoked?: boolean
          scopes?: string[]
          tenant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          key_hash?: string
          key_prefix?: string
          label?: string
          last_used_at?: string | null
          revoked?: boolean
          scopes?: string[]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_tenant_api_keys_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_tenant_wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_tenant_wallets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_webhook_endpoints: {
        Row: {
          created_at: string
          events: string[]
          id: string
          is_active: boolean
          secret: string | null
          tenant_id: string
          url: string
        }
        Insert: {
          created_at?: string
          events?: string[]
          id?: string
          is_active?: boolean
          secret?: string | null
          tenant_id: string
          url: string
        }
        Update: {
          created_at?: string
          events?: string[]
          id?: string
          is_active?: boolean
          secret?: string | null
          tenant_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_webhook_endpoints_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ssl_certificates: {
        Row: {
          auto_renew: boolean
          cert_type: string
          created_at: string
          created_by: string | null
          domain: string
          expires_at: string | null
          hosting_account_id: string | null
          id: string
          issued_at: string | null
          last_checked_at: string | null
          notes: string | null
          provider: string
          status: string
          tenant_id: string | null
          updated_at: string
          whm_response: Json | null
        }
        Insert: {
          auto_renew?: boolean
          cert_type?: string
          created_at?: string
          created_by?: string | null
          domain: string
          expires_at?: string | null
          hosting_account_id?: string | null
          id?: string
          issued_at?: string | null
          last_checked_at?: string | null
          notes?: string | null
          provider?: string
          status?: string
          tenant_id?: string | null
          updated_at?: string
          whm_response?: Json | null
        }
        Update: {
          auto_renew?: boolean
          cert_type?: string
          created_at?: string
          created_by?: string | null
          domain?: string
          expires_at?: string | null
          hosting_account_id?: string | null
          id?: string
          issued_at?: string | null
          last_checked_at?: string | null
          notes?: string | null
          provider?: string
          status?: string
          tenant_id?: string | null
          updated_at?: string
          whm_response?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ssl_certificates_hosting_account_id_fkey"
            columns: ["hosting_account_id"]
            isOneToOne: false
            referencedRelation: "hosting_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ssl_certificates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          avatar_url: string | null
          created_at: string
          currency: string
          department_id: string | null
          email: string | null
          employee_code: string | null
          employment_type: string
          full_name: string
          hire_date: string | null
          id: string
          job_title: string | null
          manager_id: string | null
          phone: string | null
          profile_id: string | null
          salary: number
          status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          currency?: string
          department_id?: string | null
          email?: string | null
          employee_code?: string | null
          employment_type?: string
          full_name: string
          hire_date?: string | null
          id?: string
          job_title?: string | null
          manager_id?: string | null
          phone?: string | null
          profile_id?: string | null
          salary?: number
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          currency?: string
          department_id?: string | null
          email?: string | null
          employee_code?: string | null
          employment_type?: string
          full_name?: string
          hire_date?: string | null
          id?: string
          job_title?: string | null
          manager_id?: string | null
          phone?: string | null
          profile_id?: string | null
          salary?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          features: Json
          id: string
          interval: string
          is_active: boolean
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          interval?: string
          is_active?: boolean
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          interval?: string
          is_active?: boolean
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number
          client_id: string
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          client_id: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assignee_id: string | null
          channel: string
          client_id: string | null
          created_at: string
          description: string | null
          id: string
          opened_at: string
          priority: string
          resolved_at: string | null
          status: string
          subject: string
          ticket_code: string | null
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          channel?: string
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          opened_at?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject: string
          ticket_code?: string | null
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          channel?: string
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          opened_at?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          ticket_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tenant_appointments: {
        Row: {
          created_at: string
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          duration_min: number
          id: string
          notes: string | null
          price: number
          service_id: string | null
          service_name: string | null
          staff_id: string | null
          starts_at: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          duration_min?: number
          id?: string
          notes?: string | null
          price?: number
          service_id?: string | null
          service_name?: string | null
          staff_id?: string | null
          starts_at: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          duration_min?: number
          id?: string
          notes?: string | null
          price?: number
          service_id?: string | null
          service_name?: string | null
          staff_id?: string | null
          starts_at?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "tenant_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "tenant_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_appointments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_branches: {
        Row: {
          address: string | null
          created_at: string
          id: string
          is_primary: boolean
          name: string
          phone: string | null
          tenant_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          name: string
          phone?: string | null
          tenant_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          name?: string
          phone?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_branches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_customers: {
        Row: {
          balance: number
          created_at: string
          email: string | null
          group_name: string | null
          id: string
          loyalty_points: number
          name: string
          notes: string | null
          phone: string | null
          tenant_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          email?: string | null
          group_name?: string | null
          id?: string
          loyalty_points?: number
          name: string
          notes?: string | null
          phone?: string | null
          tenant_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          email?: string | null
          group_name?: string | null
          id?: string
          loyalty_points?: number
          name?: string
          notes?: string | null
          phone?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_dining_orders: {
        Row: {
          code: string
          created_at: string
          guests: number | null
          id: string
          items: Json
          notes: string | null
          opened_by: string | null
          status: string
          subtotal: number
          table_id: string | null
          tenant_id: string
          total: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          guests?: number | null
          id?: string
          items?: Json
          notes?: string | null
          opened_by?: string | null
          status?: string
          subtotal?: number
          table_id?: string | null
          tenant_id: string
          total?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          guests?: number | null
          id?: string
          items?: Json
          notes?: string | null
          opened_by?: string | null
          status?: string
          subtotal?: number
          table_id?: string | null
          tenant_id?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_dining_orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tenant_dining_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_dining_orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_dining_tables: {
        Row: {
          branch_id: string | null
          created_at: string
          id: string
          label: string
          seats: number
          status: string
          tenant_id: string
          updated_at: string
          zone: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          id?: string
          label: string
          seats?: number
          status?: string
          tenant_id: string
          updated_at?: string
          zone?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          id?: string
          label?: string
          seats?: number
          status?: string
          tenant_id?: string
          updated_at?: string
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_dining_tables_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "tenant_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_dining_tables_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_invoices: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          invoice_no: string
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          period_end: string
          period_start: string
          status: string
          subscription_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          invoice_no: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          period_end?: string
          period_start?: string
          status?: string
          subscription_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          invoice_no?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          period_end?: string
          period_start?: string
          status?: string
          subscription_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "tenant_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_memberships: {
        Row: {
          created_at: string
          id: string
          pin: string | null
          role: Database["public"]["Enums"]["tenant_role"]
          status: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pin?: string | null
          role?: Database["public"]["Enums"]["tenant_role"]
          status?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pin?: string | null
          role?: Database["public"]["Enums"]["tenant_role"]
          status?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_memberships_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_prescriptions: {
        Row: {
          code: string
          created_at: string
          drugs: Json
          id: string
          notes: string | null
          patient_name: string
          patient_phone: string | null
          prescriber: string | null
          refills_total: number
          refills_used: number
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          drugs?: Json
          id?: string
          notes?: string | null
          patient_name: string
          patient_phone?: string | null
          prescriber?: string | null
          refills_total?: number
          refills_used?: number
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          drugs?: Json
          id?: string
          notes?: string | null
          patient_name?: string
          patient_phone?: string | null
          prescriber?: string | null
          refills_total?: number
          refills_used?: number
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_prescriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_product_subscriptions: {
        Row: {
          amount: number
          billing_cycle: string
          category: string
          created_at: string
          currency: string
          current_period_end: string | null
          current_period_start: string
          id: string
          metadata: Json
          product_name: string
          product_slug: string
          status: string
          subscribed_by: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          billing_cycle?: string
          category?: string
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string
          id?: string
          metadata?: Json
          product_name: string
          product_slug: string
          status?: string
          subscribed_by?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          billing_cycle?: string
          category?: string
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string
          id?: string
          metadata?: Json
          product_name?: string
          product_slug?: string
          status?: string
          subscribed_by?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_product_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_products: {
        Row: {
          barcode: string | null
          branch_id: string | null
          category: string | null
          cost: number
          created_at: string
          expiry_date: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price: number
          reorder_level: number
          sku: string | null
          stock: number
          tenant_id: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          branch_id?: string | null
          category?: string | null
          cost?: number
          created_at?: string
          expiry_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price?: number
          reorder_level?: number
          sku?: string | null
          stock?: number
          tenant_id: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          branch_id?: string | null
          category?: string | null
          cost?: number
          created_at?: string
          expiry_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price?: number
          reorder_level?: number
          sku?: string | null
          stock?: number
          tenant_id?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_products_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "tenant_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_sale_items: {
        Row: {
          id: string
          name: string
          product_id: string | null
          qty: number
          sale_id: string
          subtotal: number
          tenant_id: string
          unit_price: number
        }
        Insert: {
          id?: string
          name: string
          product_id?: string | null
          qty?: number
          sale_id: string
          subtotal?: number
          tenant_id: string
          unit_price?: number
        }
        Update: {
          id?: string
          name?: string
          product_id?: string | null
          qty?: number
          sale_id?: string
          subtotal?: number
          tenant_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "tenant_sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "tenant_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "tenant_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_sale_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_sales: {
        Row: {
          branch_id: string | null
          cashier_id: string
          created_at: string
          customer_id: string | null
          discount: number
          id: string
          payment_method: string
          payment_ref: string | null
          receipt_no: string
          shift_id: string | null
          status: string
          subtotal: number
          tax: number
          tenant_id: string
          total: number
        }
        Insert: {
          branch_id?: string | null
          cashier_id: string
          created_at?: string
          customer_id?: string | null
          discount?: number
          id?: string
          payment_method?: string
          payment_ref?: string | null
          receipt_no: string
          shift_id?: string | null
          status?: string
          subtotal?: number
          tax?: number
          tenant_id: string
          total?: number
        }
        Update: {
          branch_id?: string | null
          cashier_id?: string
          created_at?: string
          customer_id?: string | null
          discount?: number
          id?: string
          payment_method?: string
          payment_ref?: string | null
          receipt_no?: string
          shift_id?: string | null
          status?: string
          subtotal?: number
          tax?: number
          tenant_id?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "tenant_sales_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "tenant_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "tenant_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_sales_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "tenant_shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_sales_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_services: {
        Row: {
          active: boolean
          created_at: string
          duration_min: number
          id: string
          name: string
          price: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          duration_min?: number
          id?: string
          name: string
          price?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          duration_min?: number
          id?: string
          name?: string
          price?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_services_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_shifts: {
        Row: {
          branch_id: string | null
          cashier_id: string
          closed_at: string | null
          closing_cash: number | null
          expected_cash: number | null
          id: string
          notes: string | null
          opened_at: string
          opening_float: number
          status: string
          tenant_id: string
          variance: number | null
        }
        Insert: {
          branch_id?: string | null
          cashier_id: string
          closed_at?: string | null
          closing_cash?: number | null
          expected_cash?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opening_float?: number
          status?: string
          tenant_id: string
          variance?: number | null
        }
        Update: {
          branch_id?: string | null
          cashier_id?: string
          closed_at?: string | null
          closing_cash?: number | null
          expected_cash?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opening_float?: number
          status?: string
          tenant_id?: string
          variance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_shifts_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "tenant_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_shifts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_stock_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          product_id: string
          qty: number
          ref_id: string | null
          tenant_id: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          product_id: string
          qty: number
          ref_id?: string | null
          tenant_id: string
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          qty?: number
          ref_id?: string | null
          tenant_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "tenant_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_stock_movements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_subscriptions: {
        Row: {
          amount: number
          billing_cycle: string
          cancel_at_period_end: boolean
          created_at: string
          currency: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string | null
          plan_name: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          billing_cycle?: string
          cancel_at_period_end?: boolean
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string | null
          plan_name?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          billing_cycle?: string
          cancel_at_period_end?: boolean
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string | null
          plan_name?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          id: string
          name: string
          plan_id: string | null
          settings: Json
          slug: string
          status: string
          trial_ends_at: string | null
          updated_at: string
          vertical: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          name: string
          plan_id?: string | null
          settings?: Json
          slug: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
          vertical?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          name?: string
          plan_id?: string | null
          settings?: Json
          slug?: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
          vertical?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vault_entries: {
        Row: {
          category: string
          created_at: string
          department_id: string | null
          id: string
          notes: string | null
          owner_id: string | null
          secret: string
          title: string
          updated_at: string
          url: string | null
          username: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          department_id?: string | null
          id?: string
          notes?: string | null
          owner_id?: string | null
          secret: string
          title: string
          updated_at?: string
          url?: string | null
          username?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          department_id?: string | null
          id?: string
          notes?: string | null
          owner_id?: string | null
          secret?: string
          title?: string
          updated_at?: string
          url?: string | null
          username?: string | null
        }
        Relationships: []
      }
      whm_servers: {
        Row: {
          api_token: string
          created_at: string
          host: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          port: number
          updated_at: string
          username: string
        }
        Insert: {
          api_token: string
          created_at?: string
          host: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          port?: number
          updated_at?: string
          username: string
        }
        Update: {
          api_token?: string
          created_at?: string
          host?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          port?: number
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      credit_sms_wallet: {
        Args: { _amount: number; _tenant: string }
        Returns: number
      }
      current_user_tenants: { Args: never; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_tenant_role: {
        Args: {
          _roles: Database["public"]["Enums"]["tenant_role"][]
          _tenant: string
        }
        Returns: boolean
      }
      is_tenant_member: { Args: { _tenant: string }; Returns: boolean }
      provision_tenant: {
        Args: {
          p_name: string
          p_plan_id?: string
          p_slug: string
          p_vertical?: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "staff" | "client"
      domain_op: "register" | "transfer" | "renew"
      domain_status:
        | "pending"
        | "active"
        | "failed"
        | "expired"
        | "transferring"
        | "cancelled"
      hosting_status:
        | "pending"
        | "active"
        | "suspended"
        | "terminated"
        | "failed"
      mpesa_purpose:
        | "sms_topup"
        | "invoice"
        | "subscription"
        | "wallet_topup"
        | "hosting"
      mpesa_status: "pending" | "success" | "failed" | "cancelled"
      tenant_role:
        | "owner"
        | "manager"
        | "supervisor"
        | "cashier"
        | "sales_agent"
        | "inventory_manager"
        | "accountant"
        | "support"
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
    Enums: {
      app_role: ["super_admin", "admin", "staff", "client"],
      domain_op: ["register", "transfer", "renew"],
      domain_status: [
        "pending",
        "active",
        "failed",
        "expired",
        "transferring",
        "cancelled",
      ],
      hosting_status: [
        "pending",
        "active",
        "suspended",
        "terminated",
        "failed",
      ],
      mpesa_purpose: [
        "sms_topup",
        "invoice",
        "subscription",
        "wallet_topup",
        "hosting",
      ],
      mpesa_status: ["pending", "success", "failed", "cancelled"],
      tenant_role: [
        "owner",
        "manager",
        "supervisor",
        "cashier",
        "sales_agent",
        "inventory_manager",
        "accountant",
        "support",
      ],
    },
  },
} as const
