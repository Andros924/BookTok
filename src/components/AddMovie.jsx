import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Film, Plus, ArrowLeft, Loader, AlertCircle, Upload, X, Image } from 'lucide-react';
import movieService from '../services/movieService';

function AddMovie() {
  const [searchType, setSearchType] = useState('title');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [loading, setLoading] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [imageUploadMode, setImageUploadMode] = useState('url');
  const [uploadingImage, setUploadingImage] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    director: '',
    year: '',
    duration_minutes: '',
    description: '',
    cover_image: '',
    language: 'Italiano',
    studio: '',
    genre: '',
    personal_notes: '',
    rating: '',
    watch_status: 'to_watch',
    location: 'Collezione',
    format: 'Digital',
    purchase_price: '',
    purchase_date: '',
    is_favorite: false,
    imdb_id: '',
    tmdb_id: ''
  });

  // Opzioni formato disponibili
  const formatOptions = [
    { value: 'Digital', label: 'Digitale' },
    { value: 'DVD', label: 'DVD' },
    { value: 'Blu-ray', label: 'Blu-ray' },
    { value: '4K UHD', label: '4K UHD' },
    { value: 'VHS', label: 'VHS' }
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchError('Inserisci un termine di ricerca');
      return;
    }

    setLoading(true);
    setSearchError('');
    setSearchResults([]);

    try {
      let results;
      if (searchType === 'title') {
        results = await searchTMDBMovies(searchQuery.trim());
      }
      
      if (results && results.length > 0) {
        setSearchResults(results);
        setSearchError('');
      } else {
        setSearchResults([]);
        setSearchError('Nessun film trovato');
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setSearchError(error.message || 'Errore durante la ricerca');
    } finally {
      setLoading(false);
    }
  };

  // Funzione per cercare film tramite TMDB API
  const searchTMDBMovies = async (query) => {
    try {
      const API_KEY = '2ae5dbfc64d4a35e4466b80df98d1613';
      const url = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=it-IT`;
      
      console.log('🌐 TMDB API URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        return [];
      }

      // Formatta i risultati per il nostro formato
      return data.results.slice(0, 10).map(movie => ({
        title: movie.title || movie.original_title || '',
        director: 'Regista da verificare', // TMDB non fornisce il regista nella ricerca base
        year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
        description: movie.overview || '',
        cover_image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
        duration_minutes: null, // Richiede chiamata separata per i dettagli
        studio: '',
        genre: '', // Richiede mapping dei genre_ids
        language: movie.original_language === 'it' ? 'Italiano' : 
                 movie.original_language === 'en' ? 'Inglese' : 
                 movie.original_language === 'fr' ? 'Francese' : 
                 movie.original_language === 'es' ? 'Spagnolo' : 
                 movie.original_language === 'de' ? 'Tedesco' : 'Altro',
        tmdb_id: movie.id.toString(),
        format: 'Digital'
      })).filter(movie => movie.title); // Filtra film con titolo valido
    } catch (error) {
      console.error('❌ TMDB API error:', error);
      throw error;
    }
  };

  const selectMovie = (movie) => {
    setSelectedMovie(movie);
    setFormData({
      ...formData,
      ...movie,
      personal_notes: '',
      rating: '',
      watch_status: 'to_watch',
      location: 'Collezione',
      format: 'Digital',
      purchase_price: '',
      purchase_date: '',
      is_favorite: false
    });
    
    // Imposta l'anteprima dell'immagine se disponibile
    if (movie.cover_image) {
      setImagePreview(movie.cover_image);
      setImageUploadMode('url');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Aggiorna anteprima se cambia l'URL della copertina
    if (name === 'cover_image' && imageUploadMode === 'url') {
      setImagePreview(value);
    }
  };

  // Gestione caricamento file immagine
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validazione file
    if (!file.type.startsWith('image/')) {
      alert('Seleziona un file immagine valido');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB max
      alert('L\'immagine deve essere inferiore a 5MB');
      return;
    }

    setUploadingImage(true);

    try {
      // Converti in base64
      const base64 = await convertToBase64(file);
      
      // Aggiorna form data e anteprima
      setFormData(prev => ({
        ...prev,
        cover_image: base64
      }));
      setImagePreview(base64);
      setImageUploadMode('upload');
      
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Errore nel caricamento dell\'immagine');
    } finally {
      setUploadingImage(false);
    }
  };

  // Funzione per convertire file in base64
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Rimuovi immagine
  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      cover_image: ''
    }));
    setImagePreview('');
    setImageUploadMode('url');
  };

  // Cambia modalità di inserimento immagine
  const switchImageMode = (mode) => {
    setImageUploadMode(mode);
    if (mode === 'url') {
      setImagePreview(formData.cover_image || '');
    }
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.title.trim()) {
      errors.push('Il titolo è obbligatorio');
    }
    
    if (!formData.director.trim()) {
      errors.push('Il regista è obbligatorio');
    }
    
    if (formData.rating && (parseInt(formData.rating) < 1 || parseInt(formData.rating) > 5)) {
      errors.push('La valutazione deve essere tra 1 e 5');
    }
    
    if (formData.year && (parseInt(formData.year) < 1888 || parseInt(formData.year) > new Date().getFullYear() + 5)) {
      errors.push('Anno non valido');
    }
    
    if (formData.duration_minutes && parseInt(formData.duration_minutes) <= 0) {
      errors.push('La durata deve essere maggiore di 0');
    }
    
    if (formData.purchase_price && parseFloat(formData.purchase_price) < 0) {
      errors.push('Il prezzo non può essere negativo');
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      alert(validationErrors.join('\n'));
      return;
    }
    
    setLoading(true);

    try {
      // Prepara i dati per l'invio
      const movieData = {
        ...formData,
        title: formData.title.trim(),
        director: formData.director.trim(),
        year: formData.year ? parseInt(formData.year) : null,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        rating: formData.rating ? parseInt(formData.rating) : null,
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
        description: formData.description.trim() || null,
        cover_image: formData.cover_image.trim() || null,
        studio: formData.studio.trim() || null,
        genre: formData.genre.trim() || null,
        personal_notes: formData.personal_notes.trim() || null,
        location: formData.location.trim() || 'Collezione',
        language: formData.language || 'Italiano',
        format: formData.format || 'Digital',
        imdb_id: formData.imdb_id.trim() || null,
        tmdb_id: formData.tmdb_id.trim() || null
      };

      console.log('🎬 Submitting movie data:', movieData);
      
      await movieService.addMovie(movieData);
      navigate('/movies');
    } catch (error) {
      console.error('❌ Submit error:', error);
      // L'errore è già gestito nel service con toast
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      director: '',
      year: '',
      duration_minutes: '',
      description: '',
      cover_image: '',
      language: 'Italiano',
      studio: '',
      genre: '',
      personal_notes: '',
      rating: '',
      watch_status: 'to_watch',
      location: 'Collezione',
      format: 'Digital',
      purchase_price: '',
      purchase_date: '',
      is_favorite: false,
      imdb_id: '',
      tmdb_id: ''
    });
    setSelectedMovie(null);
    setManualEntry(false);
    setSearchResults([]);
    setSearchError('');
    setSearchQuery('');
    setImagePreview('');
    setImageUploadMode('url');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Header */}
        <div className="flex items-center mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/movies')}
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4 p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="hidden sm:inline">Torna alla filmoteca</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Aggiungi Nuovo Film</h1>
        </div>

        {!manualEntry && !selectedMovie && (
          <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Cerca Film</h2>
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
                >
                  <option value="title">Titolo</option>
                </select>
                
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Inserisci titolo del film..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 text-sm sm:text-base"
                  >
                    {loading ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">{loading ? 'Cerca...' : 'Cerca'}</span>
                  </button>
                </div>
              </div>

              <button
                onClick={() => setManualEntry(true)}
                className="text-purple-600 hover:text-purple-800 text-sm font-medium"
              >
                Oppure inserisci manualmente i dati del film
              </button>
            </div>

            {/* Errore di ricerca */}
            {searchError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <span className="text-red-700 text-sm">{searchError}</span>
              </div>
            )}

            {/* Risultati della ricerca */}
            {searchResults.length > 0 && (
              <div className="mt-6">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Risultati della ricerca</h3>
                <div className="space-y-3 sm:space-y-4">
                  {searchResults.map((movie, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => selectMovie(movie)}
                    >
                      <div className="flex gap-3 sm:gap-4">
                        {movie.cover_image ? (
                          <img
                            src={movie.cover_image}
                            alt={movie.title}
                            className="w-12 h-16 sm:w-16 sm:h-20 object-cover rounded flex-shrink-0"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="w-12 h-16 sm:w-16 sm:h-20 bg-gray-200 rounded flex items-center justify-center flex-shrink-0" style={{display: movie.cover_image ? 'none' : 'flex'}}>
                          <Film className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2">{movie.title}</h4>
                          <p className="text-gray-600 text-sm mt-1">{movie.director}</p>
                          <p className="text-gray-500 text-xs sm:text-sm mt-1">{movie.year} • {movie.language}</p>
                          {movie.description && (
                            <p className="text-gray-600 text-xs sm:text-sm mt-2 line-clamp-2">
                              {movie.description.substring(0, 150)}...
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {(manualEntry || selectedMovie) && (
          <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {selectedMovie ? 'Conferma Dettagli Film' : 'Inserimento Manuale'}
              </h2>
              <div className="flex gap-2">
                {selectedMovie && (
                  <button
                    onClick={resetForm}
                    className="text-gray-500 hover:text-gray-700 text-sm px-3 py-1 border border-gray-300 rounded"
                  >
                    Nuova ricerca
                  </button>
                )}
                {!selectedMovie && (
                  <button
                    onClick={() => setManualEntry(false)}
                    className="text-gray-500 hover:text-gray-700 text-sm px-3 py-1 border border-gray-300 rounded"
                  >
                    Torna alla ricerca
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titolo *
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Regista *
                  </label>
                  <input
                    type="text"
                    name="director"
                    required
                    value={formData.director}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Anno
                  </label>
                  <input
                    type="number"
                    name="year"
                    min="1888"
                    max={new Date().getFullYear() + 5}
                    value={formData.year}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durata (minuti)
                  </label>
                  <input
                    type="number"
                    name="duration_minutes"
                    min="1"
                    value={formData.duration_minutes}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Studio/Casa di produzione
                  </label>
                  <input
                    type="text"
                    name="studio"
                    value={formData.studio}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lingua
                  </label>
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
                  >
                    <option value="Italiano">Italiano</option>
                    <option value="Inglese">Inglese</option>
                    <option value="Francese">Francese</option>
                    <option value="Spagnolo">Spagnolo</option>
                    <option value="Tedesco">Tedesco</option>
                    <option value="Altro">Altro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Genere
                  </label>
                  <input
                    type="text"
                    name="genre"
                    value={formData.genre}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Formato *
                  </label>
                  <select
                    name="format"
                    value={formData.format}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
                  >
                    {formatOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stato di Visione
                  </label>
                  <select
                    name="watch_status"
                    value={formData.watch_status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
                  >
                    <option value="to_watch">Da Vedere</option>
                    <option value="watching">In Visione</option>
                    <option value="watched">Visto</option>
                    <option value="abandoned">Abbandonato</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valutazione (1-5)
                  </label>
                  <select
                    name="rating"
                    value={formData.rating}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
                  >
                    <option value="">Nessuna valutazione</option>
                    <option value="1">1 stella</option>
                    <option value="2">2 stelle</option>
                    <option value="3">3 stelle</option>
                    <option value="4">4 stelle</option>
                    <option value="5">5 stelle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Posizione
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
                    placeholder="Collezione, Scaffale, ecc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prezzo di acquisto (€)
                  </label>
                  <input
                    type="number"
                    name="purchase_price"
                    min="0"
                    step="0.01"
                    value={formData.purchase_price}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Sezione Immagine di Copertina */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Immagine di Copertina
                </label>
                
                {/* Toggle modalità inserimento */}
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => switchImageMode('url')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      imageUploadMode === 'url'
                        ? 'bg-purple-100 text-purple-700 border border-purple-300'
                        : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    <Image className="h-4 w-4" />
                    URL Immagine
                  </button>
                  <button
                    type="button"
                    onClick={() => switchImageMode('upload')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      imageUploadMode === 'upload'
                        ? 'bg-purple-100 text-purple-700 border border-purple-300'
                        : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    <Upload className="h-4 w-4" />
                    Carica File
                  </button>
                </div>

                {/* Input URL */}
                {imageUploadMode === 'url' && (
                  <div className="space-y-3">
                    <input
                      type="url"
                      name="cover_image"
                      value={formData.cover_image}
                      onChange={handleInputChange}
                      placeholder="https://esempio.com/copertina.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
                    />
                    <p className="text-xs text-gray-500">
                      Inserisci l'URL di un'immagine online
                    </p>
                  </div>
                )}

                {/* Upload File */}
                {imageUploadMode === 'upload' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {uploadingImage ? (
                            <Loader className="h-8 w-8 text-gray-400 animate-spin mb-2" />
                          ) : (
                            <Upload className="h-8 w-8 text-gray-400 mb-2" />
                          )}
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Clicca per caricare</span> o trascina qui
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, JPEG (MAX. 5MB)</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* Anteprima Immagine */}
                {imagePreview && (
                  <div className="mt-4">
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Anteprima copertina"
                        className="w-24 h-32 sm:w-32 sm:h-40 object-cover rounded-lg border border-gray-200 shadow-sm"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div 
                        className="w-24 h-32 sm:w-32 sm:h-40 bg-gray-200 rounded-lg border border-gray-200 flex items-center justify-center"
                        style={{display: 'none'}}
                      >
                        <span className="text-xs text-gray-500 text-center px-2">Immagine non valida</span>
                      </div>
                      
                      {/* Pulsante rimozione */}
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {imageUploadMode === 'upload' ? 'Immagine caricata' : 'Anteprima da URL'}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrizione
                </label>
                <textarea
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note Personali
                </label>
                <textarea
                  name="personal_notes"
                  rows={3}
                  value={formData.personal_notes}
                  onChange={handleInputChange}
                  placeholder="Aggiungi le tue note personali su questo film..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_favorite"
                  id="is_favorite"
                  checked={formData.is_favorite}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="is_favorite" className="ml-2 block text-sm text-gray-900">
                  Aggiungi ai preferiti
                </label>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/movies')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm sm:text-base"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {loading ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {loading ? 'Aggiunta...' : 'Aggiungi Film'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default AddMovie;