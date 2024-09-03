import React, { useState, useEffect } from 'react';
import axios from 'axios';

function BookList() {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/books');
        setBooks(response.data);
      } catch (error) {
        console.error('Errore nel recupero dei libri:', error);
      }
    };
    fetchBooks();
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">I Miei Libri</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {books.map((book) => (
          <div key={book.id} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">{book.title}</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">{book.author}</p>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">{book.year}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BookList;