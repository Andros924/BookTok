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

  // Ricerca libri per ISBN - VERSIONE MIGLIORATA
  searchByISBN: async (isbn) => {
    try {
      console.log('🔍 Searching by ISBN:', isbn)
      
      // Pulisci e valida ISBN
      const cleanISBN = isbn.replace(/[-\s]/g, '').trim()
      
      if (!cleanISBN) {
        throw new Error('ISBN non valido')
      }

      if (cleanISBN.length !== 10 && cleanISBN.length !== 13) {
        throw new Error('ISBN deve essere di 10 o 13 cifre')
      }

      // Prova prima con Google Books API
      try {
        console.log('📚 Trying Google Books API...')
        const googleResult = await bookService.searchGoogleBooks(`isbn:${cleanISBN}`, 1)
        
        if (googleResult && googleResult.length > 0) {
          console.log('✅ Found book via Google Books')
          return googleResult[0]
        }
      } catch (googleError) {
        console.log('⚠️ Google Books failed:', googleError.message)
      }

      // Fallback a Open Library
      try {
        console.log('📖 Trying Open Library API...')
        const openLibResult = await bookService.searchOpenLibrary(cleanISBN)
        
        if (openLibResult) {
          console.log('✅ Found book via Open Library')
          return openLibResult
        }
      } catch (openLibError) {
        console.log('⚠️ Open Library failed:', openLibError.message)
      }

      // Se nessuna API funziona
      throw new Error('Libro non trovato per questo ISBN')

    } catch (error) {
      console.error('❌ ISBN search error:', error)
      const message = error.message || 'Errore nella ricerca per ISBN'
      toast.error(message)
      throw new Error(message)
    }
  },

  // Ricerca libri per titolo - VERSIONE MIGLIORATA
  searchByTitle: async (title, maxResults = 10) => {
    try {
      console.log('🔍 Searching by title:', title)
      
      if (!title || title.trim().length < 2) {
        throw new Error('Il titolo deve contenere almeno 2 caratteri')
      }

      const cleanTitle = title.trim()
      
      // Prova con Google Books API
      try {
        console.log('📚 Searching Google Books...')
        const results = await bookService.searchGoogleBooks(cleanTitle, maxResults)
        
        if (results && results.length > 0) {
          console.log(`✅ Found ${results.length} books via Google Books`)
          return results
        }
      } catch (error) {
        console.log('⚠️ Google Books search failed:', error.message)
      }

      // Se Google Books non funziona, prova con una ricerca più semplice
      try {
        console.log('📖 Trying alternative search...')
        const fallbackResults = await bookService.searchGoogleBooksSimple(cleanTitle, maxResults)
        
        if (fallbackResults && fallbackResults.length > 0) {
          console.log(`✅ Found ${fallbackResults.length} books via fallback`)
          return fallbackResults
        }
      } catch (fallbackError) {
        console.log('⚠️ Fallback search failed:', fallbackError.message)
      }

      throw new Error('Nessun libro trovato per questo titolo')

    } catch (error) {
      console.error('❌ Title search error:', error)
      const message = error.message || 'Errore nella ricerca per titolo'
      toast.error(message)
      throw new Error(message)
    }
  },

  // Google Books API con gestione errori migliorata
  searchGoogleBooks: async (query, maxResults = 10) => {
    try {
      const encodedQuery = encodeURIComponent(query)
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodedQuery}&maxResults=${maxResults}&printType=books&langRestrict=it`
      
      console.log('🌐 Google Books URL:', url)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 secondi timeout
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'LibreriaApp/1.0'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (!data.items || data.items.length === 0) {
        throw new Error('Nessun risultato trovato')
      }

      return data.items.map(item => {
        const book = item.volumeInfo
        const isbn = bookService.extractISBN(book.industryIdentifiers)
        return bookService.formatBookFromAPI(book, isbn)
      }).filter(book => book.title && book.author) // Filtra libri con dati essenziali

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Timeout della ricerca')
      }
      throw error
    }
  },

  // Ricerca Google Books semplificata (fallback)
  searchGoogleBooksSimple: async (title, maxResults = 10) => {
    try {
      // Ricerca più semplice senza restrizioni
      const encodedTitle = encodeURIComponent(title)
      const url = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodedTitle}&maxResults=${maxResults}&printType=books`
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data.items || data.items.length === 0) {
        throw new Error('Nessun risultato')
      }

      return data.items.map(item => {
        const book = item.volumeInfo
        const isbn = bookService.extractISBN(book.industryIdentifiers)
        return bookService.formatBookFromAPI(book, isbn)
      }).filter(book => book.title && book.author)

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Timeout')
      }
      throw error
    }
  },

  // Open Library API migliorata
  searchOpenLibrary: async (isbn) => {
    try {
      const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
      
      console.log('🌐 Open Library URL:', url)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'LibreriaApp/1.0'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      const bookKey = `ISBN:${isbn}`
      
      if (!data[bookKey]) {
        throw new Error('Libro non trovato in Open Library')
      }
      
      return bookService.formatBookFromOpenLibrary(data[bookKey], isbn)

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Timeout della ricerca')
      }
      throw error
    }
  },

  // Formatta libro da Google Books API - MIGLIORATO
  formatBookFromAPI: (book, isbn) => {
    try {
      // Estrai anno dalla data di pubblicazione
      let year = null
      if (book.publishedDate) {
        const yearMatch = book.publishedDate.match(/(\d{4})/)
        if (yearMatch) {
          year = parseInt(yearMatch[1])
        }
      }

      // Gestisci immagine copertina
      let coverImage = ''
      if (book.imageLinks) {
        // Preferisci immagini di qualità maggiore
        coverImage = book.imageLinks.large || 
                    book.imageLinks.medium || 
                    book.imageLinks.thumbnail || 
                    book.imageLinks.smallThumbnail || ''
        
        // Assicurati che sia HTTPS
        if (coverImage) {
          coverImage = coverImage.replace('http:', 'https:')
          // Rimuovi zoom=1 per immagini di qualità migliore
          coverImage = coverImage.replace('&zoom=1', '')
        }
      }

      // Gestisci lingua
      let language = 'Italiano'
      if (book.language) {
        switch (book.language.toLowerCase()) {
          case 'it':
          case 'ita':
            language = 'Italiano'
            break
          case 'en':
          case 'eng':
            language = 'Inglese'
            break
          case 'fr':
          case 'fra':
            language = 'Francese'
            break
          case 'es':
          case 'spa':
            language = 'Spagnolo'
            break
          case 'de':
          case 'ger':
            language = 'Tedesco'
            break
          default:
            language = book.language
        }
      }

      return {
        title: book.title || '',
        author: book.authors ? book.authors.join(', ') : '',
        isbn: isbn || '',
        isbn13: isbn && isbn.length === 13 ? isbn : '',
        year: year,
        description: book.description ? 
          book.description.replace(/<[^>]*>/g, '').substring(0, 1000) : '', // Rimuovi HTML e limita
        cover_image: coverImage,
        pages: book.pageCount || null,
        language: language,
        publisher: book.publisher || '',
        genre: book.categories ? book.categories.slice(0, 3).join(', ') : ''
      }
    } catch (error) {
      console.error('Error formatting book from API:', error)
      return {
        title: book.title || '',
        author: book.authors ? book.authors.join(', ') : '',
        isbn: isbn || '',
        year: null,
        description: '',
        cover_image: '',
        pages: null,
        language: 'Italiano',
        publisher: '',
        genre: ''
      }
    }
  },

  // Formatta libro da Open Library - MIGLIORATO
  formatBookFromOpenLibrary: (book, isbn) => {
    try {
      // Estrai anno
      let year = null
      if (book.publish_date) {
        const yearMatch = book.publish_date.match(/(\d{4})/)
        if (yearMatch) {
          year = parseInt(yearMatch[1])
        }
      }

      // Gestisci copertina
      let coverImage = ''
      if (book.cover) {
        coverImage = book.cover.large || book.cover.medium || book.cover.small || ''
      }

      return {
        title: book.title || '',
        author: book.authors ? book.authors.map(a => a.name).join(', ') : '',
        isbn: isbn || '',
        isbn13: isbn && isbn.length === 13 ? isbn : '',
        year: year,
        description: book.notes || book.description || '',
        cover_image: coverImage,
        pages: book.number_of_pages || null,
        language: 'Italiano',
        publisher: book.publishers ? book.publishers.map(p => p.name).join(', ') : '',
        genre: book.subjects ? book.subjects.slice(0, 3).map(s => s.name).join(', ') : ''
      }
    } catch (error) {
      console.error('Error formatting book from Open Library:', error)
      return {
        title: book.title || '',
        author: '',
        isbn: isbn || '',
        year: null,
        description: '',
        cover_image: '',
        pages: null,
        language: 'Italiano',
        publisher: '',
        genre: ''
      }
    }
  },

  // Estrai ISBN da industryIdentifiers - MIGLIORATO
  extractISBN: (identifiers) => {
    if (!identifiers || !Array.isArray(identifiers)) return ''
    
    // Preferisci ISBN-13, poi ISBN-10
    const isbn13 = identifiers.find(id => id.type === 'ISBN_13')
    const isbn10 = identifiers.find(id => id.type === 'ISBN_10')
    const other = identifiers.find(id => id.type === 'OTHER')
    
    return isbn13?.identifier || isbn10?.identifier || other?.identifier || ''
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