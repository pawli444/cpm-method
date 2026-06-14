import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          project_id: string
          task_id: string
          name: string
          duration: number
          predecessors: string[]
        }
        Insert: {
          id?: string
          project_id: string
          task_id: string
          name: string
          duration: number
          predecessors: string[]
        }
        Update: {
          task_id?: string
          name?: string
          duration?: number
          predecessors?: string[]
        }
      }
    }
  }
}
