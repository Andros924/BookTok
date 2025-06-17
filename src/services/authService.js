import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const authService = {
  register: async (userData) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      })

      if (authError) throw authError

      if (authData.user) {
        // Crea il profilo utente
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            name: userData.name,
            email: userData.email,
          })

        if (profileError) throw profileError

        toast.success('Registrazione completata con successo!')
        return { user: authData.user }
      }
    } catch (error) {
      const message = error.message || 'Errore durante la registrazione'
      toast.error(message)
      throw new Error(message)
    }
  },

  login: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Ottieni il profilo utente
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      toast.success('Login effettuato con successo!')
      return { user: data.user, profile }
    } catch (error) {
      const message = error.message || 'Errore durante il login'
      toast.error(message)
      throw new Error(message)
    }
  },

  logout: async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      toast.success('Logout effettuato con successo')
    } catch (error) {
      toast.error('Errore durante il logout')
      throw error
    }
  },

  getCurrentUser: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      return { user, profile }
    } catch (error) {
      return null
    }
  },

  getSession: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  },

  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

export default authService