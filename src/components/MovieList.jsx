import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Film, Search, Filter, Star, Eye, Clock, CheckCircle, Grid, List, Heart, BookMarked } from 'lucide-react';
import movieService from '../services/movieService';

function MovieList() {
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [viewMode, setViewMode] = useState('grid');
  const [updatingMovie, setUpdatingMovie] = useState(null);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const moviesData = await movieService.getAllMovies();
        setMovies(moviesData);
        setFilteredMovies(moviesData);
      } catch (error) {
        console.error('Error fetching movies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  useEffect(() => {
    let filtered = movies;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(movie =>
        movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movie.director.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movie.genre?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(movie => movie.watch_status === statusFilter);
    }

    // Sort movies - CORRETTO per gestire l'ordinamento alfabetico
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          // Ordinamento alfabetico per titolo (sempre crescente)
          return a.title.localeCompare(b.title, 'it', { 
            sensitivity: 'base',
            numeric: true,
            ignorePunctuation: true 
          });
        case 'director':
          // Ordinamento alfabetico per regista (sempre crescente)
          return a.director.localeCompare(b.director, 'it', { 
            sensitivity: 'base',
            numeric: true,
            ignorePunctuation: true 
          });
        case 'year':
          return (b.year || 0) - (a.year || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

    setFilteredMovies(filtered);
  }, [movies, searchTerm, statusFilter, sortBy]);

  const handleQuickStatusChange = async (movieId, newStatus, event) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (updatingMovie === movieId) return;
    
    setUpdatingMovie(movieId);
    try {
      const additionalData = {};
      
      // Aggiungi date automatiche
      const movie = movies.find(m => m.id === movieId);
      if (newStatus === 'watching' && movie.watch_status !== 'watching') {
        additionalData.date_started = new Date().toISOString();
      }
      if (newStatus === 'watched' && movie.watch_status !== 'watched') {
        additionalData.date_finished = new Date().toISOString();
      }
      
      const updatedMovie = await movieService.updateWatchStatus(movieId, newStatus, additionalData);
      
      // Aggiorna lo stato locale
      setMovies(prevMovies => 
        prevMovies.map(movie => 
          movie.id === movieId ? updatedMovie : movie
        )
      );
      
    } catch (error) {
      console.error('❌ Error updating status:', error);
    } finally {
      setUpdatingMovie(null);
    }
  };

  const handleToggleFavorite = async (movieId, event) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (updatingMovie === movieId) return;
    
    setUpdatingMovie(movieId);
    try {
      const updatedMovie = await movieService.toggleFavorite(movieId);
      
      // Aggiorna lo stato locale
      setMovies(prevMovies => 
        prevMovies.map(movie => 
          movie.id === movieId ? updatedMovie : movie
        )
      );
      
    } catch (error) {
      console.error('❌ Error toggling favorite:', error);
    } finally {
      setUpdatingMovie(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'watched':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'watching':
        return <Eye className="h-4 w-4 text-yellow-500" />;
      case 'abandoned':
        return <BookMarked className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'watched':
        return 'Visto';
      case 'watching':
        return 'In visione';
      case 'abandoned':
        return 'Abbandonato';
      default:
        return 'Da vedere';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'watched':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'watching':
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

  const StatusDropdown = ({ movie, onStatusChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const statuses = [
      { value: 'to_watch', label: 'Da vedere', icon: Clock },
      { value: 'watching', label: 'In visione', icon: Eye },
      { value: 'watched', label: 'Visto', icon: CheckCircle },
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
          disabled={updatingMovie === movie.id}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-colors ${getStatusColor(movie.watch_status)} ${
            updatingMovie === movie.id ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
          }`}
        >
          {getStatusIcon(movie.watch_status)}
          <span className="hidden sm:inline">{getStatusText(movie.watch_status)}</span>
        </button>
        
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
            {statuses.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={(e) => {
                  onStatusChange(movie.id, value, e);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                  movie.watch_status === value ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">La Mia Filmoteca</h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600">
              {filteredMovies.length} film nella tua collezione
            </p>
          </div>
          <Link
            to="/add-movie"
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200 text-center text-sm sm:text-base"
          >
            Aggiungi Film
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
                placeholder="Cerca film..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
              />
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
              >
                <option value="all">Tutti gli stati</option>
                <option value="to_watch">Da vedere</option>
                <option value="watching">In visione</option>
                <option value="watched">Visti</option>
                <option value="abandoned">Abbandonati</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
              >
                <option value="created_at">Data aggiunta</option>
                <option value="title">Titolo (A-Z)</option>
                <option value="director">Regista (A-Z)</option>
                <option value="year">Anno</option>
                <option value="rating">Valutazione</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Grid className="h-4 w-4 mx-auto" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <List className="h-4 w-4 mx-auto" />
                </button>
              </div>

              {/* Results Count */}
              <div className="flex items-center text-sm text-gray-500 px-3 py-2">
                <Filter className="h-4 w-4 mr-2" />
                {filteredMovies.length} risultati
              </div>
            </div>
          </div>
        </div>

        {/* Movies Display */}
        {filteredMovies.length === 0 ? (
          <div className="text-center py-12">
            <Film className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nessun film trovato</h3>
            <p className="mt-1 text-sm text-gray-500">
              {movies.length === 0 
                ? 'Inizia aggiungendo il tuo primo film alla collezione.'
                : 'Prova a modificare i filtri di ricerca.'
              }
            </p>
            {movies.length === 0 && (
              <div className="mt-6">
                <Link
                  to="/add-movie"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  Aggiungi il primo film
                </Link>
              </div>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
            {filteredMovies.map((movie) => (
              <Link
                key={movie.id}
                to={`/movies/${movie.id}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-200 transform hover:scale-105 relative group"
              >
                {/* Favorite Heart */}
                {movie.is_favorite && (
                  <div className="absolute top-2 right-2 z-10">
                    <Heart className="h-5 w-5 text-red-500 fill-current" />
                  </div>
                )}

                <div className="aspect-w-3 aspect-h-4">
                  {movie.cover_image ? (
                    <img
                      src={movie.cover_image}
                      alt={movie.title}
                      className="w-full h-32 sm:h-40 lg:h-48 object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="w-full h-32 sm:h-40 lg:h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"
                    style={{display: movie.cover_image ? 'none' : 'flex'}}
                  >
                    <Film className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-gray-400" />
                  </div>
                </div>
                
                <div className="p-2 sm:p-3 lg:p-4">
                  <h3 className="font-semibold text-gray-900 text-xs sm:text-sm line-clamp-2 mb-1">
                    {movie.title}
                  </h3>
                  <p className="text-gray-600 text-xs mb-1 sm:mb-2 truncate">{movie.director}</p>
                  
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <span className="text-gray-500 text-xs">{movie.year}</span>
                    {renderStars(movie.rating)}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <StatusDropdown movie={movie} onStatusChange={handleQuickStatusChange} />
                    
                    {movie.duration_minutes && (
                      <span className="text-xs text-gray-500">{movie.duration_minutes} min</span>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleToggleFavorite(movie.id, e)}
                      disabled={updatingMovie === movie.id}
                      className={`flex-1 px-2 py-1 rounded text-xs transition-colors ${
                        movie.is_favorite
                          ? 'bg-red-100 text-red-600 hover:bg-red-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      } ${updatingMovie === movie.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Heart className={`h-3 w-3 mx-auto ${movie.is_favorite ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="divide-y divide-gray-200">
              {filteredMovies.map((movie) => (
                <Link
                  key={movie.id}
                  to={`/movies/${movie.id}`}
                  className="block p-4 sm:p-6 hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {movie.cover_image ? (
                        <img
                          src={movie.cover_image}
                          alt={movie.title}
                          className="w-12 h-16 sm:w-16 sm:h-20 object-cover rounded"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-12 h-16 sm:w-16 sm:h-20 bg-gray-200 rounded flex items-center justify-center"
                        style={{display: movie.cover_image ? 'none' : 'flex'}}
                      >
                        <Film className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-1 flex items-center gap-2">
                            {movie.title}
                            {movie.is_favorite && (
                              <Heart className="h-4 w-4 text-red-500 fill-current flex-shrink-0" />
                            )}
                          </h3>
                          <p className="text-gray-600 text-xs sm:text-sm mt-1">{movie.director}</p>
                          
                          <div className="flex items-center gap-4 mt-2 text-xs sm:text-sm text-gray-500">
                            <span>{movie.year}</span>
                            {movie.duration_minutes && <span>{movie.duration_minutes} min</span>}
                            {movie.format && <span>{movie.format}</span>}
                          </div>
                          
                          {movie.rating && (
                            <div className="mt-2">
                              {renderStars(movie.rating)}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end gap-2 ml-4">
                          <StatusDropdown movie={movie} onStatusChange={handleQuickStatusChange} />
                          
                          <button
                            onClick={(e) => handleToggleFavorite(movie.id, e)}
                            disabled={updatingMovie === movie.id}
                            className={`p-1 rounded transition-colors ${
                              movie.is_favorite
                                ? 'text-red-500 hover:bg-red-50'
                                : 'text-gray-400 hover:bg-gray-100'
                            } ${updatingMovie === movie.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <Heart className={`h-4 w-4 ${movie.is_favorite ? 'fill-current' : ''}`} />
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

export default MovieList;