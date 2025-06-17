import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const authService = {
  // Registrazione utente con profilo
  register: async (userData) => {
    try {
      console.log('🚀 Starting registration process...', { 
        email: userData.email, 
        name: userData.name 
      })
      
      // Validazione input
      if (!userData.email || !userData.password || !userData.name) {
        throw new Error('Tutti i campi sono obbligatori')
      }

      if (userData.password.length < 6) {
        throw new Error('La password deve essere di almeno 6 caratteri')
      }

      // Registrazione utente
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email.trim().toLowerCase(),
        password: userData.password,
        options: {
          data: {
            name: userData.name.trim()
          }
        }
      })

      console.log('📧 Auth registration response:', { 
        user: authData.user?.id, 
        session: !!authData.session,
        error: authError 
      })

      if (authError) {
        console.error('❌ Registration auth error:', authError)
        throw authError
      }

      if (!authData.user) {
        throw new Error('Registrazione fallita: utente non creato')
      }

      // Se c'è una sessione, l'utente è già confermato
      if (authData.session) {
        console.log('✅ User registered and confirmed immediately')
        
        // Aspetta un momento per il trigger del database
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Verifica che il profilo sia stato creato dal trigger
        const profile = await this.getProfile(authData.user.id)
        
        toast.success('Registrazione completata con successo!')
        return { 
          user: authData.user, 
          profile,
          needsConfirmation: false 
        }
      } else {
        // L'utente deve confermare l'email
        console.log('📨 User registered, email confirmation required')
        toast.success('Registrazione completata! Controlla la tua email per confermare l\'account.')
        return { 
          user: authData.user, 
          profile: null,
          needsConfirmation: true 
        }
      }

    } catch (error) {
      console.error('💥 Registration error:', error)
      const message = this.getErrorMessage(error)
      toast.error(message)
      throw new Error(message)
    }
  },

  // Login utente
  login: async (email, password) => {
    try {
      console.log('🔐 Attempting login...', { email })
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      console.log('🔑 Login response:', { 
        user: data.user?.id, 
        session: !!data.session,
        error 
      })

      if (error) throw error

      if (!data.user) {
        throw new Error('Login fallito')
      }

      // Ottieni il profilo utente
      const profile = await this.getOrCreateProfile(data.user)

      toast.success('Login effettuato con successo!')
      return { user: data.user, profile }
    } catch (error) {
      console.error('❌ Login error:', error)
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
      console.error('Logout error:', error)
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

  // Ottieni profilo esistente
  getProfile: async (userId) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error)
        return null
      }

      return profile
    } catch (error) {
      console.error('Error in getProfile:', error)
      return null
    }
  },

  // Ottieni o crea profilo utente
  getOrCreateProfile: async (user) => {
    try {
      console.log('👤 Getting/creating profile for user:', user.id)
      
      // Prima prova a ottenere il profilo esistente
      let profile = await this.getProfile(user.id)
      
      if (profile) {
        console.log('✅ Profile found:', profile.name)
        return profile
      }

      console.log('🔨 Profile not found, creating new one...')
      
      // Se non esiste, crealo
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          name: user.user_metadata?.name || user.email.split('@')[0],
          email: user.email,
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ Profile creation failed:', createError)
        // Ritorna un profilo di fallback
        return {
          id: user.id,
          name: user.user_metadata?.name || user.email.split('@')[0],
          email: user.email
        }
      }

      console.log('✅ Profile created successfully:', newProfile.name)
      return newProfile

    } catch (error) {
      console.error('💥 Error with profile:', error)
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
        .update({
          ...profileData,
          updated_at: new Date().toISOString()
        })
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
    try {
      const { data: { session } } = await supabase.auth.getSession()
      return session
    } catch (error) {
      console.error('Error getting session:', error)
      return null
    }
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

  // Gestione errori migliorata
  getErrorMessage: (error) => {
    console.log('🔍 Analyzing error:', error)
    
    const message = error.message || error.error_description || ''
    
    // Errori di autenticazione
    if (message.includes('Invalid login credentials')) {
      return 'Email o password non corretti'
    }
    if (message.includes('Email not confirmed')) {
      return 'Devi confermare la tua email prima di accedere'
    }
    if (message.includes('User already registered')) {
      return 'Esiste già un account con questa email'
    }
    if (message.includes('Signup is disabled')) {
      return 'La registrazione è temporaneamente disabilitata'
    }
    
    // Errori di validazione
    if (message.includes('Password should be at least 6 characters')) {
      return 'La password deve essere di almeno 6 caratteri'
    }
    if (message.includes('Unable to validate email address') || message.includes('Invalid email')) {
      return 'Formato email non valido'
    }
    if (message.includes('Weak password')) {
      return 'Password troppo debole. Usa almeno 6 caratteri con lettere e numeri.'
    }
    
    // Errori di database/RLS
    if (message.includes('new row violates row-level security policy')) {
      return 'Errore di sicurezza. Riprova tra qualche secondo.'
    }
    if (message.includes('JWT expired')) {
      return 'Sessione scaduta. Effettua nuovamente il login.'
    }
    
    // Errori di rete
    if (message.includes('Failed to fetch') || message.includes('Network error')) {
      return 'Errore di connessione. Controlla la tua connessione internet.'
    }
    
    // Errore generico
    return message || 'Si è verificato un errore imprevisto'
  }
}

export default authService