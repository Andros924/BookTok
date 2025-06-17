import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Plus, Search, TrendingUp, Star, Users, Clock, Eye, CheckCircle } from 'lucide-react'
import bookService from '../services/bookService'
import loanService from '../services/loanService'

function Dashboard() {
  const [stats, setStats] = useState({
    totalBooks: 0,
    readBooks: 0,
    currentlyReading: 0,
    toRead: 0
  })
  const [loanStats, setLoanStats] = useState({
    total: 0,
    active: 0,
    returned: 0,
    overdue: 0
  })
  const [recentBooks, setRecentBooks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch books data
        const books = await bookService.getAllBooks()
        
        // Calculate book stats
        const totalBooks = books.length
        const readBooks = books.filter(book => book.read_status === 'read').length
        const currentlyReading = books.filter(book => book.read_status === 'reading').length
        const toRead = books.filter(book => book.read_status === 'to_read').length
        
        setStats({ totalBooks, readBooks, currentlyReading, toRead })
        setRecentBooks(books.slice(0, 6)) // Show last 6 books

        // Fetch loan stats
        const loanStatsData = await loanService.getLoanStats()
        setLoanStats(loanStatsData)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">La Tua Libreria</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">Gestisci e organizza la tua collezione di libri</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className="bg-white overflow-hidden shadow-lg rounded-lg border-l-4 border-blue-500">
            <div className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Totale</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalBooks}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-lg rounded-lg border-l-4 border-green-500">
            <div className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Letti</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.readBooks}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-lg rounded-lg border-l-4 border-yellow-500">
            <div className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">In Lettura</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.currentlyReading}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-lg rounded-lg border-l-4 border-purple-500">
            <div className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Da Leggere</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.toRead}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loan Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className="bg-white overflow-hidden shadow-lg rounded-lg border-l-4 border-orange-500">
            <div className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Prestiti Totali</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{loanStats.total}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-lg rounded-lg border-l-4 border-red-500">
            <div className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Prestiti Attivi</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{loanStats.active}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-lg rounded-lg border-l-4 border-teal-500">
            <div className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Star className="h-6 w-6 sm:h-8 sm:w-8 text-teal-500" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Restituiti</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{loanStats.returned}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Link
            to="/add-book"
            className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-4 sm:p-6 text-white hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <div className="flex items-center">
              <Plus className="h-6 w-6 sm:h-8 sm:w-8 mr-3 sm:mr-4" />
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-semibold truncate">Aggiungi Libro</h3>
                <p className="text-xs sm:text-sm text-indigo-100 truncate">Espandi la collezione</p>
              </div>
            </div>
          </Link>

          <Link
            to="/books"
            className="bg-gradient-to-r from-green-500 to-teal-600 rounded-lg p-4 sm:p-6 text-white hover:from-green-600 hover:to-teal-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <div className="flex items-center">
              <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 mr-3 sm:mr-4" />
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-semibold truncate">Visualizza Libreria</h3>
                <p className="text-xs sm:text-sm text-green-100 truncate">Esplora i tuoi libri</p>
              </div>
            </div>
          </Link>

          <Link
            to="/loans"
            className="bg-gradient-to-r from-orange-500 to-red-600 rounded-lg p-4 sm:p-6 text-white hover:from-orange-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105 shadow-lg sm:col-span-2 lg:col-span-1"
          >
            <div className="flex items-center">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 mr-3 sm:mr-4" />
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-semibold truncate">Gestisci Prestiti</h3>
                <p className="text-xs sm:text-sm text-orange-100 truncate">Traccia i tuoi prestiti</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Books */}
        {recentBooks.length > 0 && (
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Libri Recenti</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {recentBooks.map((book) => (
                <Link
                  key={book.id}
                  to={`/books/${book.id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  <div className="flex">
                    {book.cover_image ? (
                      <img
                        src={book.cover_image}
                        alt={book.title}
                        className="w-16 sm:w-20 h-20 sm:h-28 object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 sm:w-20 h-20 sm:h-28 bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                      </div>
                    )}
                    <div className="p-3 sm:p-4 flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2 mb-1">
                        {book.title}
                      </h3>
                      <p className="text-gray-600 text-xs sm:text-sm mb-1 truncate">{book.author}</p>
                      <p className="text-gray-500 text-xs mb-2">{book.year}</p>
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
  )
}

export default Dashboard