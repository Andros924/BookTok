import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Calendar, User, CheckCircle, Clock, AlertTriangle, Plus } from 'lucide-react'
import loanService from '../services/loanService'

function LoanList() {
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchLoans()
  }, [])

  const fetchLoans = async () => {
    try {
      const loansData = await loanService.getAllLoans()
      setLoans(loansData)
    } catch (error) {
      console.error('Error fetching loans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReturnBook = async (loanId) => {
    try {
      await loanService.returnLoan(loanId)
      fetchLoans() // Ricarica la lista
    } catch (error) {
      console.error('Error returning book:', error)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'returned':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'overdue':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'returned':
        return 'Restituito'
      case 'overdue':
        return 'In ritardo'
      default:
        return 'Attivo'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'returned':
        return 'bg-green-100 text-green-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const filteredLoans = loans.filter(loan => {
    if (filter === 'all') return true
    return loan.status === filter
  })

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT')
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="text-center">Caricamento...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestione Prestiti</h1>
            <p className="mt-2 text-gray-600">
              {filteredLoans.length} prestiti {filter === 'all' ? 'totali' : getStatusText(filter).toLowerCase()}
            </p>
          </div>
          <Link
            to="/loans/new"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nuovo Prestito
          </Link>
        </div>

        {/* Filtri */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tutti ({loans.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'active'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Attivi ({loans.filter(l => l.status === 'active').length})
            </button>
            <button
              onClick={() => setFilter('returned')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'returned'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Restituiti ({loans.filter(l => l.status === 'returned').length})
            </button>
            <button
              onClick={() => setFilter('overdue')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'overdue'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              In ritardo ({loans.filter(l => l.status === 'overdue').length})
            </button>
          </div>
        </div>

        {/* Lista Prestiti */}
        {filteredLoans.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nessun prestito trovato</h3>
            <p className="mt-1 text-sm text-gray-500">
              {loans.length === 0 
                ? 'Inizia registrando il tuo primo prestito.'
                : 'Nessun prestito corrisponde ai filtri selezionati.'
              }
            </p>
            {loans.length === 0 && (
              <div className="mt-6">
                <Link
                  to="/loans/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Registra primo prestito
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="divide-y divide-gray-200">
              {filteredLoans.map((loan) => (
                <div key={loan.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Copertina libro */}
                      <div className="flex-shrink-0">
                        {loan.books?.cover_image ? (
                          <img
                            src={loan.books.cover_image}
                            alt={loan.books.title}
                            className="w-16 h-20 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-20 bg-gray-200 rounded flex items-center justify-center">
                            <BookOpen className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Informazioni libro e prestito */}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {loan.books?.title}
                        </h3>
                        <p className="text-gray-600">{loan.books?.author}</p>
                        
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            <span>{loan.borrower_name}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>Prestato il {formatDate(loan.loan_date)}</span>
                          </div>
                          {loan.expected_return_date && (
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>Scadenza: {formatDate(loan.expected_return_date)}</span>
                            </div>
                          )}
                        </div>

                        {loan.notes && (
                          <p className="mt-2 text-sm text-gray-600 italic">
                            "{loan.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status e azioni */}
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        {getStatusIcon(loan.status)}
                        <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(loan.status)}`}>
                          {getStatusText(loan.status)}
                        </span>
                      </div>

                      {loan.status === 'active' && (
                        <button
                          onClick={() => handleReturnBook(loan.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Segna come restituito
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LoanList