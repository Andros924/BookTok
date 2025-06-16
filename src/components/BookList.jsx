import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, Filter, Star, Eye, Clock, CheckCircle } from 'lucide-react';
import bookService from '../services/bookService';

function BookList() {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');

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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'read':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'reading':
        return <Eye className="h-4 w-4 text-yellow-500" />;
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
      default:
        return 'Da leggere';
    }
  };

  const renderStars = (rating) => {
    if (!rating) return null;
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="text-center">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">La Mia Libreria</h1>
            <p className="mt-2 text-gray-600">{filteredBooks.length} libri nella tua collezione</p>
          </div>
          <Link
            to="/add-book"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200"
          >
            Aggiungi Libro
          </Link>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca libri..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Tutti gli stati</option>
              <option value="to_read">Da leggere</option>
              <option value="reading">In lettura</option>
              <option value="read">Letti</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="created_at">Data aggiunta</option>
              <option value="title">Titolo</option>
              <option value="author">Autore</option>
              <option value="year">Anno</option>
              <option value="rating">Valutazione</option>
            </select>

            <div className="flex items-center text-sm text-gray-500">
              <Filter className="h-4 w-4 mr-2" />
              {filteredBooks.length} risultati
            </div>
          </div>
        </div>

        {/* Books Grid */}
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <Link
                key={book.id}
                to={`/books/${book.id}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                <div className="aspect-w-3 aspect-h-4">
                  {book.cover_image ? (
                    <img
                      src={book.cover_image}
                      alt={book.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2">
                    {book.title}
                  </h3>
                  <p className="text-gray-600 text-xs mb-2">{book.author}</p>
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-500 text-xs">{book.year}</span>
                    {renderStars(book.rating)}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {getStatusIcon(book.read_status)}
                      <span className="text-xs text-gray-600">
                        {getStatusText(book.read_status)}
                      </span>
                    </div>
                    
                    {book.pages && (
                      <span className="text-xs text-gray-500">{book.pages} pp.</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BookList;