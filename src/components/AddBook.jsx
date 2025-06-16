import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, Plus } from 'lucide-react';
import bookService from '../services/bookService';

function AddBook() {
  const [searchType, setSearchType] = useState('isbn');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [loading, setLoading] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const navigate = useNavigate();

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
    read_status: 'to_read'
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      let results;
      if (searchType === 'isbn') {
        const result = await bookService.searchByISBN(searchQuery);
        results = [result];
      } else {
        results = await bookService.searchByTitle(searchQuery);
      }
      setSearchResults(results);
    } catch (error) {
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const selectBook = (book) => {
    setSelectedBook(book);
    setFormData({
      ...formData,
      ...book,
      personal_notes: '',
      rating: '',
      read_status: 'to_read'
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await bookService.addBook(formData);
      navigate('/books');
    } catch (error) {
      // Error handled in service
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Aggiungi Nuovo Libro</h1>

        {!manualEntry && !selectedBook && (
          <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Cerca Libro</h2>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="isbn">ISBN</option>
                <option value="title">Titolo</option>
              </select>
              
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchType === 'isbn' ? 'Inserisci ISBN...' : 'Inserisci titolo...'}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  {loading ? 'Cerca...' : 'Cerca'}
                </button>
              </div>
            </div>

            <button
              onClick={() => setManualEntry(true)}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              Oppure inserisci manualmente i dati del libro
            </button>

            {searchResults.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Risultati della ricerca</h3>
                <div className="grid gap-4">
                  {searchResults.map((book, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => selectBook(book)}
                    >
                      <div className="flex gap-4">
                        {book.cover_image ? (
                          <img
                            src={book.cover_image}
                            alt={book.title}
                            className="w-16 h-20 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-20 bg-gray-200 rounded flex items-center justify-center">
                            <BookOpen className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{book.title}</h4>
                          <p className="text-gray-600">{book.author}</p>
                          <p className="text-gray-500 text-sm">{book.year} • {book.publisher}</p>
                          {book.description && (
                            <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                              {book.description.substring(0, 150)}...
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

        {(manualEntry || selectedBook) && (
          <div className="bg-white shadow-lg rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedBook ? 'Conferma Dettagli Libro' : 'Inserimento Manuale'}
              </h2>
              {!selectedBook && (
                <button
                  onClick={() => setManualEntry(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Torna alla ricerca
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titolo *
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Anno di Pubblicazione
                  </label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numero di Pagine
                  </label>
                  <input
                    type="number"
                    name="pages"
                    value={formData.pages}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="to_read">Da Leggere</option>
                    <option value="reading">In Lettura</option>
                    <option value="read">Letto</option>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Nessuna valutazione</option>
                    <option value="1">1 stella</option>
                    <option value="2">2 stelle</option>
                    <option value="3">3 stelle</option>
                    <option value="4">4 stelle</option>
                    <option value="5">5 stelle</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL Immagine di Copertina
                </label>
                <input
                  type="url"
                  name="cover_image"
                  value={formData.cover_image}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/books')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {loading ? 'Aggiunta...' : 'Aggiungi Libro'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default AddBook;