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

      // Registrazione utente con email confirmation disabilitata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email.trim().toLowerCase(),
        password: userData.password,
        options: {
          data: {
            name: userData.name.trim()
          },
          emailRedirectTo: undefined // Disabilita redirect email
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

      // Con email confirmation disabilitata, dovremmo sempre avere una sessione
      if (authData.session) {
        console.log('✅ User registered and logged in immediately')
        
        // Aspetta un momento per il trigger del database
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Verifica che il profilo sia stato creato dal trigger
        const profile = await authService.waitForProfile(authData.user.id, 5000)
        
        toast.success('Registrazione completata con successo!')
        return { 
          user: authData.user, 
          profile,
          needsConfirmation: false 
        }
      } else {
        // Questo caso non dovrebbe verificarsi con email confirmation disabilitata
        console.log('⚠️ No session created - this should not happen')
        toast.success('Registrazione completata! Effettua il login.')
        return { 
          user: authData.user, 
          profile: null,
          needsConfirmation: true 
        }
      }

    } catch (error) {
      console.error('💥 Registration error:', error)
      const message = authService.getErrorMessage(error)
      toast.error(message)
      throw new Error(message)
    }
  },

  // Aspetta che il profilo sia creato dal trigger
  waitForProfile: async (userId, timeout = 5000) => {
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeout) {
      try {
        const profile = await authService.getProfile(userId)
        if (profile) {
          console.log('✅ Profile found after waiting:', profile.name)
          return profile
        }
        
        // Aspetta 500ms prima di riprovare
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.log('⏳ Still waiting for profile creation...')
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    console.log('⚠️ Profile not found after timeout, creating fallback')
    return authService.createFallbackProfile(userId)
  },

  // Crea profilo di fallback
  createFallbackProfile: async (userId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not found')
      
      return {
        id: userId,
        name: user.user_metadata?.name || user.email.split('@')[0],
        email: user.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error creating fallback profile:', error)
      return null
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

      // Ottieni il profilo utente con retry
      const profile = await authService.getOrCreateProfile(data.user)

      toast.success('Login effettuato con successo!')
      return { user: data.user, profile }
    } catch (error) {
      console.error('❌ Login error:', error)
      const message = authService.getErrorMessage(error)
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
      console.log('🔍 Getting current user...')
      
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error('❌ Error getting user:', error)
        return null
      }
      
      if (!user) {
        console.log('❌ No user found')
        return null
      }

      console.log('👤 User found:', user.id)
      
      const profile = await authService.getOrCreateProfile(user)
      
      console.log('📋 Profile result:', profile ? 'Found' : 'Not found')
      
      return { user, profile }
    } catch (error) {
      console.error('💥 Error getting current user:', error)
      return null
    }
  },

  // Ottieni profilo esistente
  getProfile: async (userId) => {
    try {
      console.log('🔍 Fetching profile for user:', userId)
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('📭 Profile not found (PGRST116)')
          return null
        }
        console.error('❌ Error fetching profile:', error)
        return null
      }

      console.log('✅ Profile found:', profile?.name)
      return profile
    } catch (error) {
      console.error('💥 Error in getProfile:', error)
      return null
    }
  },

  // Ottieni o crea profilo utente
  getOrCreateProfile: async (user, maxRetries = 3) => {
    try {
      console.log('👤 Getting/creating profile for user:', user.id)
      
      // Prima prova a ottenere il profilo esistente
      let profile = await authService.getProfile(user.id)
      
      if (profile) {
        console.log('✅ Profile found:', profile.name)
        return profile
      }

      console.log('🔨 Profile not found, attempting to create...')
      
      // Prova a creare il profilo con retry
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
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
            console.error(`❌ Profile creation attempt ${attempt} failed:`, createError)
            
            if (attempt === maxRetries) {
              throw createError
            }
            
            // Aspetta prima di riprovare
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
            continue
          }

          console.log('✅ Profile created successfully:', newProfile.name)
          return newProfile

        } catch (retryError) {
          console.error(`💥 Retry ${attempt} failed:`, retryError)
          
          if (attempt === maxRetries) {
            break
          }
        }
      }

      // Se tutto fallisce, ritorna un profilo di fallback
      console.log('⚠️ All creation attempts failed, using fallback profile')
      return {
        id: user.id,
        name: user.user_metadata?.name || user.email.split('@')[0],
        email: user.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

    } catch (error) {
      console.error('💥 Error with profile:', error)
      return {
        id: user.id,
        name: user.user_metadata?.name || user.email.split('@')[0],
        email: user.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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
      const message = authService.getErrorMessage(error)
      toast.error(message)
      throw new Error(message)
    }
  },

  // Ottieni sessione corrente
  getSession: async () => {
    try {
      console.log('🔍 Getting session...')
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('❌ Error getting session:', error)
        return null
      }
      
      console.log('📋 Session result:', !!session)
      return session
    } catch (error) {
      console.error('💥 Error getting session:', error)
      return null
    }
  },

  // Listener per cambiamenti di autenticazione
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state change:', event, !!session)
      callback(event, session)
    })
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
      const message = authService.getErrorMessage(error)
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