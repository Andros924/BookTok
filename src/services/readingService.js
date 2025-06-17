import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const readingService = {
  // Aggiungi sessione di lettura
  addReadingSession: async (sessionData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non autenticato')

      const sessionToInsert = {
        ...sessionData,
        user_id: user.id,
        session_date: sessionData.session_date || new Date().toISOString(),
        created_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('reading_sessions')
        .insert(sessionToInsert)
        .select(`
          *,
          books (
            id,
            title,
            author,
            cover_image
          )
        `)
        .single()

      if (error) throw error
      toast.success('Sessione di lettura registrata!')
      return data
    } catch (error) {
      const message = error.message || 'Errore nella registrazione della sessione'
      toast.error(message)
      throw new Error(message)
    }
  },

  // Ottieni sessioni di lettura
  getReadingSessions: async (bookId = null, limit = null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non autenticato')

      let query = supabase
        .from('reading_sessions')
        .select(`
          *,
          books (
            id,
            title,
            author,
            cover_image
          )
        `)
        .eq('user_id', user.id)
        .order('session_date', { ascending: false })

      if (bookId) {
        query = query.eq('book_id', bookId)
      }

      if (limit) {
        query = query.limit(limit)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      const message = error.message || 'Errore nel recupero delle sessioni'
      toast.error(message)
      throw new Error(message)
    }
  },

  // Ottieni statistiche di lettura
  getReadingStats: async (period = 'month') => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non autenticato')

      let startDate = new Date()
      
      switch (period) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1)
          break
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1)
          break
        default:
          startDate.setMonth(startDate.getMonth() - 1)
      }

      const { data, error } = await supabase
        .from('reading_sessions')
        .select('pages_read, duration_minutes, session_date')
        .eq('user_id', user.id)
        .gte('session_date', startDate.toISOString())

      if (error) throw error

      const stats = {
        total_sessions: data.length,
        total_pages: data.reduce((sum, session) => sum + (session.pages_read || 0), 0),
        total_minutes: data.reduce((sum, session) => sum + (session.duration_minutes || 0), 0),
        avg_pages_per_session: 0,
        avg_minutes_per_session: 0
      }

      if (stats.total_sessions > 0) {
        stats.avg_pages_per_session = Math.round(stats.total_pages / stats.total_sessions)
        stats.avg_minutes_per_session = Math.round(stats.total_minutes / stats.total_sessions)
      }

      return stats
    } catch (error) {
      console.error('Error getting reading stats:', error)
      return {
        total_sessions: 0,
        total_pages: 0,
        total_minutes: 0,
        avg_pages_per_session: 0,
        avg_minutes_per_session: 0
      }
    }
  },

  // Aggiorna sessione di lettura
  updateReadingSession: async (sessionId, updateData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non autenticato')

      const { data, error } = await supabase
        .from('reading_sessions')
        .update(updateData)
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .select(`
          *,
          books (
            id,
            title,
            author,
            cover_image
          )
        `)
        .single()

      if (error) throw error
      toast.success('Sessione aggiornata!')
      return data
    } catch (error) {
      const message = error.message || 'Errore nell\'aggiornamento della sessione'
      toast.error(message)
      throw new Error(message)
    }
  },

  // Elimina sessione di lettura
  deleteReadingSession: async (sessionId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non autenticato')

      const { error } = await supabase
        .from('reading_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id)

      if (error) throw error
      toast.success('Sessione eliminata!')
    } catch (error) {
      const message = error.message || 'Errore nell\'eliminazione della sessione'
      toast.error(message)
      throw new Error(message)
    }
  }
}

export default readingService