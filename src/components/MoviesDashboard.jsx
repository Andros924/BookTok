import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Film, Plus, TrendingUp, Star, Users, Clock, Eye, CheckCircle, ArrowLeft } from 'lucide-react'
import movieService from '../services/movieService'

function MoviesDashboard() {
  const [stats, setStats] = useState({
    totalMovies: 0,
    watchedMovies: 0,
    currentlyWatching: 0,
    toWatch: 0
  })
  const [recentMovies, setRecentMovies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch movies data
        const movies = await movieService.getAllMovies()
        
        // Calculate movie stats
        const totalMovies = movies.length
        const watchedMovies = movies.filter(movie => movie.watch_status === 'watched').length
        const currentlyWatching = movies.filter(movie => movie.watch_status === 'watching').length
        const toWatch = movies.filter(movie => movie.watch_status === 'to_watch').length
        
        setStats({ totalMovies, watchedMovies, currentlyWatching, toWatch })
        setRecentMovies(movies.slice(0, 6)) // Show last 6 movies
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Header */}
        <div className="flex items-center mb-6 sm:mb-8">
          <Link
            to="/dashboard"
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4 p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="hidden sm:inline">Torna alle collezioni</span>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">La Tua Filmoteca</h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600">Gestisci e organizza la tua collezione di film</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className="bg-white overflow-hidden shadow-lg rounded-lg border-l-4 border-purple-500">
            <div className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Film className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Totale</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalMovies}</p>
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
                  <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Visti</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.watchedMovies}</p>
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
                  <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">In Visione</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.currentlyWatching}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-lg rounded-lg border-l-4 border-indigo-500">
            <div className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-500" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Da Vedere</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.toWatch}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Link
            to="/add-movie"
            className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg p-4 sm:p-6 text-white hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <div className="flex items-center">
              <Plus className="h-6 w-6 sm:h-8 sm:w-8 mr-3 sm:mr-4" />
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-semibold truncate">Aggiungi Film</h3>
                <p className="text-xs sm:text-sm text-purple-100 truncate">Espandi la collezione</p>
              </div>
            </div>
          </Link>

          <Link
            to="/movies"
            className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-4 sm:p-6 text-white hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <div className="flex items-center">
              <Film className="h-6 w-6 sm:h-8 sm:w-8 mr-3 sm:mr-4" />
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-semibold truncate">Visualizza Filmoteca</h3>
                <p className="text-xs sm:text-sm text-indigo-100 truncate">Esplora i tuoi film</p>
              </div>
            </div>
          </Link>

          <Link
            to="/movie-loans"
            className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-lg p-4 sm:p-6 text-white hover:from-teal-600 hover:to-cyan-700 transition-all duration-200 transform hover:scale-105 shadow-lg sm:col-span-2 lg:col-span-1"
          >
            <div className="flex items-center">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 mr-3 sm:mr-4" />
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-semibold truncate">Gestisci Prestiti</h3>
                <p className="text-xs sm:text-sm text-teal-100 truncate">Traccia i tuoi prestiti</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Movies */}
        {recentMovies.length > 0 && (
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Film Recenti</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {recentMovies.map((movie) => (
                <Link
                  key={movie.id}
                  to={`/movies/${movie.id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  <div className="flex">
                    {movie.cover_image ? (
                      <img
                        src={movie.cover_image}
                        alt={movie.title}
                        className="w-16 sm:w-20 h-20 sm:h-28 object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 sm:w-20 h-20 sm:h-28 bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <Film className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                      </div>
                    )}
                    <div className="p-3 sm:p-4 flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2 mb-1">
                        {movie.title}
                      </h3>
                      <p className="text-gray-600 text-xs sm:text-sm mb-1 truncate">{movie.director}</p>
                      <p className="text-gray-500 text-xs mb-2">{movie.year}</p>
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          movie.watch_status === 'watched' ? 'bg-green-100 text-green-800' :
                          movie.watch_status === 'watching' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {movie.watch_status === 'watched' ? 'Visto' :
                           movie.watch_status === 'watching' ? 'In visione' : 'Da vedere'}
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

export default MoviesDashboard