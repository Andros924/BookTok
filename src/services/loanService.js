import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const loanService = {
  // Ottieni tutti i prestiti (dati e ricevuti)
  getAllLoans: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non autenticato')

      const { data, error } = await supabase
        .from('book_loans')
        .select(`
          *,
          books (
            id,
            title,
            author,
            cover_image,
            isbn
          )
        `)
        .eq('lender_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      const message = error.message || 'Errore nel recupero dei prestiti'
      toast.error(message)
      throw new Error(message)
    }
  },

  // Crea un nuovo prestito
  createLoan: async (loanData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non autenticato')

      const { data, error } = await supabase
        .from('book_loans')
        .insert({
          ...loanData,
          lender_id: user.id
        })
        .select(`
          *,
          books (
            id,
            title,
            author,
            cover_image,
            isbn
          )
        `)
        .single()

      if (error) throw error
      toast.success('Prestito registrato con successo!')
      return data
    } catch (error) {
      const message = error.message || 'Errore nella registrazione del prestito'
      toast.error(message)
      throw new Error(message)
    }
  },

  // Segna un prestito come restituito
  returnLoan: async (loanId) => {
    try {
      const { data, error } = await supabase
        .from('book_loans')
        .update({
          status: 'returned',
          actual_return_date: new Date().toISOString()
        })
        .eq('id', loanId)
        .select()
        .single()

      if (error) throw error
      toast.success('Libro segnato come restituito!')
      return data
    } catch (error) {
      const message = error.message || 'Errore nell\'aggiornamento del prestito'
      toast.error(message)
      throw new Error(message)
    }
  },

  // Aggiorna un prestito
  updateLoan: async (loanId, updateData) => {
    try {
      const { data, error } = await supabase
        .from('book_loans')
        .update(updateData)
        .eq('id', loanId)
        .select(`
          *,
          books (
            id,
            title,
            author,
            cover_image,
            isbn
          )
        `)
        .single()

      if (error) throw error
      toast.success('Prestito aggiornato con successo!')
      return data
    } catch (error) {
      const message = error.message || 'Errore nell\'aggiornamento del prestito'
      toast.error(message)
      throw new Error(message)
    }
  },

  // Elimina un prestito
  deleteLoan: async (loanId) => {
    try {
      const { error } = await supabase
        .from('book_loans')
        .delete()
        .eq('id', loanId)

      if (error) throw error
      toast.success('Prestito eliminato con successo!')
    } catch (error) {
      const message = error.message || 'Errore nell\'eliminazione del prestito'
      toast.error(message)
      throw new Error(message)
    }
  },

  // Ottieni statistiche prestiti
  getLoanStats: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non autenticato')

      const { data, error } = await supabase
        .from('book_loans')
        .select('status')
        .eq('lender_id', user.id)

      if (error) throw error

      const stats = {
        total: data.length,
        active: data.filter(loan => loan.status === 'active').length,
        returned: data.filter(loan => loan.status === 'returned').length,
        overdue: data.filter(loan => loan.status === 'overdue').length
      }

      return stats
    } catch (error) {
      console.error('Errore nel recupero delle statistiche:', error)
      return { total: 0, active: 0, returned: 0, overdue: 0 }
    }
  }
}

export default loanService