import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const reviewService = {
  // Aggiungi o aggiorna recensione
  upsertReview: async (bookId, reviewData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non autenticato')

      const reviewToUpsert = {
        book_id: bookId,
        user_id: user.id,
        ...reviewData,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('book_reviews')
        .upsert(reviewToUpsert, { 
          onConflict: 'book_id,user_id',
          ignoreDuplicates: false 
        })
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
      toast.success('Recensione salvata!')
      return data
    } catch (error) {
      const message = error.message || 'Errore nel salvataggio della recensione'
      toast.error(message)
      throw new Error(message)
    }
  },

  // Ottieni recensione per libro
  getReview: async (bookId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non autenticato')

      const { data, error } = await supabase
        .from('book_reviews')
        .select(`
          *,
          books (
            id,
            title,
            author,
            cover_image
          )
        `)
        .eq('book_id', bookId)
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data
    } catch (error) {
      if (error.code === 'PGRST116') return null
      const message = error.message || 'Errore nel recupero della recensione'
      toast.error(message)
      throw new Error(message)
    }
  },

  // Ottieni tutte le recensioni dell'utente
  getAllReviews: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non autenticato')

      const { data, error } = await supabase
        .from('book_reviews')
        .select(`
          *,
          books (
            id,
            title,
            author,
            cover_image,
            year
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      const message = error.message || 'Errore nel recupero delle recensioni'
      toast.error(message)
      throw new Error(message)
    }
  },

  // Elimina recensione
  deleteReview: async (bookId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non autenticato')

      const { error } = await supabase
        .from('book_reviews')
        .delete()
        .eq('book_id', bookId)
        .eq('user_id', user.id)

      if (error) throw error
      toast.success('Recensione eliminata!')
    } catch (error) {
      const message = error.message || 'Errore nell\'eliminazione della recensione'
      toast.error(message)
      throw new Error(message)
    }
  },

  // Ottieni statistiche recensioni
  getReviewStats: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non autenticato')

      const { data, error } = await supabase
        .from('book_reviews')
        .select('rating')
        .eq('user_id', user.id)

      if (error) throw error

      const stats = {
        total_reviews: data.length,
        avg_rating: 0,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      }

      if (data.length > 0) {
        stats.avg_rating = data.reduce((sum, review) => sum + review.rating, 0) / data.length
        
        data.forEach(review => {
          stats.rating_distribution[review.rating]++
        })
      }

      return stats
    } catch (error) {
      console.error('Error getting review stats:', error)
      return {
        total_reviews: 0,
        avg_rating: 0,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      }
    }
  }
}

export default reviewService