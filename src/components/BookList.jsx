import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, Filter, Star, Eye, Clock, CheckCircle, Grid, List, Heart, BookMarked } from 'lucide-react';
import bookService from '../services/bookService';

function BookList() {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [viewMode, setViewMode] = useState('grid');
  const [updatingBook, setUpdatingBook] = useState(null);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const booksData = await bookService.getAllBooks();
        setBooks(booksData);
        setFilteredBooks(booksData);
      } catch (error) {
        console.error('Error fetching books:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  useEffect(() => {
    let filtered = books;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(book =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.genre?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(book => book.read_status === statusFilter);
    }

    // Sort books
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'author':
          return a.author.localeCompare(b.author);
        case 'year':
          return (b.year || 0) - (a.year || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

    setFilteredBooks(filtered);
  }, [books, searchTerm, statusFilter, sortBy]);

  const handleQuickStatusChange = async (bookId, newStatus, event) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (updatingBook === bookId) return;
    
    setUpdatingBook(bookId);
    try {
      const additionalData = {};
      
      // Aggiungi date automatiche
      const book = books.find(b => b.id === bookId);
      if (newStatus === 'reading' && book.read_status !== 'reading') {
        additionalData.date_started = new Date().toISOString();
      }
      if (newStatus === 'read' && book.read_status !== 'read') {
        additionalData.date_finished = new Date().toISOString();
      }
      
      const updatedBook = await bookService.updateReadingStatus(bookId, newStatus, additionalData);
      
      // Aggiorna lo stato locale
      setBooks(prevBooks => 
        prevBooks.map(book => 
          book.id === bookId ? updatedBook : book
        )
      );
      
    } catch (error) {
      console.error('❌ Error updating status:', error);
    } finally {
      setUpdatingBook(null);
    }
  };

  const handleToggleFavorite = async (bookId, event) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (updatingBook === bookId) return;
    
    setUpdatingBook(bookId);
    try {
      const updatedBook = await bookService.toggleFavorite(bookId);
      
      // Aggiorna lo stato locale
      setBooks(prevBooks => 
        prevBooks.map(book => 
          book.id === bookId ? updatedBook : book
        )
      );
      
    } catch (error) {
      console.error('❌ Error toggling favorite:', error);
    } finally {
      setUpdatingBook(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'read':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'reading':
        return <Eye className="h-4 w-4 text-yellow-500" />;
      case 'abandoned':
        return <BookMarked className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'read':
        return 'Letto';
      case 'reading':
        return 'In lettura';
      case 'abandoned':
        return 'Abbandonato';
      default:
        return 'Da leggere';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'read':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'reading':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'abandoned':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderStars = (rating) => {
    if (!rating) return null;
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 sm:h-4 sm:w-4 ${
              i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const StatusDropdown = ({ book, onStatusChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const statuses = [
      { value: 'to_read', label: 'Da leggere', icon: Clock },
      { value: 'reading', label: 'In lettura', icon: Eye },
      { value: 'read', label: 'Letto', icon: CheckCircle },
      { value: 'abandoned', label: 'Abbandonato', icon: BookMarked }
    ];

    return (
      <div className="relative">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          disabled={updatingBook === book.id}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-colors ${getStatusColor(book.read_status)} ${
            updatingBook === book.id ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
          }`}
        >
          {getStatusIcon(book.read_status)}
          <span className="hidden sm:inline">{getStatusText(book.read_status)}</span>
        </button>
        
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
            {statuses.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={(e) => {
                  onStatusChange(book.id, value, e);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                  book.read_status === value ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">La Mia Libreria</h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600">
              {filteredBooks.length} libri nella tua collezione
            </p>
          </div>
          <Link
            to="/add-book"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200 text-center text-sm sm:text-base"
          >
            Aggiungi Libro
          </Link>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca libri..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
              />
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
              >
                <option value="all">Tutti gli stati</option>
                <option value="to_read">Da leggere</option>
                <option value="reading">In lettura</option>
                <option value="read">Letti</option>
                <option value="abandoned">Abbandonati</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
              >
                <option value="created_at">Data aggiunta</option>
                <option value="title">Titolo</option>
                <option value="author">Autore</option>
                <option value="year">Anno</option>
                <option value="rating">Valutazione</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Grid className="h-4 w-4 mx-auto" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <List className="h-4 w-4 mx-auto" />
                </button>
              </div>

              {/* Results Count */}
              <div className="flex items-center text-sm text-gray-500 px-3 py-2">
                <Filter className="h-4 w-4 mr-2" />
                {filteredBooks.length} risultati
              </div>
            </div>
          </div>
        </div>

        {/* Books Display */}
        {filteredBooks.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nessun libro trovato</h3>
            <p className="mt-1 text-sm text-gray-500">
              {books.length === 0 
                ? 'Inizia aggiungendo il tuo primo libro alla collezione.'
                : 'Prova a modificare i filtri di ricerca.'
              }
            </p>
            {books.length === 0 && (
              <div className="mt-6">
                <Link
                  to="/add-book"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Aggiungi il primo libro
                </Link>
              </div>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
            {filteredBooks.map((book) => (
              <Link
                key={book.id}
                to={`/books/${book.id}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-200 transform hover:scale-105 relative group"
              >
                {/* Favorite Heart */}
                {book.is_favorite && (
                  <div className="absolute top-2 right-2 z-10">
                    <Heart className="h-5 w-5 text-red-500 fill-current" />
                  </div>
                )}

                <div className="aspect-w-3 aspect-h-4">
                  {book.cover_image ? (
                    <img
                      src={book.cover_image}
                      alt={book.title}
                      className="w-full h-32 sm:h-40 lg:h-48 object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="w-full h-32 sm:h-40 lg:h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"
                    style={{display: book.cover_image ? 'none' : 'flex'}}
                  >
                    <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-gray-400" />
                  </div>
                </div>
                
                <div className="p-2 sm:p-3 lg:p-4">
                  <h3 className="font-semibold text-gray-900 text-xs sm:text-sm line-clamp-2 mb-1">
                    {book.title}
                  </h3>
                  <p className="text-gray-600 text-xs mb-1 sm:mb-2 truncate">{book.author}</p>
                  
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <span className="text-gray-500 text-xs">{book.year}</span>
                    {renderStars(book.rating)}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <StatusDropdown book={book} onStatusChange={handleQuickStatusChange} />
                    
                    {book.pages && (
                      <span className="text-xs text-gray-500">{book.pages} pp.</span>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleToggleFavorite(book.id, e)}
                      disabled={updatingBook === book.id}
                      className={`flex-1 px-2 py-1 rounded text-xs transition-colors ${
                        book.is_favorite
                          ? 'bg-red-100 text-red-600 hover:bg-red-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      } ${updatingBook === book.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Heart className={`h-3 w-3 mx-auto ${book.is_favorite ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="divide-y divide-gray-200">
              {filteredBooks.map((book) => (
                <Link
                  key={book.id}
                  to={`/books/${book.id}`}
                  className="block p-4 sm:p-6 hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {book.cover_image ? (
                        <img
                          src={book.cover_image}
                          alt={book.title}
                          className="w-12 h-16 sm:w-16 sm:h-20 object-cover rounded"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-12 h-16 sm:w-16 sm:h-20 bg-gray-200 rounded flex items-center justify-center"
                        style={{display: book.cover_image ? 'none' : 'flex'}}
                      >
                        <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-1 flex items-center gap-2">
                            {book.title}
                            {book.is_favorite && (
                              <Heart className="h-4 w-4 text-red-500 fill-current flex-shrink-0" />
                            )}
                          </h3>
                          <p className="text-gray-600 text-xs sm:text-sm mt-1">{book.author}</p>
                          
                          <div className="flex items-center gap-4 mt-2 text-xs sm:text-sm text-gray-500">
                            <span>{book.year}</span>
                            {book.pages && <span>{book.pages} pp.</span>}
                          </div>
                          
                          {book.rating && (
                            <div className="mt-2">
                              {renderStars(book.rating)}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end gap-2 ml-4">
                          <StatusDropdown book={book} onStatusChange={handleQuickStatusChange} />
                          
                          <button
                            onClick={(e) => handleToggleFavorite(book.id, e)}
                            disabled={updatingBook === book.id}
                            className={`p-1 rounded transition-colors ${
                              book.is_favorite
                                ? 'text-red-500 hover:bg-red-50'
                                : 'text-gray-400 hover:bg-gray-100'
                            } ${updatingBook === book.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <Heart className={`h-4 w-4 ${book.is_favorite ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BookList;