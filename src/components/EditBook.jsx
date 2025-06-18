import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, Save, ArrowLeft, Loader, Upload, X, Image } from 'lucide-react';
import bookService from '../services/bookService';

function EditBook() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageUploadMode, setImageUploadMode] = useState('url');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    year: '',
    description: '',
    cover_image: '',
    pages: '',
    language: 'Italiano',
    publisher: '',
    genre: '',
    personal_notes: '',
    rating: '',
    read_status: 'to_read',
    location: 'Libreria',
    purchase_price: '',
    purchase_date: '',
    is_favorite: false
  });

  useEffect(() => {
    const fetchBook = async () => {
      if (!id) {
        setError('ID libro mancante');
        setLoading(false);
        return;
      }

      try {
        console.log('📖 Fetching book for edit:', id);
        setLoading(true);
        setError(null);
        
        const bookData = await bookService.getBook(id);
        
        if (!bookData) {
          setError('Libro non trovato');
          setBook(null);
        } else {
          console.log('✅ Book loaded for edit:', bookData.title);
          setBook(bookData);
          
          // Popola il form con i dati del libro
          setFormData({
            title: bookData.title || '',
            author: bookData.author || '',
            isbn: bookData.isbn || '',
            year: bookData.year || '',
            description: bookData.description || '',
            cover_image: bookData.cover_image || '',
            pages: bookData.pages || '',
            language: bookData.language || 'Italiano',
            publisher: bookData.publisher || '',
            genre: bookData.genre || '',
            personal_notes: bookData.personal_notes || '',
            rating: bookData.rating || '',
            read_status: bookData.read_status || 'to_read',
            location: bookData.location || 'Libreria',
            purchase_price: bookData.purchase_price || '',
            purchase_date: bookData.purchase_date || '',
            is_favorite: bookData.is_favorite || false
          });
          
          // Imposta l'anteprima dell'immagine
          if (bookData.cover_image) {
            setImagePreview(bookData.cover_image);
            // Determina se è un'immagine base64 o URL
            setImageUploadMode(bookData.cover_image.startsWith('data:') ? 'upload' : 'url');
          }
          
          setError(null);
        }
      } catch (error) {
        console.error('❌ Error fetching book for edit:', error);
        setError(error.message || 'Errore nel caricamento del libro');
        setBook(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id]);

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
    
    if (!formData.author.trim()) {
      errors.push('L\'autore è obbligatorio');
    }
    
    if (formData.rating && (parseInt(formData.rating) < 1 || parseInt(formData.rating) > 5)) {
      errors.push('La valutazione deve essere tra 1 e 5');
    }
    
    if (formData.year && (parseInt(formData.year) < 1000 || parseInt(formData.year) > new Date().getFullYear() + 1)) {
      errors.push('Anno non valido');
    }
    
    if (formData.pages && parseInt(formData.pages) < 0) {
      errors.push('Il numero di pagine non può essere negativo');
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
    
    setSaving(true);

    try {
      // Prepara i dati per l'aggiornamento
      const updateData = {
        ...formData,
        title: formData.title.trim(),
        author: formData.author.trim(),
        isbn: formData.isbn.trim() || null,
        year: formData.year ? parseInt(formData.year) : null,
        pages: formData.pages ? parseInt(formData.pages) : null,
        rating: formData.rating ? parseInt(formData.rating) : null,
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
        description: formData.description.trim() || null,
        cover_image: formData.cover_image.trim() || null,
        publisher: formData.publisher.trim() || null,
        genre: formData.genre.trim() || null,
        personal_notes: formData.personal_notes.trim() || null,
        location: formData.location.trim() || 'Libreria',
        language: formData.language || 'Italiano'
      };

      console.log('📝 Updating book with data:', updateData);
      
      await bookService.updateBook(id, updateData);
      navigate(`/books/${id}`);
    } catch (error) {
      console.error('❌ Update error:', error);
      // L'errore è già gestito nel service con toast
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento libro...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !book) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {error || 'Libro non trovato'}
          </h2>
          <p className="text-gray-600 mb-6">
            Non è possibile modificare questo libro.
          </p>
          <button
            onClick={() => navigate('/books')}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alla libreria
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Header */}
        <div className="flex items-center mb-6 sm:mb-8">
          <button
            onClick={() => navigate(`/books/${id}`)}
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4 p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="hidden sm:inline">Torna al libro</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Modifica Libro</h1>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Autore *
                </label>
                <input
                  type="text"
                  name="author"
                  required
                  value={formData.author}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ISBN
                </label>
                <input
                  type="text"
                  name="isbn"
                  value={formData.isbn}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anno
                </label>
                <input
                  type="number"
                  name="year"
                  min="1000"
                  max={new Date().getFullYear() + 1}
                  value={formData.year}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Editore
                </label>
                <input
                  type="text"
                  name="publisher"
                  value={formData.publisher}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pagine
                </label>
                <input
                  type="number"
                  name="pages"
                  min="0"
                  value={formData.pages}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stato di Lettura
                </label>
                <select
                  name="read_status"
                  value={formData.read_status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                >
                  <option value="to_read">Da Leggere</option>
                  <option value="reading">In Lettura</option>
                  <option value="read">Letto</option>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                  placeholder="Libreria, Camera, ecc."
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
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
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
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
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
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
                placeholder="Aggiungi le tue note personali su questo libro..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_favorite"
                id="is_favorite"
                checked={formData.is_favorite}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="is_favorite" className="ml-2 block text-sm text-gray-900">
                Aggiungi ai preferiti
              </label>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate(`/books/${id}`)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm sm:text-base"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {saving ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? 'Salvataggio...' : 'Salva Modifiche'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditBook;