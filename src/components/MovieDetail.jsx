import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Film, Edit, Trash2, ArrowLeft, Star, Calendar, User, Building, Globe, Hash, FileText, Heart, MapPin, Euro, CheckCircle, Clock, Eye, BookMarked } from 'lucide-react';
import movieService from '../services/movieService';

function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const fetchMovie = async () => {
      if (!id) {
        console.error('❌ No movie ID provided');
        setError('ID film mancante');
        setLoading(false);
        return;
      }

      try {
        console.log('🎬 Fetching movie with ID:', id);
        setLoading(true);
        setError(null);
        
        const movieData = await movieService.getMovie(id);
        
        if (!movieData) {
          console.error('❌ Movie not found for ID:', id);
          setError('Film non trovato');
          setMovie(null);
        } else {
          console.log('✅ Movie found:', movieData.title);
          setMovie(movieData);
          setError(null);
        }
      } catch (error) {
        console.error('❌ Error fetching movie:', error);
        setError(error.message || 'Errore nel caricamento del film');
        setMovie(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  const handleDelete = async () => {
    if (!movie) return;
    
    try {
      console.log('🗑️ Deleting movie:', movie.id);
      await movieService.deleteMovie(movie.id);
      navigate('/movies');
    } catch (error) {
      console.error('❌ Error deleting movie:', error);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!movie || updatingStatus) return;
    
    setUpdatingStatus(true);
    try {
      console.log('📝 Updating status to:', newStatus);
      
      const additionalData = {};
      
      // Aggiungi date automatiche
      if (newStatus === 'watching' && movie.watch_status !== 'watching') {
        additionalData.date_started = new Date().toISOString();
      }
      if (newStatus === 'watched' && movie.watch_status !== 'watched') {
        additionalData.date_finished = new Date().toISOString();
      }
      
      const updatedMovie = await movieService.updateWatchStatus(movie.id, newStatus, additionalData);
      setMovie(updatedMovie);
      
    } catch (error) {
      console.error('❌ Error updating status:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!movie || updatingStatus) return;
    
    setUpdatingStatus(true);
    try {
      const updatedMovie = await movieService.toggleFavorite(movie.id);
      setMovie(updatedMovie);
    } catch (error) {
      console.error('❌ Error toggling favorite:', error);
    } finally {
      setUpdatingStatus(false);
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'watched':
        return <CheckCircle className="h-4 w-4" />;
      case 'watching':
        return <Eye className="h-4 w-4" />;
      case 'abandoned':
        return <BookMarked className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const renderStars = (rating) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-5 w-5 ${
              i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating}/5)</span>
      </div>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDuration = (minutes) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento film...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !movie) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Film className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {error || 'Film non trovato'}
          </h2>
          <p className="text-gray-600 mb-6">
            {error === 'ID film mancante' 
              ? 'L\'ID del film non è valido.'
              : 'Il film che stai cercando non esiste o non hai i permessi per visualizzarlo.'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link 
              to="/movies" 
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna alla filmoteca
            </Link>
            {id && (
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Riprova
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
          <button
            onClick={() => navigate('/movies')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span>Torna alla filmoteca</span>
          </button>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleToggleFavorite}
              disabled={updatingStatus}
              className={`flex items-center px-3 py-2 rounded-lg border transition-colors ${
                movie.is_favorite
                  ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              } ${updatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Heart className={`h-4 w-4 mr-2 ${movie.is_favorite ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">
                {movie.is_favorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
              </span>
            </button>
            
            <Link
              to={`/movies/${id}/edit`}
              className="flex items-center px-3 py-2 text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
            >
              <Edit className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Modifica</span>
            </Link>
            
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center px-3 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Elimina</span>
            </button>
          </div>
        </div>

        {/* Movie Details */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="lg:flex">
            {/* Cover Image */}
            <div className="lg:w-1/3 xl:w-1/4">
              <div className="relative">
                {movie.cover_image ? (
                  <img
                    src={movie.cover_image}
                    alt={movie.title}
                    className="w-full h-64 sm:h-80 lg:h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="w-full h-64 sm:h-80 lg:h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"
                  style={{display: movie.cover_image ? 'none' : 'flex'}}
                >
                  <Film className="h-16 w-16 sm:h-24 sm:w-24 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Movie Info */}
            <div className="lg:w-2/3 xl:w-3/4 p-6 sm:p-8">
              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{movie.title}</h1>
                    <p className="text-lg sm:text-xl text-gray-600 mb-4">Diretto da {movie.director}</p>
                  </div>
                  {movie.is_favorite && (
                    <Heart className="h-6 w-6 text-red-500 fill-current flex-shrink-0 ml-4" />
                  )}
                </div>
                
                {/* Status and Rating */}
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <div className={`inline-flex items-center px-3 py-2 rounded-lg border text-sm font-medium ${getStatusColor(movie.watch_status)}`}>
                    {getStatusIcon(movie.watch_status)}
                    <span className="ml-2">{getStatusText(movie.watch_status)}</span>
                  </div>
                  
                  {movie.rating && (
                    <div className="flex items-center">
                      {renderStars(movie.rating)}
                    </div>
                  )}
                </div>

                {/* Quick Status Change */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Cambia stato di visione:</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { status: 'to_watch', label: 'Da vedere', icon: Clock },
                      { status: 'watching', label: 'In visione', icon: Eye },
                      { status: 'watched', label: 'Visto', icon: CheckCircle },
                      { status: 'abandoned', label: 'Abbandonato', icon: BookMarked }
                    ].map(({ status, label, icon: Icon }) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        disabled={updatingStatus || movie.watch_status === status}
                        className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          movie.watch_status === status
                            ? 'bg-purple-100 text-purple-800 border border-purple-200 cursor-default'
                            : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                        } ${updatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Movie Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {movie.year && (
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-5 w-5 mr-3 flex-shrink-0" />
                    <span>Uscito nel {movie.year}</span>
                  </div>
                )}
                
                {movie.studio && (
                  <div className="flex items-center text-gray-600">
                    <Building className="h-5 w-5 mr-3 flex-shrink-0" />
                    <span>{movie.studio}</span>
                  </div>
                )}
                
                {movie.language && (
                  <div className="flex items-center text-gray-600">
                    <Globe className="h-5 w-5 mr-3 flex-shrink-0" />
                    <span>{movie.language}</span>
                  </div>
                )}
                
                {movie.duration_minutes && (
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-5 w-5 mr-3 flex-shrink-0" />
                    <span>{formatDuration(movie.duration_minutes)}</span>
                  </div>
                )}
                
                {movie.format && (
                  <div className="flex items-center text-gray-600">
                    <span className="font-medium mr-3">Formato:</span>
                    <span>{movie.format}</span>
                  </div>
                )}
                
                {movie.genre && (
                  <div className="flex items-center text-gray-600">
                    <span className="font-medium mr-3">Genere:</span>
                    <span>{movie.genre}</span>
                  </div>
                )}

                {movie.location && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-5 w-5 mr-3 flex-shrink-0" />
                    <span>{movie.location}</span>
                  </div>
                )}

                {movie.purchase_price && (
                  <div className="flex items-center text-gray-600">
                    <Euro className="h-5 w-5 mr-3 flex-shrink-0" />
                    <span>€ {movie.purchase_price}</span>
                  </div>
                )}
              </div>

              {/* Watch Dates */}
              {(movie.date_started || movie.date_finished) && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Date di visione</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {movie.date_started && (
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-5 w-5 mr-3 flex-shrink-0" />
                        <div>
                          <div className="font-medium">Iniziato</div>
                          <div className="text-sm">{formatDate(movie.date_started)}</div>
                        </div>
                      </div>
                    )}
                    {movie.date_finished && (
                      <div className="flex items-center text-gray-600">
                        <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                        <div>
                          <div className="font-medium">Completato</div>
                          <div className="text-sm">{formatDate(movie.date_finished)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              {movie.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Trama</h3>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed">{movie.description}</p>
                  </div>
                </div>
              )}

              {/* Personal Notes */}
              {movie.personal_notes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Note Personali</h3>
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                    <p className="text-gray-700 leading-relaxed italic">{movie.personal_notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 text-center mb-2">Elimina Film</h3>
                <p className="text-sm text-gray-500 text-center mb-6">
                  Sei sicuro di voler eliminare "<strong>{movie.title}</strong>"? Questa azione non può essere annullata.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Elimina
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MovieDetail;