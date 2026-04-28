import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vmtjtqxaekreuvmkmvhq.supabase.co'
const supabaseAnonKey = 'sb_publishable_qkZcVKrj9paT6vxO2AEH6g_Uz9CY0Km'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)