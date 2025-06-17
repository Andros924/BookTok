import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const bookService = {
  // Ottieni tutti i libri dell'utente
  getAllBooks: async (filters = {}) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non autenticato')

      let query = supabase
        .from('books')
        .select('*')
        .eq('user_id', user.id)

      // Applica filtri
      if (filters.status) {
        query = query.eq('read_status', filters.status)
      }
      if (filters.genre) {
        query = query.ilike('genre', `%${filters.genre}%`)
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,author.ilike.%${filters.search}%`)
      }
      if (filters.rating) {
        query = query.eq('rating', filters.rating)
      }
      if (filters.year) {
        query = query.eq('year', filters.year)
      }

      // Ordinamento
      const sortBy = filters.sortBy || 'created_at'
      const sortOrder = filters.sortOrder || 'desc'
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      const message = error.message || 'Errore nel recupero dei libri'
      toast.error(message)
      throw new Error(message)
    }
  },

  // Ottieni un libro specifico
  getBook: async (bookId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non autenticato')

      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      const message = error.message || 'Errore nel recupero del libro'
      toast.error(message)
      throw new Error(message)
    }
  },

  // Aggiungi nuovo libro
  addBook: async (bookData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non autenticato')

      // Prepara i dati del libro
      const bookToInsert = {
        ...bookData,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Converti rating in numero se presente
      if (bookToInsert.rating) {
        bookToInsert.rating = parseInt(bookToInsert.rating)
      }

      // Converti year in numero se presente
      if (bookToInsert.year) {
        bookToInsert.year = parseInt(bookToInsert.year)
      }

      // Converti pages in numero se presente
      if (bookToInsert.pages) {
        bookToInsert.pages = parseInt(bookToInsert.pages)
      }

      const { data, error } = await supabase
        .from('books')
        .insert(bookToInsert)
        .select()
        .single()

      if (error) throw error
      toast.success('Libro aggiunto con successo!')
      return data
    } catch (error) {
      const message = error.message || 'Errore nell\'aggiunta del libro'
      toast.error(message)
      throw new Error(message)
    }
  },

  // Aggiorna libro esistente
  updateBook: async (bookId, bookData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non autenticato')

      // Prepara i dati per l'aggiornamento
      const updateData = {
        ...bookData,
        updated_at: new Date().toISOString()
      }

      // Converti campi numerici
      if (updateData.rating) {
        updateData.rating = parseInt(updateData.rating)
      }
      if (updateData.year) {
        updateData.year = parseInt(updateData.year)
      }
      if (updateData.pages) {
        updateData.pages = parseInt(updateData.pages)
      }

      const { data, error } = await supabase
        .from('books')
        .update(updateData)
        .eq('id', bookId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      toast.success('Libro aggiornato con successo!')
      return data
    } catch (error) {
      const message = error.message || 'Errore nell\'aggiornamento del libro'
      toast.error(message)
      throw new Error(message)
    }
  },

  // Elimina libro
  deleteBook: async (bookId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non autenticato')

      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId)
        .eq('user_id', user.id)

      if (error) throw error
      toast.success('Libro eliminato con successo!')
    } catch (error) {
      const message = error.message || 'Errore nell\'eliminazione del libro'
      toast.error(message)
      throw new Error(message)
    }
  },

  // Aggiorna stato di lettura
  updateReadingStatus: async (bookId, status, additionalData = {}) => {
    try {
      const updateData = {
        read_status: status,
        updated_at: new Date().toISOString(),
        ...additionalData
      }

      // Aggiungi date automatiche
      if (status === 'reading' && !updateData.date_started) {
        updateData.date_started = new Date().toISOString()
      }
      if (status === 'read' && !updateData.date_finished) {
        updateData.date_finished = new Date().toISOString()
      }

      return await this.updateBook(bookId, updateData)
    } catch (error) {
      throw error
    }
  },

  // Ottieni statistiche libri
  getBookStats: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non autenticato')

      const { data, error } = await supabase
        .from('user_reading_stats')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      return data || {
        total_books: 0,
        books_read: 0,
        books_reading: 0,
        books_to_read: 0,
        avg_rating: 0,
        total_pages: 0
      }
    } catch (error) {
      console.error('Error getting book stats:', error)
      return {
        total_books: 0,
        books_read: 0,
        books_reading: 0,
        books_to_read: 0,
        avg_rating: 0,
        total_pages: 0
      }
    }
  },

  // Ricerca libri per ISBN
  searchByISBN: async (isbn) => {
    try {
      // Pulisci ISBN
      const cleanISBN = isbn.replace(/[-\s]/g, '')

      // Prima prova con Google Books API
      const googleResponse = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanISBN}&maxResults=1`
      )
      const googleData = await googleResponse.json()

      if (googleData.items && googleData.items.length > 0) {
        const book = googleData.items[0].volumeInfo
        return this.formatBookFromAPI(book, cleanISBN)
      }

      // Fallback a Open Library
      const openLibResponse = await fetch(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanISBN}&format=json&jscmd=data`
      )
      const openLibData = await openLibResponse.json()
      const bookKey = `ISBN:${cleanISBN}`

      if (openLibData[bookKey]) {
        const book = openLibData[bookKey]
        return this.formatBookFromOpenLibrary(book, cleanISBN)
      }

      throw new Error('Libro non trovato')
    } catch (error) {
      const message = 'Libro non trovato per questo ISBN'
      toast.error(message)
      throw new Error(message)
    }
  },

  // Ricerca libri per titolo
  searchByTitle: async (title, maxResults = 10) => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(title)}&maxResults=${maxResults}&langRestrict=it`
      )
      const data = await response.json()

      if (!data.items || data.items.length === 0) {
        throw new Error('Nessun libro trovato')
      }

      return data.items.map(item => {
        const book = item.volumeInfo
        const isbn = this.extractISBN(book.industryIdentifiers)
        return this.formatBookFromAPI(book, isbn)
      })
    } catch (error) {
      const message = 'Errore nella ricerca dei libri'
      toast.error(message)
      throw new Error(message)
    }
  },

  // Formatta libro da Google Books API
  formatBookFromAPI: (book, isbn) => {
    return {
      title: book.title || '',
      author: book.authors ? book.authors.join(', ') : '',
      isbn: isbn || '',
      isbn13: isbn && isbn.length === 13 ? isbn : '',
      year: book.publishedDate ? new Date(book.publishedDate).getFullYear() : null,
      description: book.description || '',
      cover_image: book.imageLinks ? 
        book.imageLinks.thumbnail?.replace('http:', 'https:') || 
        book.imageLinks.smallThumbnail?.replace('http:', 'https:') : '',
      pages: book.pageCount || null,
      language: book.language === 'it' ? 'Italiano' : 
                book.language === 'en' ? 'Inglese' : 
                book.language || 'Italiano',
      publisher: book.publisher || '',
      genre: book.categories ? book.categories.slice(0, 3).join(', ') : ''
    }
  },

  // Formatta libro da Open Library
  formatBookFromOpenLibrary: (book, isbn) => {
    return {
      title: book.title || '',
      author: book.authors ? book.authors.map(a => a.name).join(', ') : '',
      isbn: isbn || '',
      isbn13: isbn && isbn.length === 13 ? isbn : '',
      year: book.publish_date ? new Date(book.publish_date).getFullYear() : null,
      description: book.notes || '',
      cover_image: book.cover ? 
        book.cover.large || book.cover.medium || book.cover.small : '',
      pages: book.number_of_pages || null,
      language: 'Italiano',
      publisher: book.publishers ? book.publishers.map(p => p.name).join(', ') : '',
      genre: book.subjects ? book.subjects.slice(0, 3).map(s => s.name).join(', ') : ''
    }
  },

  // Estrai ISBN da industryIdentifiers
  extractISBN: (identifiers) => {
    if (!identifiers) return ''
    
    const isbn13 = identifiers.find(id => id.type === 'ISBN_13')
    const isbn10 = identifiers.find(id => id.type === 'ISBN_10')
    
    return isbn13?.identifier || isbn10?.identifier || ''
  },

  // Aggiungi ai preferiti
  toggleFavorite: async (bookId) => {
    try {
      const book = await this.getBook(bookId)
      return await this.updateBook(bookId, { is_favorite: !book.is_favorite })
    } catch (error) {
      throw error
    }
  },

  // Ottieni libri per genere
  getBooksByGenre: async () => {
    try {
      const books = await this.getAllBooks()
      const genreStats = {}

      books.forEach(book => {
        if (book.genre) {
          const genres = book.genre.split(',').map(g => g.trim())
          genres.forEach(genre => {
            if (genre) {
              genreStats[genre] = (genreStats[genre] || 0) + 1
            }
          })
        }
      })

      return Object.entries(genreStats)
        .map(([genre, count]) => ({ genre, count }))
        .sort((a, b) => b.count - a.count)
    } catch (error) {
      console.error('Error getting books by genre:', error)
      return []
    }
  }
}

export default bookService