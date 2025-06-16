import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { BookOpen, Edit, Trash2, ArrowLeft, Star, Calendar, User, Building, Globe, Hash, FileText } from 'lucide-react';
import bookService from '../services/bookService';

function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const books = await bookService.getAllBooks();
        const foundBook = books.find(b => b.id === parseInt(id));
        setBook(foundBook);
      } catch (error) {
        console.error('Error fetching book:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id]);

  const handleDelete = async () => {
    try {
      await bookService.deleteBook(id);
      navigate('/books');
    } catch (error) {
      console.error('Error deleting book:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'read':
        return 'bg-green-100 text-green-800';
      case 'reading':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="text-center">Caricamento...</div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Libro non trovato</h2>
          <Link to="/books" className="text-indigo-600 hover:text-indigo-800 mt-4 inline-block">
            Torna alla libreria
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/books')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Torna alla libreria
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/books/${id}/edit`)}
              className="flex items-center px-4 py-2 text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50"
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifica
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Elimina
            </button>
          </div>
        </div>

        {/* Book Details */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="md:flex">
            {/* Cover Image */}
            <div className="md:w-1/3">
              {book.cover_image ? (
                <img
                  src={book.cover_image}
                  alt={book.title}
                  className="w-full h-96 md:h-full object-cover"
                />
              ) : (
                <div className="w-full h-96 md:h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <BookOpen className="h-24 w-24 text-gray-400" />
                </div>
              )}
            </div>

            {/* Book Info */}
            <div className="md:w-2/3 p-8">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{book.title}</h1>
                <p className="text-xl text-gray-600 mb-4">{book.author}</p>
                
                <div className="flex items-center gap-4 mb-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(book.read_status)}`}>
                    {getStatusText(book.read_status)}
                  </span>
                  {book.rating && renderStars(book.rating)}
                </div>
              </div>

              {/* Book Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {book.year && (
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-5 w-5 mr-2" />
                    <span>{book.year}</span>
                  </div>
                )}
                
                {book.publisher && (
                  <div className="flex items-center text-gray-600">
                    <Building className="h-5 w-5 mr-2" />
                    <span>{book.publisher}</span>
                  </div>
                )}
                
                {book.language && (
                  <div className="flex items-center text-gray-600">
                    <Globe className="h-5 w-5 mr-2" />
                    <span>{book.language}</span>
                  </div>
                )}
                
                {book.pages && (
                  <div className="flex items-center text-gray-600">
                    <FileText className="h-5 w-5 mr-2" />
                    <span>{book.pages} pagine</span>
                  </div>
                )}
                
                {book.isbn && (
                  <div className="flex items-center text-gray-600">
                    <Hash className="h-5 w-5 mr-2" />
                    <span>ISBN: {book.isbn}</span>
                  </div>
                )}
                
                {book.genre && (
                  <div className="flex items-center text-gray-600">
                    <span className="font-medium mr-2">Genere:</span>
                    <span>{book.genre}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {book.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Descrizione</h3>
                  <p className="text-gray-700 leading-relaxed">{book.description}</p>
                </div>
              )}

              {/* Personal Notes */}
              {book.personal_notes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Note Personali</h3>
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                    <p className="text-gray-700 leading-relaxed">{book.personal_notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mt-4">Elimina Libro</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Sei sicuro di voler eliminare "{book.title}"? Questa azione non può essere annullata.
                  </p>
                </div>
                <div className="items-center px-4 py-3">
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-24 mr-2 hover:bg-red-700"
                  >
                    Elimina
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md w-24 hover:bg-gray-400"
                  >
                    Annulla
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

export default BookDetail;