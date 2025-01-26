// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// 環境変数から読み込む ( .env.local or .env )
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Supabaseクライアントを生成
export const supabase = createClient(supabaseUrl, supabaseAnonKey)