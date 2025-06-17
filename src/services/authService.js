import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const authService = {
  // Registrazione utente con profilo
  register: async (userData) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name
          }
        }
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

        if (profileError) {
          console.warn('Profile creation error:', profileError)
          // Non bloccare la registrazione se il profilo non viene creato
        }

        toast.success('Registrazione completata con successo!')
        return { user: authData.user }
      }
    } catch (error) {
      const message = this.getErrorMessage(error)
      toast.error(message)
      throw new Error(message)
    }
  },

  // Login utente
  login: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Ottieni o crea il profilo utente
      let profile = await this.getOrCreateProfile(data.user)

      toast.success('Login effettuato con successo!')
      return { user: data.user, profile }
    } catch (error) {
      const message = this.getErrorMessage(error)
      toast.error(message)
      throw new Error(message)
    }
  },

  // Logout utente
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

  // Ottieni utente corrente con profilo
  getCurrentUser: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const profile = await this.getOrCreateProfile(user)
      return { user, profile }
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  },

  // Ottieni o crea profilo utente
  getOrCreateProfile: async (user) => {
    try {
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code === 'PGRST116') {
        // Profilo non esiste, crealo
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            name: user.user_metadata?.name || user.email.split('@')[0],
            email: user.email,
          })
          .select()
          .single()

        if (createError) throw createError
        profile = newProfile
      } else if (error) {
        throw error
      }

      return profile
    } catch (error) {
      console.error('Error with profile:', error)
      return {
        id: user.id,
        name: user.user_metadata?.name || user.email.split('@')[0],
        email: user.email
      }
    }
  },

  // Aggiorna profilo utente
  updateProfile: async (profileData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non autenticato')

      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      toast.success('Profilo aggiornato con successo!')
      return data
    } catch (error) {
      const message = this.getErrorMessage(error)
      toast.error(message)
      throw new Error(message)
    }
  },

  // Ottieni sessione corrente
  getSession: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  },

  // Listener per cambiamenti di autenticazione
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback)
  },

  // Reset password
  resetPassword: async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      if (error) throw error
      toast.success('Email di reset inviata!')
    } catch (error) {
      const message = this.getErrorMessage(error)
      toast.error(message)
      throw new Error(message)
    }
  },

  // Gestione errori
  getErrorMessage: (error) => {
    if (error.message.includes('Invalid login credentials')) {
      return 'Credenziali non valide'
    }
    if (error.message.includes('User already registered')) {
      return 'Utente già registrato'
    }
    if (error.message.includes('Password should be at least 6 characters')) {
      return 'La password deve essere di almeno 6 caratteri'
    }
    if (error.message.includes('Unable to validate email address')) {
      return 'Indirizzo email non valido'
    }
    return error.message || 'Errore sconosciuto'
  }
}

export default authService