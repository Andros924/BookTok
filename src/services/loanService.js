import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const loanService = {
  // Ottieni tutti i prestiti dell'utente
  getAllLoans: async (filters = {}) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non autenticato')

      let query = supabase
        .from('book_loans')
        .select(`
          *,
          books (
            id,
            title,
            author,
            cover_image,
            isbn,
            isbn13,
            pages
          )
        `)
        .eq('lender_id', user.id)

      // Applica filtri
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }
      if (filters.search) {
        query = query.or(`borrower_name.ilike.%${filters.search}%,borrower_email.ilike.%${filters.search}%`)
      }

      // Ordinamento
      const sortBy = filters.sortBy || 'created_at'
      const sortOrder = filters.sortOrder || 'desc'
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      const { data, error } = await query

      if (error) throw error

      // Aggiorna automaticamente i prestiti scaduti
      await this.updateOverdueLoans()

      return data || []
    } catch (error) {
      const message = error.message || 'Errore nel recupero dei prestiti'
      toast.error(message)
      throw new Error(message)
    }
  },

  // Ottieni un prestito specifico
  getLoan: async (loanId) => {
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
            isbn,
            isbn13,
            pages
          )
        `)
        .eq('id', loanId)
        .eq('lender_id', user.id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      const message = error.message || 'Errore nel recupero del prestito'
      toast.error(message)
      throw new Error(message)
    }
  },

  // Crea nuovo prestito
  createLoan: async (loanData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non autenticato')

      // Verifica che il libro appartenga all'utente
      const { data: book, error: bookError } = await supabase
        .from('books')
        .select('id, title, author')
        .eq('id', loanData.book_id)
        .eq('user_id', user.id)
        .single()

      if (bookError || !book) {
        throw new Error('Libro non trovato o non autorizzato')
      }

      // Verifica che il libro non sia già in prestito attivo
      const { data: existingLoan, error: loanCheckError } = await supabase
        .from('book_loans')
        .select('id')
        .eq('book_id', loanData.book_id)
        .eq('status', 'active')
        .single()

      if (existingLoan) {
        throw new Error('Questo libro è già in prestito')
      }

      // Prepara i dati del prestito
      const loanToInsert = {
        ...loanData,
        lender_id: user.id,
        loan_date: new Date().toISOString(),
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Converti deposit_amount se presente
      if (loanToInsert.deposit_amount) {
        loanToInsert.deposit_amount = parseFloat(loanToInsert.deposit_amount)
      }

      const { data, error } = await supabase
        .from('book_loans')
        .insert(loanToInsert)
        .select(`
          *,
          books (
            id,
            title,
            author,
            cover_image,
            isbn,
            isbn13,
            pages
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

  // Aggiorna prestito
  updateLoan: async (loanId, updateData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non autenticato')

      const dataToUpdate = {
        ...updateData,
        updated_at: new Date().toISOString()
      }

      // Converti deposit_amount se presente
      if (dataToUpdate.deposit_amount) {
        dataToUpdate.deposit_amount = parseFloat(dataToUpdate.deposit_amount)
      }

      const { data, error } = await supabase
        .from('book_loans')
        .update(dataToUpdate)
        .eq('id', loanId)
        .eq('lender_id', user.id)
        .select(`
          *,
          books (
            id,
            title,
            author,
            cover_image,
            isbn,
            isbn13,
            pages
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

  // Segna prestito come restituito
  returnLoan: async (loanId) => {
    try {
      const returnData = {
        status: 'returned',
        actual_return_date: new Date().toISOString()
      }

      return await this.updateLoan(loanId, returnData)
    } catch (error) {
      throw error
    }
  },

  // Segna prestito come perso
  markAsLost: async (loanId) => {
    try {
      const lostData = {
        status: 'lost'
      }

      return await this.updateLoan(loanId, lostData)
    } catch (error) {
      throw error
    }
  },

  // Elimina prestito
  deleteLoan: async (loanId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non autenticato')

      const { error } = await supabase
        .from('book_loans')
        .delete()
        .eq('id', loanId)
        .eq('lender_id', user.id)

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
        .select('status, expected_return_date')
        .eq('lender_id', user.id)

      if (error) throw error

      const now = new Date()
      const stats = {
        total: data.length,
        active: 0,
        returned: 0,
        overdue: 0,
        lost: 0
      }

      data.forEach(loan => {
        if (loan.status === 'returned') {
          stats.returned++
        } else if (loan.status === 'lost') {
          stats.lost++
        } else if (loan.status === 'active') {
          if (loan.expected_return_date && new Date(loan.expected_return_date) < now) {
            stats.overdue++
          } else {
            stats.active++
          }
        }
      })

      return stats
    } catch (error) {
      console.error('Error getting loan stats:', error)
      return { total: 0, active: 0, returned: 0, overdue: 0, lost: 0 }
    }
  },

  // Aggiorna prestiti scaduti
  updateOverdueLoans: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('book_loans')
        .update({ status: 'overdue' })
        .eq('lender_id', user.id)
        .eq('status', 'active')
        .lt('expected_return_date', new Date().toISOString())
        .not('expected_return_date', 'is', null)

      if (error) {
        console.error('Error updating overdue loans:', error)
      }
    } catch (error) {
      console.error('Error in updateOverdueLoans:', error)
    }
  },

  // Ottieni prestiti in scadenza
  getUpcomingReturns: async (days = 7) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non autenticato')

      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + days)

      const { data, error } = await supabase
        .from('book_loans')
        .select(`
          *,
          books (
            id,
            title,
            author,
            cover_image
          )
        `)
        .eq('lender_id', user.id)
        .eq('status', 'active')
        .gte('expected_return_date', new Date().toISOString())
        .lte('expected_return_date', futureDate.toISOString())
        .order('expected_return_date', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting upcoming returns:', error)
      return []
    }
  },

  // Invia promemoria (placeholder per futura implementazione)
  sendReminder: async (loanId) => {
    try {
      const loan = await this.getLoan(loanId)
      
      // Aggiorna flag promemoria inviato
      await this.updateLoan(loanId, { reminder_sent: true })
      
      // Qui si potrebbe integrare un servizio di email
      toast.success(`Promemoria inviato a ${loan.borrower_name}`)
      
      return true
    } catch (error) {
      const message = 'Errore nell\'invio del promemoria'
      toast.error(message)
      throw new Error(message)
    }
  },

  // Ottieni libri disponibili per prestito
  getAvailableBooks: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non autenticato')

      // Ottieni tutti i libri dell'utente
      const { data: allBooks, error: booksError } = await supabase
        .from('books')
        .select('id, title, author, cover_image, isbn')
        .eq('user_id', user.id)
        .order('title')

      if (booksError) throw booksError

      // Ottieni libri attualmente in prestito
      const { data: activeLoans, error: loansError } = await supabase
        .from('book_loans')
        .select('book_id')
        .eq('lender_id', user.id)
        .eq('status', 'active')

      if (loansError) throw loansError

      // Filtra libri disponibili
      const loanedBookIds = new Set(activeLoans.map(loan => loan.book_id))
      const availableBooks = allBooks.filter(book => !loanedBookIds.has(book.id))

      return availableBooks
    } catch (error) {
      const message = error.message || 'Errore nel recupero dei libri disponibili'
      toast.error(message)
      throw new Error(message)
    }
  }
}

export default loanService