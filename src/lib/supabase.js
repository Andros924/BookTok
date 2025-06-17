import { createClient } from '@supabase/supabase-js'

// Fallback values for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zaityklszcaqpgifkjow.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphaXR5a2xzemNhcXBnaWZram93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNDg3NTksImV4cCI6MjA2NTcyNDc1OX0.rdZpTEwh-neKq4rRVBaEeFE5VxFChIcwB-EilQiDRRo'

console.log('🔧 Supabase Config:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey
})

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing')
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'implicit',
    debug: false // Disabilita debug per ridurre noise
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'libreria-app'
    }
  }
})

// Test della connessione (solo una volta)
let connectionTested = false
if (!connectionTested) {
  connectionTested = true
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error('❌ Supabase connection error:', error)
    } else {
      console.log('✅ Supabase connected successfully')
    }
  })
}

// Utility functions for common operations
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export const getCurrentSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  } catch (error) {
    console.error('Error getting current session:', error)
    return null
  }
}

// Database helpers
export const executeQuery = async (query, params = {}) => {
  try {
    const { data, error } = await query
    if (error) throw error
    return data
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

export default supabase