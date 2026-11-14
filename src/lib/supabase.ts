import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * Client Supabase partagé. Vaut `null` tant que les variables
 * VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ne sont pas renseignées :
 * l'application fonctionne alors en mode local (localStorage) comme avant.
 */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey, { realtime: { params: { eventsPerSecond: 20 } } }) : null

export const supabaseEnabled = supabase !== null
