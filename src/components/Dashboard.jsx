import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Plus, Search, TrendingUp, Star } from 'lucide-react';
import bookService from '../services/bookService';

function Dashboard() {
  const [stats, setStats] = useState({
    totalBooks: 0,
    readBooks: 0,
    currentlyReading: 0,
    toRead: 0
  });
  const [recentBooks, setRecentBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const books = await bookService.getAllBooks();
        
        // Calculate stats
        const totalBooks = books.length;
        const readBooks = books.filter(book => book.read_status === 'read').length;
        const currentlyReading = books.filter(book => book.read_status === 'reading').length;
        const toRead = books.filter(book => book.read_status === 'to_read').length;
        
        setStats({ totalBooks, readBooks, currentlyReading, toRead });
        setRecentBooks(books.slice(0, 6)); // Show last 6 books
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">La Tua Libreria</h1>
          <p className="mt-2 text-gray-600">Gestisci e organizza la tua collezione di libri</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow-lg rounded-lg border-l-4 border-blue-500">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BookOpen className="h-8 w-8 text-blue-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Totale Libri</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalBooks}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-lg rounded-lg border-l-4 border-green-500">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Star className="h-8 w-8 text-green-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Libri Letti</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.readBooks}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-lg rounded-lg border-l-4 border-yellow-500">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-yellow-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">In Lettura</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.currentlyReading}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-lg rounded-lg border-l-4 border-purple-500">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Search className="h-8 w-8 text-purple-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Da Leggere</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.toRead}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link
            to="/add-book"
            className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
          >
            <div className="flex items-center">
              <Plus className="h-8 w-8 mr-4" />
              <div>
                <h3 className="text-lg font-semibold">Aggiungi Nuovo Libro</h3>
                <p className="text-indigo-100">Espandi la tua collezione</p>
              </div>
            </div>
          </Link>

          <Link
            to="/books"
            className="bg-gradient-to-r from-green-500 to-teal-600 rounded-lg p-6 text-white hover:from-green-600 hover:to-teal-700 transition-all duration-200 transform hover:scale-105"
          >
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 mr-4" />
              <div>
                <h3 className="text-lg font-semibold">Visualizza Libreria</h3>
                <p className="text-green-100">Esplora i tuoi libri</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Books */}
        {recentBooks.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Libri Recenti</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentBooks.map((book) => (
                <Link
                  key={book.id}
                  to={`/books/${book.id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="flex">
                    {book.cover_image ? (
                      <img
                        src={book.cover_image}
                        alt={book.title}
                        className="w-20 h-28 object-cover"
                      />
                    ) : (
                      <div className="w-20 h-28 bg-gray-200 flex items-center justify-center">
                        <BookOpen className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div className="p-4 flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="text-gray-600 text-xs mt-1">{book.author}</p>
                      <p className="text-gray-500 text-xs mt-1">{book.year}</p>
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          book.read_status === 'read' ? 'bg-green-100 text-green-800' :
                          book.read_status === 'reading' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {book.read_status === 'read' ? 'Letto' :
                           book.read_status === 'reading' ? 'In lettura' : 'Da leggere'}
                        </span>
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
  );
}

export default Dashboard;