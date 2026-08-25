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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      ai_analyses: {
        Row: {
          analysis_type: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          input_summary: string | null
          model_used: string | null
          result: Json
          user_id: string
        }
        Insert: {
          analysis_type: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          input_summary?: string | null
          model_used?: string | null
          result?: Json
          user_id: string
        }
        Update: {
          analysis_type?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          input_summary?: string | null
          model_used?: string | null
          result?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_analyses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          metadata: Json
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_leads: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          lead_id: string
          status: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          lead_id: string
          status?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          lead_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_leads_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_leads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          approval_mode: Database["public"]["Enums"]["approval_mode"]
          created_at: string
          follow_up_sequence: Json
          id: string
          lead_filters: Json
          message_template: string | null
          name: string
          schedule: Json
          service: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          target_audience: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_mode?: Database["public"]["Enums"]["approval_mode"]
          created_at?: string
          follow_up_sequence?: Json
          id?: string
          lead_filters?: Json
          message_template?: string | null
          name: string
          schedule?: Json
          service?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          target_audience?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_mode?: Database["public"]["Enums"]["approval_mode"]
          created_at?: string
          follow_up_sequence?: Json
          id?: string
          lead_filters?: Json
          message_template?: string | null
          name?: string
          schedule?: Json
          service?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          target_audience?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_inquiries: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          business_name: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          location: string | null
          notes: string | null
          opportunity_id: string | null
          phone: string | null
          role_title: string | null
          source_reference: string | null
          updated_at: string
          user_id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          website: string | null
          website_id: string | null
        }
        Insert: {
          business_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          opportunity_id?: string | null
          phone?: string | null
          role_title?: string | null
          source_reference?: string | null
          updated_at?: string
          user_id: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          website?: string | null
          website_id?: string | null
        }
        Update: {
          business_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          opportunity_id?: string | null
          phone?: string | null
          role_title?: string | null
          source_reference?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          website?: string | null
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_messages: {
        Row: {
          ai_extracted: Json | null
          ai_intent: Database["public"]["Enums"]["reply_intent"] | null
          ai_sentiment: string | null
          body: string
          conversation_id: string
          created_at: string
          direction: string
          external_message_id: string | null
          id: string
          recipient: string | null
          sender: string | null
          sent_at: string
          subject: string | null
          user_id: string
        }
        Insert: {
          ai_extracted?: Json | null
          ai_intent?: Database["public"]["Enums"]["reply_intent"] | null
          ai_sentiment?: string | null
          body: string
          conversation_id: string
          created_at?: string
          direction: string
          external_message_id?: string | null
          id?: string
          recipient?: string | null
          sender?: string | null
          sent_at?: string
          subject?: string | null
          user_id: string
        }
        Update: {
          ai_extracted?: Json | null
          ai_intent?: Database["public"]["Enums"]["reply_intent"] | null
          ai_sentiment?: string | null
          body?: string
          conversation_id?: string
          created_at?: string
          direction?: string
          external_message_id?: string | null
          id?: string
          recipient?: string | null
          sender?: string | null
          sent_at?: string
          subject?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          ai_classification: Database["public"]["Enums"]["reply_intent"] | null
          archived: boolean
          channel: Database["public"]["Enums"]["outreach_channel"]
          contact_id: string | null
          created_at: string
          email_account_id: string | null
          external_thread_id: string | null
          id: string
          last_message_at: string | null
          lead_id: string | null
          recommended_reply: string | null
          subject: string | null
          unread: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_classification?: Database["public"]["Enums"]["reply_intent"] | null
          archived?: boolean
          channel?: Database["public"]["Enums"]["outreach_channel"]
          contact_id?: string | null
          created_at?: string
          email_account_id?: string | null
          external_thread_id?: string | null
          id?: string
          last_message_at?: string | null
          lead_id?: string | null
          recommended_reply?: string | null
          subject?: string | null
          unread?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_classification?: Database["public"]["Enums"]["reply_intent"] | null
          archived?: boolean
          channel?: Database["public"]["Enums"]["outreach_channel"]
          contact_id?: string | null
          created_at?: string
          email_account_id?: string | null
          external_thread_id?: string | null
          id?: string
          last_message_at?: string | null
          lead_id?: string | null
          recommended_reply?: string | null
          subject?: string | null
          unread?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_email_account_id_fkey"
            columns: ["email_account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_account_tokens: {
        Row: {
          access_token_encrypted: string | null
          created_at: string
          email_account_id: string
          refresh_token_encrypted: string | null
          token_expiry: string | null
          updated_at: string
        }
        Insert: {
          access_token_encrypted?: string | null
          created_at?: string
          email_account_id: string
          refresh_token_encrypted?: string | null
          token_expiry?: string | null
          updated_at?: string
        }
        Update: {
          access_token_encrypted?: string | null
          created_at?: string
          email_account_id?: string
          refresh_token_encrypted?: string | null
          token_expiry?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_account_tokens_email_account_id_fkey"
            columns: ["email_account_id"]
            isOneToOne: true
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      email_accounts: {
        Row: {
          created_at: string
          email_address: string
          history_id: string | null
          id: string
          last_sync_at: string | null
          provider: string
          scopes: string[]
          status: Database["public"]["Enums"]["email_account_status"]
          updated_at: string
          user_id: string
          watch_expiration: string | null
        }
        Insert: {
          created_at?: string
          email_address: string
          history_id?: string | null
          id?: string
          last_sync_at?: string | null
          provider?: string
          scopes?: string[]
          status?: Database["public"]["Enums"]["email_account_status"]
          updated_at?: string
          user_id: string
          watch_expiration?: string | null
        }
        Update: {
          created_at?: string
          email_address?: string
          history_id?: string | null
          id?: string
          last_sync_at?: string | null
          provider?: string
          scopes?: string[]
          status?: Database["public"]["Enums"]["email_account_status"]
          updated_at?: string
          user_id?: string
          watch_expiration?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_ups: {
        Row: {
          body: string | null
          campaign_id: string | null
          cancelled_reason: string | null
          created_at: string
          id: string
          lead_id: string | null
          outreach_message_id: string | null
          scheduled_at: string
          sent_at: string | null
          status: string
          step: number
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          campaign_id?: string | null
          cancelled_reason?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          outreach_message_id?: string | null
          scheduled_at: string
          sent_at?: string | null
          status?: string
          step?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          campaign_id?: string | null
          cancelled_reason?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          outreach_message_id?: string | null
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          step?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_outreach_message_id_fkey"
            columns: ["outreach_message_id"]
            isOneToOne: false
            referencedRelation: "outreach_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          connected_at: string | null
          created_at: string
          id: string
          last_error: string | null
          metadata: Json
          provider: Database["public"]["Enums"]["integration_provider"]
          status: Database["public"]["Enums"]["integration_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          connected_at?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          metadata?: Json
          provider: Database["public"]["Enums"]["integration_provider"]
          status?: Database["public"]["Enums"]["integration_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          connected_at?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          metadata?: Json
          provider?: Database["public"]["Enums"]["integration_provider"]
          status?: Database["public"]["Enums"]["integration_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          error: string | null
          id: string
          job_name: string
          payload: Json
          run_after: string
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          job_name: string
          payload?: Json
          run_after?: string
          started_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          job_name?: string
          payload?: Json
          run_after?: string
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      lead_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          lead_id: string
          payload: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          lead_id: string
          payload?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          lead_id?: string
          payload?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_notes: {
        Row: {
          body: string
          created_at: string
          id: string
          lead_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          lead_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          lead_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          company_name: string | null
          contact_id: string | null
          created_at: string
          estimated_value: number | null
          id: string
          is_demo: boolean
          opportunity_id: string | null
          opportunity_source:
            | Database["public"]["Enums"]["opportunity_source_type"]
            | null
          score: number | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
          user_id: string
          website_id: string | null
          website_url: string | null
        }
        Insert: {
          company_name?: string | null
          contact_id?: string | null
          created_at?: string
          estimated_value?: number | null
          id?: string
          is_demo?: boolean
          opportunity_id?: string | null
          opportunity_source?:
            | Database["public"]["Enums"]["opportunity_source_type"]
            | null
          score?: number | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          user_id: string
          website_id?: string | null
          website_url?: string | null
        }
        Update: {
          company_name?: string | null
          contact_id?: string | null
          created_at?: string
          estimated_value?: number | null
          id?: string
          is_demo?: boolean
          opportunity_id?: string | null
          opportunity_source?:
            | Database["public"]["Enums"]["opportunity_source_type"]
            | null
          score?: number | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          user_id?: string
          website_id?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          href: string | null
          id: string
          metadata: Json
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          href?: string | null
          id?: string
          metadata?: Json
          read_at?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          href?: string | null
          id?: string
          metadata?: Json
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_states: {
        Row: {
          code_verifier: string | null
          created_at: string
          expires_at: string
          id: string
          provider: string
          redirect_to: string | null
          state: string
          user_id: string
        }
        Insert: {
          code_verifier?: string | null
          created_at?: string
          expires_at: string
          id?: string
          provider: string
          redirect_to?: string | null
          state: string
          user_id: string
        }
        Update: {
          code_verifier?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          provider?: string
          redirect_to?: string | null
          state?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_states_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          company_name: string | null
          contact_available: boolean
          content_hash: string | null
          created_at: string
          discovered_at: string
          domain: string | null
          estimated_need: string | null
          freshness_status: Database["public"]["Enums"]["freshness_status"]
          id: string
          industry: string | null
          is_demo: boolean
          last_verified_at: string | null
          location: string | null
          matching_service: string | null
          normalized_url: string | null
          opportunity_score: number | null
          person_name: string | null
          published_at: string | null
          raw_payload: Json | null
          score_explanation: Json | null
          source: Database["public"]["Enums"]["opportunity_source_type"]
          source_id: string | null
          source_url: string | null
          status: Database["public"]["Enums"]["opportunity_status"]
          title: string
          updated_at: string
          user_id: string
          website_id: string | null
        }
        Insert: {
          company_name?: string | null
          contact_available?: boolean
          content_hash?: string | null
          created_at?: string
          discovered_at?: string
          domain?: string | null
          estimated_need?: string | null
          freshness_status?: Database["public"]["Enums"]["freshness_status"]
          id?: string
          industry?: string | null
          is_demo?: boolean
          last_verified_at?: string | null
          location?: string | null
          matching_service?: string | null
          normalized_url?: string | null
          opportunity_score?: number | null
          person_name?: string | null
          published_at?: string | null
          raw_payload?: Json | null
          score_explanation?: Json | null
          source: Database["public"]["Enums"]["opportunity_source_type"]
          source_id?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["opportunity_status"]
          title: string
          updated_at?: string
          user_id: string
          website_id?: string | null
        }
        Update: {
          company_name?: string | null
          contact_available?: boolean
          content_hash?: string | null
          created_at?: string
          discovered_at?: string
          domain?: string | null
          estimated_need?: string | null
          freshness_status?: Database["public"]["Enums"]["freshness_status"]
          id?: string
          industry?: string | null
          is_demo?: boolean
          last_verified_at?: string | null
          location?: string | null
          matching_service?: string | null
          normalized_url?: string | null
          opportunity_score?: number | null
          person_name?: string | null
          published_at?: string | null
          raw_payload?: Json | null
          score_explanation?: Json | null
          source?: Database["public"]["Enums"]["opportunity_source_type"]
          source_id?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["opportunity_status"]
          title?: string
          updated_at?: string
          user_id?: string
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_messages: {
        Row: {
          body: string
          campaign_id: string | null
          channel: Database["public"]["Enums"]["outreach_channel"]
          created_at: string
          email_account_id: string | null
          error_message: string | null
          external_message_id: string | null
          id: string
          lead_id: string | null
          opportunity_id: string | null
          pain_point_id: string | null
          scheduled_at: string | null
          sent_at: string | null
          service_offered: string | null
          status: Database["public"]["Enums"]["outreach_status"]
          subject: string | null
          thread_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          campaign_id?: string | null
          channel: Database["public"]["Enums"]["outreach_channel"]
          created_at?: string
          email_account_id?: string | null
          error_message?: string | null
          external_message_id?: string | null
          id?: string
          lead_id?: string | null
          opportunity_id?: string | null
          pain_point_id?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          service_offered?: string | null
          status?: Database["public"]["Enums"]["outreach_status"]
          subject?: string | null
          thread_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          campaign_id?: string | null
          channel?: Database["public"]["Enums"]["outreach_channel"]
          created_at?: string
          email_account_id?: string | null
          error_message?: string | null
          external_message_id?: string | null
          id?: string
          lead_id?: string | null
          opportunity_id?: string | null
          pain_point_id?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          service_offered?: string | null
          status?: Database["public"]["Enums"]["outreach_status"]
          subject?: string | null
          thread_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_messages_email_account_id_fkey"
            columns: ["email_account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_messages_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_messages_pain_point_id_fkey"
            columns: ["pain_point_id"]
            isOneToOne: false
            referencedRelation: "pain_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pain_points: {
        Row: {
          confidence: Database["public"]["Enums"]["finding_confidence"]
          created_at: string
          description: string | null
          estimated_impact: string | null
          id: string
          lead_id: string | null
          opportunity_id: string | null
          potential_service: string | null
          recommended_solution: string | null
          severity: Database["public"]["Enums"]["finding_severity"]
          title: string
          user_id: string
          website_analysis_id: string | null
          why_it_matters: string | null
        }
        Insert: {
          confidence?: Database["public"]["Enums"]["finding_confidence"]
          created_at?: string
          description?: string | null
          estimated_impact?: string | null
          id?: string
          lead_id?: string | null
          opportunity_id?: string | null
          potential_service?: string | null
          recommended_solution?: string | null
          severity?: Database["public"]["Enums"]["finding_severity"]
          title: string
          user_id: string
          website_analysis_id?: string | null
          why_it_matters?: string | null
        }
        Update: {
          confidence?: Database["public"]["Enums"]["finding_confidence"]
          created_at?: string
          description?: string | null
          estimated_impact?: string | null
          id?: string
          lead_id?: string | null
          opportunity_id?: string | null
          potential_service?: string | null
          recommended_solution?: string | null
          severity?: Database["public"]["Enums"]["finding_severity"]
          title?: string
          user_id?: string
          website_analysis_id?: string | null
          why_it_matters?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pain_points_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pain_points_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pain_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pain_points_website_analysis_id_fkey"
            columns: ["website_analysis_id"]
            isOneToOne: false
            referencedRelation: "website_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          expertise_description: string | null
          full_name: string | null
          id: string
          onboarding_completed: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          expertise_description?: string | null
          full_name?: string | null
          id: string
          onboarding_completed?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          expertise_description?: string | null
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      saved_opportunities: {
        Row: {
          created_at: string
          id: string
          opportunity_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          opportunity_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          opportunity_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_opportunities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_opportunities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_profiles: {
        Row: {
          contact_id: string | null
          created_at: string
          handle: string | null
          id: string
          platform: string
          source_reference: string | null
          url: string
          user_id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          website_id: string | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          handle?: string | null
          id?: string
          platform: string
          source_reference?: string | null
          url: string
          user_id: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          website_id?: string | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          handle?: string | null
          id?: string
          platform?: string
          source_reference?: string | null
          url?: string
          user_id?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_profiles_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_profiles_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: Database["public"]["Enums"]["plan_tier"]
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_health: {
        Row: {
          id: string
          last_checked_at: string | null
          last_error: string | null
          metadata: Json
          provider: string
          status: string
          updated_at: string
        }
        Insert: {
          id?: string
          last_checked_at?: string | null
          last_error?: string | null
          metadata?: Json
          provider: string
          status?: string
          updated_at?: string
        }
        Update: {
          id?: string
          last_checked_at?: string | null
          last_error?: string | null
          metadata?: Json
          provider?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string
          description: string | null
          due_at: string | null
          id: string
          lead_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          lead_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          lead_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      usage: {
        Row: {
          ai_analyses: number
          ai_replies: number
          created_at: string
          follow_ups: number
          id: string
          opportunity_discoveries: number
          outreach_messages: number
          period_start: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_analyses?: number
          ai_replies?: number
          created_at?: string
          follow_ups?: number
          id?: string
          opportunity_discoveries?: number
          outreach_messages?: number
          period_start: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_analyses?: number
          ai_replies?: number
          created_at?: string
          follow_ups?: number
          id?: string
          opportunity_discoveries?: number
          outreach_messages?: number
          period_start?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          ai_assisted_replies: boolean
          ai_model_override: string | null
          auto_followups: boolean
          automatic_replies: boolean
          created_at: string
          freshness_hours: number
          id: string
          outreach_mode: Database["public"]["Enums"]["approval_mode"]
          project_value_max: number | null
          project_value_min: number | null
          target_audiences: string[]
          target_cities: string[]
          target_countries: string[]
          target_regions: string[]
          target_worldwide: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_assisted_replies?: boolean
          ai_model_override?: string | null
          auto_followups?: boolean
          automatic_replies?: boolean
          created_at?: string
          freshness_hours?: number
          id?: string
          outreach_mode?: Database["public"]["Enums"]["approval_mode"]
          project_value_max?: number | null
          project_value_min?: number | null
          target_audiences?: string[]
          target_cities?: string[]
          target_countries?: string[]
          target_regions?: string[]
          target_worldwide?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_assisted_replies?: boolean
          ai_model_override?: string | null
          auto_followups?: boolean
          automatic_replies?: boolean
          created_at?: string
          freshness_hours?: number
          id?: string
          outreach_mode?: Database["public"]["Enums"]["approval_mode"]
          project_value_max?: number | null
          project_value_min?: number | null
          target_audiences?: string[]
          target_cities?: string[]
          target_countries?: string[]
          target_regions?: string[]
          target_worldwide?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_services: {
        Row: {
          created_at: string
          custom_label: string | null
          id: string
          service_key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_label?: string | null
          id?: string
          service_key: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_label?: string | null
          id?: string
          service_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_services_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      website_analyses: {
        Row: {
          business: Json
          created_at: string
          error_message: string | null
          id: string
          lead_id: string | null
          model_used: string | null
          overview: Json
          status: string
          technical: Json
          updated_at: string
          user_id: string
          website_id: string
        }
        Insert: {
          business?: Json
          created_at?: string
          error_message?: string | null
          id?: string
          lead_id?: string | null
          model_used?: string | null
          overview?: Json
          status?: string
          technical?: Json
          updated_at?: string
          user_id: string
          website_id: string
        }
        Update: {
          business?: Json
          created_at?: string
          error_message?: string | null
          id?: string
          lead_id?: string | null
          model_used?: string | null
          overview?: Json
          status?: string
          technical?: Json
          updated_at?: string
          user_id?: string
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_analyses_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_analyses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_analyses_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      websites: {
        Row: {
          business_name: string | null
          business_type: string | null
          country: string | null
          created_at: string
          discovered_at: string
          domain: string
          has_email: boolean
          has_social: boolean
          id: string
          industry: string | null
          is_demo: boolean
          is_ecommerce: boolean | null
          last_verified_at: string | null
          location: string | null
          normalized_url: string
          platform: string | null
          technology: string[]
          title: string | null
          updated_at: string
          url: string
          user_id: string
          website_type: string | null
        }
        Insert: {
          business_name?: string | null
          business_type?: string | null
          country?: string | null
          created_at?: string
          discovered_at?: string
          domain: string
          has_email?: boolean
          has_social?: boolean
          id?: string
          industry?: string | null
          is_demo?: boolean
          is_ecommerce?: boolean | null
          last_verified_at?: string | null
          location?: string | null
          normalized_url: string
          platform?: string | null
          technology?: string[]
          title?: string | null
          updated_at?: string
          url: string
          user_id: string
          website_type?: string | null
        }
        Update: {
          business_name?: string | null
          business_type?: string | null
          country?: string | null
          created_at?: string
          discovered_at?: string
          domain?: string
          has_email?: boolean
          has_social?: boolean
          id?: string
          industry?: string | null
          is_demo?: boolean
          is_ecommerce?: boolean | null
          last_verified_at?: string | null
          location?: string | null
          normalized_url?: string
          platform?: string | null
          technology?: string[]
          title?: string | null
          updated_at?: string
          url?: string
          user_id?: string
          website_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "websites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_role: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      approval_mode: "manual" | "ai_approval" | "automatic"
      campaign_status: "draft" | "active" | "paused" | "completed" | "archived"
      email_account_status: "connected" | "expired" | "revoked" | "error"
      finding_confidence: "detected" | "possible" | "unable_to_determine"
      finding_severity: "critical" | "high" | "medium" | "low"
      freshness_status: "NEW" | "FRESH" | "AGING" | "EXPIRED" | "UNKNOWN"
      integration_provider:
        | "gmail"
        | "outlook"
        | "facebook"
        | "instagram"
        | "linkedin"
        | "x"
      integration_status:
        | "not_connected"
        | "connected"
        | "coming_soon"
        | "error"
        | "expired"
        | "not_configured"
      lead_status:
        | "new"
        | "analyzing"
        | "qualified"
        | "contacted"
        | "replied"
        | "interested"
        | "meeting"
        | "proposal"
        | "won"
        | "lost"
      notification_type:
        | "opportunity"
        | "reply"
        | "follow_up"
        | "integration"
        | "system"
        | "campaign"
      opportunity_source_type:
        | "website_discovery"
        | "problem_post"
        | "job"
        | "fisherleads"
        | "apollo"
        | "adzuna"
        | "manual"
        | "other"
      opportunity_status:
        | "new"
        | "saved"
        | "ignored"
        | "analyzing"
        | "analyzed"
        | "contacted"
      outreach_channel:
        | "email"
        | "linkedin"
        | "instagram"
        | "facebook"
        | "x"
        | "other"
      outreach_status:
        | "draft"
        | "pending_approval"
        | "scheduled"
        | "sent"
        | "failed"
        | "cancelled"
      plan_tier: "free" | "pro" | "agency" | "enterprise"
      reply_intent:
        | "interested"
        | "very_interested"
        | "question"
        | "pricing_request"
        | "meeting_request"
        | "not_interested"
        | "not_now"
        | "wrong_person"
        | "out_of_office"
        | "spam"
        | "unclear"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "incomplete"
      task_status: "open" | "in_progress" | "done" | "cancelled"
      user_role: "user" | "admin"
      verification_status: "verified" | "unverified" | "unknown"
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
      approval_mode: ["manual", "ai_approval", "automatic"],
      campaign_status: ["draft", "active", "paused", "completed", "archived"],
      email_account_status: ["connected", "expired", "revoked", "error"],
      finding_confidence: ["detected", "possible", "unable_to_determine"],
      finding_severity: ["critical", "high", "medium", "low"],
      freshness_status: ["NEW", "FRESH", "AGING", "EXPIRED", "UNKNOWN"],
      integration_provider: [
        "gmail",
        "outlook",
        "facebook",
        "instagram",
        "linkedin",
        "x",
      ],
      integration_status: [
        "not_connected",
        "connected",
        "coming_soon",
        "error",
        "expired",
        "not_configured",
      ],
      lead_status: [
        "new",
        "analyzing",
        "qualified",
        "contacted",
        "replied",
        "interested",
        "meeting",
        "proposal",
        "won",
        "lost",
      ],
      notification_type: [
        "opportunity",
        "reply",
        "follow_up",
        "integration",
        "system",
        "campaign",
      ],
      opportunity_source_type: [
        "website_discovery",
        "problem_post",
        "job",
        "fisherleads",
        "apollo",
        "adzuna",
        "manual",
        "other",
      ],
      opportunity_status: [
        "new",
        "saved",
        "ignored",
        "analyzing",
        "analyzed",
        "contacted",
      ],
      outreach_channel: [
        "email",
        "linkedin",
        "instagram",
        "facebook",
        "x",
        "other",
      ],
      outreach_status: [
        "draft",
        "pending_approval",
        "scheduled",
        "sent",
        "failed",
        "cancelled",
      ],
      plan_tier: ["free", "pro", "agency", "enterprise"],
      reply_intent: [
        "interested",
        "very_interested",
        "question",
        "pricing_request",
        "meeting_request",
        "not_interested",
        "not_now",
        "wrong_person",
        "out_of_office",
        "spam",
        "unclear",
      ],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "incomplete",
      ],
      task_status: ["open", "in_progress", "done", "cancelled"],
      user_role: ["user", "admin"],
      verification_status: ["verified", "unverified", "unknown"],
    },
  },
} as const
