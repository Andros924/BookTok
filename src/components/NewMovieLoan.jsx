import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Film, User, Calendar, FileText, ArrowLeft } from 'lucide-react'
import movieLoanService from '../services/movieLoanService'

function NewMovieLoan() {
  const navigate = useNavigate()
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    movie_id: '',
    borrower_name: '',
    borrower_email: '',
    expected_return_date: '',
    notes: ''
  })

  useEffect(() => {
    fetchMovies()
  }, [])

  const fetchMovies = async () => {
    try {
      const moviesData = await movieLoanService.getAvailableMovies()
      setMovies(moviesData)
    } catch (error) {
      console.error('Error fetching movies:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await movieLoanService.createLoan(formData)
      navigate('/movie-loans')
    } catch (error) {
      console.error('Error creating loan:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedMovie = movies.find(movie => movie.id === formData.movie_id)

  return (
    <div className="max-w-2xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/movie-loans')}
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Torna ai prestiti
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Nuovo Prestito Film</h1>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selezione film */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleziona Film *
              </label>
              <select
                name="movie_id"
                required
                value={formData.movie_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Scegli un film...</option>
                {movies.map((movie) => (
                  <option key={movie.id} value={movie.id}>
                    {movie.title} - {movie.director} ({movie.year})
                  </option>
                ))}
              </select>
            </div>

            {/* Anteprima film selezionato */}
            {selectedMovie && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Film selezionato:</h3>
                <div className="flex items-center space-x-4">
                  {selectedMovie.cover_image ? (
                    <img
                      src={selectedMovie.cover_image}
                      alt={selectedMovie.title}
                      className="w-12 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center">
                      <Film className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{selectedMovie.title}</p>
                    <p className="text-gray-600">Diretto da {selectedMovie.director}</p>
                    <p className="text-sm text-gray-500">{selectedMovie.year} • {selectedMovie.format}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Informazioni persona */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome della persona *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="borrower_name"
                    required
                    value={formData.borrower_name}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Nome e cognome"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (opzionale)
                </label>
                <input
                  type="email"
                  name="borrower_email"
                  value={formData.borrower_email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  placeholder="email@esempio.com"
                />
              </div>
            </div>

            {/* Data di restituzione prevista */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data di restituzione prevista (opzionale)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  name="expected_return_date"
                  value={formData.expected_return_date}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note aggiuntive (opzionale)
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <FileText className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Aggiungi eventuali note sul prestito..."
                />
              </div>
            </div>

            {/* Pulsanti */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate('/movie-loans')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={loading || !formData.movie_id || !formData.borrower_name}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Registrazione...' : 'Registra Prestito'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default NewMovieLoan