import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const bookService = {
  getAllBooks: async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      const message = error.message || 'Errore nel recupero dei libri'
      toast.error(message)
      throw new Error(message)
    }
  },

  addBook: async (bookData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non autenticato')

      const { data, error } = await supabase
        .from('books')
        .insert({
          ...bookData,
          user_id: user.id
        })
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

  updateBook: async (id, bookData) => {
    try {
      const { data, error } = await supabase
        .from('books')
        .update(bookData)
        .eq('id', id)
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

  deleteBook: async (id) => {
    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Libro eliminato con successo!')
    } catch (error) {
      const message = error.message || 'Errore nell\'eliminazione del libro'
      toast.error(message)
      throw new Error(message)
    }
  },

  searchByISBN: async (isbn) => {
    try {
      // Prima prova con Open Library
      const openLibResponse = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`)
      const openLibData = await openLibResponse.json()
      const bookKey = `ISBN:${isbn}`
      
      if (openLibData[bookKey]) {
        const book = openLibData[bookKey]
        return {
          title: book.title || '',
          author: book.authors ? book.authors.map(a => a.name).join(', ') : '',
          isbn: isbn,
          year: book.publish_date ? new Date(book.publish_date).getFullYear() : null,
          description: book.notes || '',
          cover_image: book.cover ? book.cover.large || book.cover.medium || book.cover.small : '',
          pages: book.number_of_pages || null,
          language: 'Italiano',
          publisher: book.publishers ? book.publishers.map(p => p.name).join(', ') : '',
          genre: book.subjects ? book.subjects.slice(0, 3).map(s => s.name).join(', ') : ''
        }
      }

      // Fallback a Google Books
      const googleResponse = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`)
      const googleData = await googleResponse.json()
      
      if (googleData.items && googleData.items.length > 0) {
        const book = googleData.items[0].volumeInfo
        return {
          title: book.title || '',
          author: book.authors ? book.authors.join(', ') : '',
          isbn: isbn,
          year: book.publishedDate ? new Date(book.publishedDate).getFullYear() : null,
          description: book.description || '',
          cover_image: book.imageLinks ? book.imageLinks.thumbnail || book.imageLinks.smallThumbnail : '',
          pages: book.pageCount || null,
          language: book.language === 'it' ? 'Italiano' : 'Inglese',
          publisher: book.publisher || '',
          genre: book.categories ? book.categories.join(', ') : ''
        }
      }

      throw new Error('Libro non trovato')
    } catch (error) {
      const message = 'Libro non trovato'
      toast.error(message)
      throw new Error(message)
    }
  },

  searchByTitle: async (title) => {
    try {
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(title)}&maxResults=10`)
      const data = await response.json()
      const items = data.items || []

      return items.map(item => {
        const book = item.volumeInfo
        const isbn = book.industryIdentifiers ? 
          book.industryIdentifiers.find(id => id.type === 'ISBN_13')?.identifier ||
          book.industryIdentifiers.find(id => id.type === 'ISBN_10')?.identifier : ''

        return {
          title: book.title || '',
          author: book.authors ? book.authors.join(', ') : '',
          isbn: isbn,
          year: book.publishedDate ? new Date(book.publishedDate).getFullYear() : null,
          description: book.description || '',
          cover_image: book.imageLinks ? book.imageLinks.thumbnail || book.imageLinks.smallThumbnail : '',
          pages: book.pageCount || null,
          language: book.language === 'it' ? 'Italiano' : 'Inglese',
          publisher: book.publisher || '',
          genre: book.categories ? book.categories.join(', ') : ''
        }
      })
    } catch (error) {
      const message = 'Errore nella ricerca dei libri'
      toast.error(message)
      throw new Error(message)
    }
  }
}

export default bookService