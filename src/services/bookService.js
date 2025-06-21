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

      if (error) {
        console.error('❌ Database error in getAllBooks:', error)
        throw error
      }
      
      console.log('✅ getAllBooks success:', data?.length || 0, 'books found')
      return data || []
    } catch (error) {
      const message = error.message || 'Errore nel recupero dei libri'
      console.error('💥 getAllBooks error:', message)
      toast.error(message)
      throw new Error(message)
    }
  },

  // Ottieni un libro specifico - VERSIONE MIGLIORATA
  getBook: async (bookId) => {
    try {
      console.log('🔍 Getting book with ID:', bookId)
      
      if (!bookId) {
        throw new Error('ID libro non fornito')
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Utente non autenticato')
      }

      console.log('👤 User authenticated:', user.id)

      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('❌ Database error in getBook:', error)
        
        if (error.code === 'PGRST116') {
          throw new Error('Libro non trovato')
        }
        
        throw error
      }

      if (!data) {
        console.error('❌ No book data returned')
        throw new Error('Libro non trovato')
      }

      console.log('✅ Book found successfully:', data.title)
      return data
    } catch (error) {
      const message = error.message || 'Errore nel recupero del libro'
      console.error('💥 getBook error:', message)
      
      // Non mostrare toast per errori di "non trovato" - li gestisce il componente
      if (!message.includes('non trovato') && !message.includes('not found')) {
        toast.error(message)
      }
      
      throw new Error(message)
    }
  },

  // Aggiungi nuovo libro - VERSIONE CORRETTA
  addBook: async (bookData) => {
    try {
      console.log('📚 Adding book with data:', bookData)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non autenticato')

      // Validazione dati obbligatori
      if (!bookData.title || !bookData.author) {
        throw new Error('Titolo e autore sono obbligatori')
      }

      // Prepara i dati del libro con validazione e pulizia
      const bookToInsert = {
        user_id: user.id,
        title: String(bookData.title).trim(),
        author: String(bookData.author).trim(),
        
        // Campi opzionali con validazione
        isbn: bookData.isbn ? String(bookData.isbn).trim() : null,
        isbn13: bookData.isbn13 ? String(bookData.isbn13).trim() : null,
        description: bookData.description ? String(bookData.description).trim() : null,
        cover_image: bookData.cover_image ? String(bookData.cover_image).trim() : null,
        publisher: bookData.publisher ? String(bookData.publisher).trim() : null,
        genre: bookData.genre ? String(bookData.genre).trim() : null,
        personal_notes: bookData.personal_notes ? String(bookData.personal_notes).trim() : null,
        location: bookData.location ? String(bookData.location).trim() : 'Libreria',
        language: bookData.language ? String(bookData.language).trim() : 'Italiano',
        
        // Campi numerici con validazione
        year: bookData.year ? parseInt(bookData.year) : null,
        pages: bookData.pages ? parseInt(bookData.pages) : 0,
        rating: bookData.rating ? parseInt(bookData.rating) : null,
        purchase_price: bookData.purchase_price ? parseFloat(bookData.purchase_price) : null,
        
        // Campi booleani
        is_favorite: bookData.is_favorite ? Boolean(bookData.is_favorite) : false,
        
        // Stato di lettura
        read_status: bookData.read_status || 'to_read',
        
        // Date
        date_started: bookData.date_started || null,
        date_finished: bookData.date_finished || null,
        purchase_date: bookData.purchase_date || null,
        
        // Array di tags
        tags: bookData.tags && Array.isArray(bookData.tags) ? bookData.tags : null,
        
        // Timestamp automatici
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Validazioni aggiuntive
      if (bookToInsert.rating && (bookToInsert.rating < 1 || bookToInsert.rating > 5)) {
        throw new Error('La valutazione deve essere tra 1 e 5')
      }

      if (bookToInsert.year && (bookToInsert.year < 1000 || bookToInsert.year > new Date().getFullYear() + 1)) {
        throw new Error('Anno non valido')
      }

      if (bookToInsert.pages && bookToInsert.pages < 0) {
        bookToInsert.pages = 0
      }

      // Valida read_status
      const validStatuses = ['to_read', 'reading', 'read', 'abandoned']
      if (!validStatuses.includes(bookToInsert.read_status)) {
        bookToInsert.read_status = 'to_read'
      }

      console.log('✅ Validated book data:', bookToInsert)

      const { data, error } = await supabase
        .from('books')
        .insert(bookToInsert)
        .select()
        .single()

      if (error) {
        console.error('❌ Database insert error:', error)
        throw error
      }

      console.log('✅ Book added successfully:', data.id)
      toast.success('Libro aggiunto con successo!')
      return data
    } catch (error) {
      console.error('💥 Add book error:', error)
      const message = bookService.getBookErrorMessage(error)
      toast.error(message)
      throw new Error(message)
    }
  },

  // Aggiorna libro esistente - VERSIONE CORRETTA
  updateBook: async (bookId, bookData) => {
    try {
      console.log('📝 Updating book:', bookId, bookData)
      
      if (!bookId) {
        throw new Error('ID libro non fornito')
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non autenticato')

      // Prepara i dati per l'aggiornamento con validazione
      const updateData = {
        updated_at: new Date().toISOString()
      }

      // Aggiorna solo i campi forniti
      if (bookData.title !== undefined) {
        updateData.title = String(bookData.title).trim()
      }
      if (bookData.author !== undefined) {
        updateData.author = String(bookData.author).trim()
      }
      if (bookData.isbn !== undefined) {
        updateData.isbn = bookData.isbn ? String(bookData.isbn).trim() : null
      }
      if (bookData.isbn13 !== undefined) {
        updateData.isbn13 = bookData.isbn13 ? String(bookData.isbn13).trim() : null
      }
      if (bookData.description !== undefined) {
        updateData.description = bookData.description ? String(bookData.description).trim() : null
      }
      if (bookData.cover_image !== undefined) {
        updateData.cover_image = bookData.cover_image ? String(bookData.cover_image).trim() : null
      }
      if (bookData.publisher !== undefined) {
        updateData.publisher = bookData.publisher ? String(bookData.publisher).trim() : null
      }
      if (bookData.genre !== undefined) {
        updateData.genre = bookData.genre ? String(bookData.genre).trim() : null
      }
      if (bookData.personal_notes !== undefined) {
        updateData.personal_notes = bookData.personal_notes ? String(bookData.personal_notes).trim() : null
      }
      if (bookData.location !== undefined) {
        updateData.location = bookData.location ? String(bookData.location).trim() : 'Libreria'
      }
      if (bookData.language !== undefined) {
        updateData.language = bookData.language ? String(bookData.language).trim() : 'Italiano'
      }

      // Campi numerici
      if (bookData.year !== undefined) {
        updateData.year = bookData.year ? parseInt(bookData.year) : null
      }
      if (bookData.pages !== undefined) {
        updateData.pages = bookData.pages ? parseInt(bookData.pages) : 0
      }
      if (bookData.rating !== undefined) {
        updateData.rating = bookData.rating ? parseInt(bookData.rating) : null
      }
      if (bookData.purchase_price !== undefined) {
        updateData.purchase_price = bookData.purchase_price ? parseFloat(bookData.purchase_price) : null
      }

      // Campi booleani
      if (bookData.is_favorite !== undefined) {
        updateData.is_favorite = Boolean(bookData.is_favorite)
      }

      // Stato di lettura
      if (bookData.read_status !== undefined) {
        const validStatuses = ['to_read', 'reading', 'read', 'abandoned']
        updateData.read_status = validStatuses.includes(bookData.read_status) ? bookData.read_status : 'to_read'
      }

      // Date
      if (bookData.date_started !== undefined) {
        updateData.date_started = bookData.date_started
      }
      if (bookData.date_finished !== undefined) {
        updateData.date_finished = bookData.date_finished
      }
      if (bookData.purchase_date !== undefined) {
        updateData.purchase_date = bookData.purchase_date
      }

      // Tags
      if (bookData.tags !== undefined) {
        updateData.tags = bookData.tags && Array.isArray(bookData.tags) ? bookData.tags : null
      }

      // Validazioni
      if (updateData.rating && (updateData.rating < 1 || updateData.rating > 5)) {
        throw new Error('La valutazione deve essere tra 1 e 5')
      }

      if (updateData.year && (updateData.year < 1000 || updateData.year > new Date().getFullYear() + 1)) {
        throw new Error('Anno non valido')
      }

      console.log('✅ Validated update data:', updateData)

      const { data, error } = await supabase
        .from('books')
        .update(updateData)
        .eq('id', bookId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('❌ Database update error:', error)
        
        if (error.code === 'PGRST116') {
          throw new Error('Libro non trovato o non autorizzato')
        }
        
        throw error
      }

      if (!data) {
        throw new Error('Nessun libro aggiornato - verifica i permessi')
      }

      console.log('✅ Book updated successfully')
      toast.success('Libro aggiornato con successo!')
      return data
    } catch (error) {
      console.error('💥 Update book error:', error)
      const message = bookService.getBookErrorMessage(error)
      toast.error(message)
      throw new Error(message)
    }
  },

  // Elimina libro
  deleteBook: async (bookId) => {
    try {
      if (!bookId) {
        throw new Error('ID libro non fornito')
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non autenticato')

      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId)
        .eq('user_id', user.id)

      if (error) {
        console.error('❌ Database delete error:', error)
        throw error
      }

      toast.success('Libro eliminato con successo!')
    } catch (error) {
      const message = error.message || 'Errore nell\'eliminazione del libro'
      console.error('💥 Delete book error:', message)
      toast.error(message)
      throw new Error(message)
    }
  },

  // Aggiorna stato di lettura - VERSIONE CORRETTA
  updateReadingStatus: async (bookId, status, additionalData = {}) => {
    try {
      console.log('📖 Updating reading status:', { bookId, status, additionalData })
      
      if (!bookId) {
        throw new Error('ID libro non fornito')
      }

      const updateData = {
        read_status: status,
        updated_at: new Date().toISOString(),
        ...additionalData
      }

      // Aggiungi date automatiche se non fornite
      if (status === 'reading' && !updateData.date_started) {
        updateData.date_started = new Date().toISOString()
        console.log('📅 Adding start date automatically')
      }
      if (status === 'read' && !updateData.date_finished) {
        updateData.date_finished = new Date().toISOString()
        console.log('📅 Adding finish date automatically')
      }

      // Usa la funzione updateBook invece di this.updateBook
      const result = await bookService.updateBook(bookId, updateData)
      console.log('✅ Reading status updated successfully')
      return result
    } catch (error) {
      console.error('❌ Error updating reading status:', error)
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

  // Ricerca libri per ISBN - IMPLEMENTAZIONE GOOGLE BOOKS API REALE
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

      // Usa Google Books API REALE
      const result = await bookService.searchGoogleBooks(`isbn:${cleanISBN}`)
      
      if (result && result.length > 0) {
        console.log('✅ Found book via Google Books API')
        return result[0] // Ritorna il primo risultato per ISBN
      }

      throw new Error('Libro non trovato per questo ISBN')

    } catch (error) {
      console.error('❌ ISBN search error:', error)
      const message = error.message || 'Errore nella ricerca per ISBN'
      toast.error(message)
      throw new Error(message)
    }
  },

  // Ricerca libri per titolo - IMPLEMENTAZIONE GOOGLE BOOKS API REALE
  searchByTitle: async (title, maxResults = 10) => {
    try {
      console.log('🔍 Searching by title:', title)
      
      if (!title || title.trim().length < 2) {
        throw new Error('Il titolo deve contenere almeno 2 caratteri')
      }

      const cleanTitle = title.trim()
      
      // Usa Google Books API REALE
      const results = await bookService.searchGoogleBooks(cleanTitle, maxResults)
      
      if (results && results.length > 0) {
        console.log(`✅ Found ${results.length} books via Google Books API`)
        return results
      }

      throw new Error('Nessun libro trovato per questo titolo')

    } catch (error) {
      console.error('❌ Title search error:', error)
      const message = error.message || 'Errore nella ricerca per titolo'
      toast.error(message)
      throw new Error(message)
    }
  },

  // IMPLEMENTAZIONE REALE GOOGLE BOOKS API - Come nel tuo esempio
  searchGoogleBooks: async (query, maxResults = 10) => {
    try {
      // Determina se è una ricerca per ISBN
      const isISBN = /^\d{10}(\d{3})?$/.test(query.trim()) || query.startsWith('isbn:')
      const searchQuery = isISBN && !query.startsWith('isbn:') ? `isbn:${query}` : query

      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=${maxResults}`
      
      console.log('🌐 Google Books API URL:', url)
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (!data.items || data.totalItems === 0) {
        return []
      }

      // Formatta i risultati usando la stessa logica del tuo esempio
      return data.items.map(item => {
        const volume = item.volumeInfo
        
        return {
          title: volume.title || '',
          author: volume.authors?.join(', ') || '',
          year: volume.publishedDate ? new Date(volume.publishedDate).getFullYear() : null,
          description: volume.description || '',
          cover_image: volume.imageLinks?.thumbnail || '',
          pages: volume.pageCount || null,
          publisher: volume.publisher || '',
          isbn: bookService.extractISBN(volume.industryIdentifiers, 'ISBN_10'),
          isbn13: bookService.extractISBN(volume.industryIdentifiers, 'ISBN_13'),
          language: bookService.mapGoogleLanguage(volume.language),
          genre: volume.categories?.join(', ') || ''
        }
      }).filter(book => book.title && book.author) // Filtra libri con dati essenziali

    } catch (error) {
      console.error('❌ Google Books API error:', error)
      throw error
    }
  },

  // Estrai ISBN dai dati Google Books
  extractISBN: (identifiers, type) => {
    if (!identifiers || !Array.isArray(identifiers)) return ''
    
    const identifier = identifiers.find(id => id.type === type)
    return identifier?.identifier || ''
  },

  // Mappa lingua Google Books
  mapGoogleLanguage: (languageCode) => {
    if (!languageCode) return 'Italiano'
    
    const languageMap = {
      'it': 'Italiano',
      'en': 'Inglese', 
      'fr': 'Francese',
      'es': 'Spagnolo',
      'de': 'Tedesco',
      'pt': 'Portoghese',
      'ru': 'Russo',
      'ja': 'Giapponese',
      'zh': 'Cinese'
    }
    
    return languageMap[languageCode.toLowerCase()] || 'Altro'
  },

  // Aggiungi ai preferiti - VERSIONE CORRETTA
  toggleFavorite: async (bookId) => {
    try {
      console.log('❤️ Toggling favorite for book:', bookId)
      
      if (!bookId) {
        throw new Error('ID libro non fornito')
      }

      // Prima ottieni il libro corrente
      const book = await bookService.getBook(bookId)
      
      if (!book) {
        throw new Error('Libro non trovato')
      }

      // Poi aggiorna lo stato preferito
      const result = await bookService.updateBook(bookId, { 
        is_favorite: !book.is_favorite 
      })
      
      console.log('✅ Favorite toggled successfully')
      return result
    } catch (error) {
      console.error('❌ Error toggling favorite:', error)
      throw error
    }
  },

  // Ottieni libri per genere
  getBooksByGenre: async () => {
    try {
      const books = await bookService.getAllBooks()
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
  },

  // Gestione errori specifici per i libri
  getBookErrorMessage: (error) => {
    const message = error.message || ''
    
    if (message.includes('duplicate key value violates unique constraint')) {
      return 'Questo libro è già presente nella tua libreria'
    }
    if (message.includes('violates check constraint "books_rating_check"')) {
      return 'La valutazione deve essere tra 1 e 5'
    }
    if (message.includes('violates check constraint "books_read_status_check"')) {
      return 'Stato di lettura non valido'
    }
    if (message.includes('violates not-null constraint')) {
      if (message.includes('title')) return 'Il titolo è obbligatorio'
      if (message.includes('author')) return 'L\'autore è obbligatorio'
      if (message.includes('user_id')) return 'Errore di autenticazione'
    }
    if (message.includes('violates foreign key constraint')) {
      return 'Errore di riferimento nel database'
    }
    if (message.includes('new row violates row-level security policy')) {
      return 'Non hai i permessi per questa operazione'
    }
    if (message.includes('PGRST116')) {
      return 'Libro non trovato'
    }
    
    return message || 'Errore sconosciuto'
  }
}

export default bookService