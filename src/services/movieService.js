import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const movieService = {
  // Ottieni tutti i film dell'utente
  getAllMovies: async (filters = {}) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non autenticato')

      let query = supabase
        .from('movies')
        .select('*')
        .eq('user_id', user.id)

      // Applica filtri
      if (filters.status) {
        query = query.eq('watch_status', filters.status)
      }
      if (filters.genre) {
        query = query.ilike('genre', `%${filters.genre}%`)
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,director.ilike.%${filters.search}%`)
      }
      if (filters.rating) {
        query = query.eq('rating', filters.rating)
      }
      if (filters.year) {
        query = query.eq('year', filters.year)
      }
      if (filters.format) {
        query = query.eq('format', filters.format)
      }

      // Ordinamento - CORRETTO per gestire l'ordinamento alfabetico
      const sortBy = filters.sortBy || 'created_at'
      const sortOrder = filters.sortOrder || 'desc'
      
      // Per l'ordinamento alfabetico, forziamo sempre 'asc'
      if (sortBy === 'title' || sortBy === 'director') {
        query = query.order(sortBy, { ascending: true })
      } else {
        query = query.order(sortBy, { ascending: sortOrder === 'asc' })
      }

      const { data, error } = await query

      if (error) {
        console.error('❌ Database error in getAllMovies:', error)
        throw error
      }
      
      console.log('✅ getAllMovies success:', data?.length || 0, 'movies found')
      return data || []
    } catch (error) {
      const message = error.message || 'Errore nel recupero dei film'
      console.error('💥 getAllMovies error:', message)
      toast.error(message)
      throw new Error(message)
    }
  },

  // Ottieni un film specifico
  getMovie: async (movieId) => {
    try {
      console.log('🔍 Getting movie with ID:', movieId)
      
      if (!movieId) {
        throw new Error('ID film non fornito')
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Utente non autenticato')
      }

      console.log('👤 User authenticated:', user.id)

      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .eq('id', movieId)
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('❌ Database error in getMovie:', error)
        
        if (error.code === 'PGRST116') {
          throw new Error('Film non trovato')
        }
        
        throw error
      }

      if (!data) {
        console.error('❌ No movie data returned')
        throw new Error('Film non trovato')
      }

      console.log('✅ Movie found successfully:', data.title)
      return data
    } catch (error) {
      const message = error.message || 'Errore nel recupero del film'
      console.error('💥 getMovie error:', message)
      
      if (!message.includes('non trovato') && !message.includes('not found')) {
        toast.error(message)
      }
      
      throw new Error(message)
    }
  },

  // Aggiungi nuovo film
  addMovie: async (movieData) => {
    try {
      console.log('🎬 Adding movie with data:', movieData)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non autenticato')

      // Validazione dati obbligatori
      if (!movieData.title || !movieData.director) {
        throw new Error('Titolo e regista sono obbligatori')
      }

      // Prepara i dati del film con validazione e pulizia
      const movieToInsert = {
        user_id: user.id,
        title: String(movieData.title).trim(),
        director: String(movieData.director).trim(),
        
        // Campi opzionali con validazione
        description: movieData.description ? String(movieData.description).trim() : null,
        cover_image: movieData.cover_image ? String(movieData.cover_image).trim() : null,
        studio: movieData.studio ? String(movieData.studio).trim() : null,
        genre: movieData.genre ? String(movieData.genre).trim() : null,
        personal_notes: movieData.personal_notes ? String(movieData.personal_notes).trim() : null,
        location: movieData.location ? String(movieData.location).trim() : 'Collezione',
        language: movieData.language ? String(movieData.language).trim() : 'Italiano',
        format: movieData.format ? String(movieData.format).trim() : 'Digital',
        
        // Campi numerici con validazione
        year: movieData.year ? parseInt(movieData.year) : null,
        duration_minutes: movieData.duration_minutes ? parseInt(movieData.duration_minutes) : null,
        rating: movieData.rating ? parseInt(movieData.rating) : null,
        purchase_price: movieData.purchase_price ? parseFloat(movieData.purchase_price) : null,
        
        // Campi booleani
        is_favorite: movieData.is_favorite ? Boolean(movieData.is_favorite) : false,
        
        // Stato di visione
        watch_status: movieData.watch_status || 'to_watch',
        
        // Date
        date_started: movieData.date_started || null,
        date_finished: movieData.date_finished || null,
        purchase_date: movieData.purchase_date || null,
        
        // Array di tags
        tags: movieData.tags && Array.isArray(movieData.tags) ? movieData.tags : null,
        
        // ID esterni
        imdb_id: movieData.imdb_id ? String(movieData.imdb_id).trim() : null,
        tmdb_id: movieData.tmdb_id ? String(movieData.tmdb_id).trim() : null,
        
        // Timestamp automatici
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Validazioni aggiuntive
      if (movieToInsert.rating && (movieToInsert.rating < 1 || movieToInsert.rating > 5)) {
        throw new Error('La valutazione deve essere tra 1 e 5')
      }

      if (movieToInsert.year && (movieToInsert.year < 1888 || movieToInsert.year > new Date().getFullYear() + 5)) {
        throw new Error('Anno non valido')
      }

      if (movieToInsert.duration_minutes && movieToInsert.duration_minutes <= 0) {
        throw new Error('La durata deve essere maggiore di 0')
      }

      // Valida watch_status
      const validStatuses = ['to_watch', 'watching', 'watched', 'abandoned']
      if (!validStatuses.includes(movieToInsert.watch_status)) {
        movieToInsert.watch_status = 'to_watch'
      }

      // Valida format
      const validFormats = ['DVD', 'Blu-ray', 'Digital', '4K UHD', 'VHS']
      if (!validFormats.includes(movieToInsert.format)) {
        movieToInsert.format = 'Digital'
      }

      console.log('✅ Validated movie data:', movieToInsert)

      const { data, error } = await supabase
        .from('movies')
        .insert(movieToInsert)
        .select()
        .single()

      if (error) {
        console.error('❌ Database insert error:', error)
        throw error
      }

      console.log('✅ Movie added successfully:', data.id)
      toast.success('Film aggiunto con successo!')
      return data
    } catch (error) {
      console.error('💥 Add movie error:', error)
      const message = movieService.getMovieErrorMessage(error)
      toast.error(message)
      throw new Error(message)
    }
  },

  // Aggiorna film esistente
  updateMovie: async (movieId, movieData) => {
    try {
      console.log('📝 Updating movie:', movieId, movieData)
      
      if (!movieId) {
        throw new Error('ID film non fornito')
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non autenticato')

      // Prepara i dati per l'aggiornamento con validazione
      const updateData = {
        updated_at: new Date().toISOString()
      }

      // Aggiorna solo i campi forniti
      if (movieData.title !== undefined) {
        updateData.title = String(movieData.title).trim()
      }
      if (movieData.director !== undefined) {
        updateData.director = String(movieData.director).trim()
      }
      if (movieData.description !== undefined) {
        updateData.description = movieData.description ? String(movieData.description).trim() : null
      }
      if (movieData.cover_image !== undefined) {
        updateData.cover_image = movieData.cover_image ? String(movieData.cover_image).trim() : null
      }
      if (movieData.studio !== undefined) {
        updateData.studio = movieData.studio ? String(movieData.studio).trim() : null
      }
      if (movieData.genre !== undefined) {
        updateData.genre = movieData.genre ? String(movieData.genre).trim() : null
      }
      if (movieData.personal_notes !== undefined) {
        updateData.personal_notes = movieData.personal_notes ? String(movieData.personal_notes).trim() : null
      }
      if (movieData.location !== undefined) {
        updateData.location = movieData.location ? String(movieData.location).trim() : 'Collezione'
      }
      if (movieData.language !== undefined) {
        updateData.language = movieData.language ? String(movieData.language).trim() : 'Italiano'
      }
      if (movieData.format !== undefined) {
        const validFormats = ['DVD', 'Blu-ray', 'Digital', '4K UHD', 'VHS']
        updateData.format = validFormats.includes(movieData.format) ? movieData.format : 'Digital'
      }

      // Campi numerici
      if (movieData.year !== undefined) {
        updateData.year = movieData.year ? parseInt(movieData.year) : null
      }
      if (movieData.duration_minutes !== undefined) {
        updateData.duration_minutes = movieData.duration_minutes ? parseInt(movieData.duration_minutes) : null
      }
      if (movieData.rating !== undefined) {
        updateData.rating = movieData.rating ? parseInt(movieData.rating) : null
      }
      if (movieData.purchase_price !== undefined) {
        updateData.purchase_price = movieData.purchase_price ? parseFloat(movieData.purchase_price) : null
      }

      // Campi booleani
      if (movieData.is_favorite !== undefined) {
        updateData.is_favorite = Boolean(movieData.is_favorite)
      }

      // Stato di visione
      if (movieData.watch_status !== undefined) {
        const validStatuses = ['to_watch', 'watching', 'watched', 'abandoned']
        updateData.watch_status = validStatuses.includes(movieData.watch_status) ? movieData.watch_status : 'to_watch'
      }

      // Date
      if (movieData.date_started !== undefined) {
        updateData.date_started = movieData.date_started
      }
      if (movieData.date_finished !== undefined) {
        updateData.date_finished = movieData.date_finished
      }
      if (movieData.purchase_date !== undefined) {
        updateData.purchase_date = movieData.purchase_date
      }

      // Tags e ID esterni
      if (movieData.tags !== undefined) {
        updateData.tags = movieData.tags && Array.isArray(movieData.tags) ? movieData.tags : null
      }
      if (movieData.imdb_id !== undefined) {
        updateData.imdb_id = movieData.imdb_id ? String(movieData.imdb_id).trim() : null
      }
      if (movieData.tmdb_id !== undefined) {
        updateData.tmdb_id = movieData.tmdb_id ? String(movieData.tmdb_id).trim() : null
      }

      // Validazioni
      if (updateData.rating && (updateData.rating < 1 || updateData.rating > 5)) {
        throw new Error('La valutazione deve essere tra 1 e 5')
      }

      if (updateData.year && (updateData.year < 1888 || updateData.year > new Date().getFullYear() + 5)) {
        throw new Error('Anno non valido')
      }

      if (updateData.duration_minutes && updateData.duration_minutes <= 0) {
        throw new Error('La durata deve essere maggiore di 0')
      }

      console.log('✅ Validated update data:', updateData)

      const { data, error } = await supabase
        .from('movies')
        .update(updateData)
        .eq('id', movieId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('❌ Database update error:', error)
        
        if (error.code === 'PGRST116') {
          throw new Error('Film non trovato o non autorizzato')
        }
        
        throw error
      }

      if (!data) {
        throw new Error('Nessun film aggiornato - verifica i permessi')
      }

      console.log('✅ Movie updated successfully')
      toast.success('Film aggiornato con successo!')
      return data
    } catch (error) {
      console.error('💥 Update movie error:', error)
      const message = movieService.getMovieErrorMessage(error)
      toast.error(message)
      throw new Error(message)
    }
  },

  // Elimina film
  deleteMovie: async (movieId) => {
    try {
      if (!movieId) {
        throw new Error('ID film non fornito')
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non autenticato')

      const { error } = await supabase
        .from('movies')
        .delete()
        .eq('id', movieId)
        .eq('user_id', user.id)

      if (error) {
        console.error('❌ Database delete error:', error)
        throw error
      }

      toast.success('Film eliminato con successo!')
    } catch (error) {
      const message = error.message || 'Errore nell\'eliminazione del film'
      console.error('💥 Delete movie error:', message)
      toast.error(message)
      throw new Error(message)
    }
  },

  // Aggiorna stato di visione
  updateWatchStatus: async (movieId, status, additionalData = {}) => {
    try {
      console.log('🎬 Updating watch status:', { movieId, status, additionalData })
      
      if (!movieId) {
        throw new Error('ID film non fornito')
      }

      const updateData = {
        watch_status: status,
        updated_at: new Date().toISOString(),
        ...additionalData
      }

      // Aggiungi date automatiche se non fornite
      if (status === 'watching' && !updateData.date_started) {
        updateData.date_started = new Date().toISOString()
        console.log('📅 Adding start date automatically')
      }
      if (status === 'watched' && !updateData.date_finished) {
        updateData.date_finished = new Date().toISOString()
        console.log('📅 Adding finish date automatically')
      }

      const result = await movieService.updateMovie(movieId, updateData)
      console.log('✅ Watch status updated successfully')
      return result
    } catch (error) {
      console.error('❌ Error updating watch status:', error)
      throw error
    }
  },

  // Aggiungi ai preferiti
  toggleFavorite: async (movieId) => {
    try {
      console.log('❤️ Toggling favorite for movie:', movieId)
      
      if (!movieId) {
        throw new Error('ID film non fornito')
      }

      // Prima ottieni il film corrente
      const movie = await movieService.getMovie(movieId)
      
      if (!movie) {
        throw new Error('Film non trovato')
      }

      // Poi aggiorna lo stato preferito
      const result = await movieService.updateMovie(movieId, { 
        is_favorite: !movie.is_favorite 
      })
      
      console.log('✅ Favorite toggled successfully')
      return result
    } catch (error) {
      console.error('❌ Error toggling favorite:', error)
      throw error
    }
  },

  // Ottieni statistiche film
  getMovieStats: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non autenticato')

      const { data, error } = await supabase
        .from('user_movie_stats')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      return data || {
        total_movies: 0,
        movies_watched: 0,
        movies_watching: 0,
        movies_to_watch: 0,
        avg_rating: 0,
        total_minutes: 0
      }
    } catch (error) {
      console.error('Error getting movie stats:', error)
      return {
        total_movies: 0,
        movies_watched: 0,
        movies_watching: 0,
        movies_to_watch: 0,
        avg_rating: 0,
        total_minutes: 0
      }
    }
  },

  // Ricerca film tramite API TMDB (The Movie Database)
  searchMoviesByTitle: async (title, maxResults = 10) => {
    try {
      console.log('🔍 Searching movies by title:', title)
      
      if (!title || title.trim().length < 2) {
        throw new Error('Il titolo deve contenere almeno 2 caratteri')
      }

      const cleanTitle = title.trim()
      
      // Usa TMDB API (gratuita)
      const results = await movieService.searchTMDB(cleanTitle, maxResults)
      
      if (results && results.length > 0) {
        console.log(`✅ Found ${results.length} movies via TMDB API`)
        return results
      }

      throw new Error('Nessun film trovato per questo titolo')

    } catch (error) {
      console.error('❌ Title search error:', error)
      const message = error.message || 'Errore nella ricerca per titolo'
      toast.error(message)
      throw new Error(message)
    }
  },

  // Implementazione TMDB API (gratuita)
  searchTMDB: async (query, maxResults = 10) => {
    try {
      // Nota: In un'implementazione reale, dovresti usare una API key di TMDB
      // Per ora usiamo dati mock per la demo
      console.log('🌐 TMDB API search for:', query)
      
      // Mock data per la demo - in produzione sostituire con vera API TMDB
      const mockResults = [
        {
          title: query.includes('Matrix') ? 'The Matrix' : `${query} - Film`,
          director: 'Regista Esempio',
          year: 2023,
          description: `Descrizione del film "${query}". Un'avvincente storia che cattura l'attenzione dello spettatore.`,
          cover_image: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=300',
          duration_minutes: 120,
          studio: 'Studio Cinematografico',
          genre: 'Azione, Drammatico',
          language: 'Italiano',
          format: 'Digital',
          tmdb_id: '12345'
        }
      ]

      return mockResults.slice(0, maxResults)

    } catch (error) {
      console.error('❌ TMDB API error:', error)
      throw error
    }
  },

  // Ottieni film per genere
  getMoviesByGenre: async () => {
    try {
      const movies = await movieService.getAllMovies()
      const genreStats = {}

      movies.forEach(movie => {
        if (movie.genre) {
          const genres = movie.genre.split(',').map(g => g.trim())
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
      console.error('Error getting movies by genre:', error)
      return []
    }
  },

  // Gestione errori specifici per i film
  getMovieErrorMessage: (error) => {
    const message = error.message || ''
    
    if (message.includes('duplicate key value violates unique constraint')) {
      return 'Questo film è già presente nella tua collezione'
    }
    if (message.includes('violates check constraint "movies_rating_check"')) {
      return 'La valutazione deve essere tra 1 e 5'
    }
    if (message.includes('violates check constraint "movies_watch_status_check"')) {
      return 'Stato di visione non valido'
    }
    if (message.includes('violates check constraint "movies_year_check"')) {
      return 'Anno non valido'
    }
    if (message.includes('violates check constraint "movies_duration_check"')) {
      return 'La durata deve essere maggiore di 0'
    }
    if (message.includes('violates not-null constraint')) {
      if (message.includes('title')) return 'Il titolo è obbligatorio'
      if (message.includes('director')) return 'Il regista è obbligatorio'
      if (message.includes('user_id')) return 'Errore di autenticazione'
    }
    if (message.includes('violates foreign key constraint')) {
      return 'Errore di riferimento nel database'
    }
    if (message.includes('new row violates row-level security policy')) {
      return 'Non hai i permessi per questa operazione'
    }
    if (message.includes('PGRST116')) {
      return 'Film non trovato'
    }
    
    return message || 'Errore sconosciuto'
  }
}

export default movieService