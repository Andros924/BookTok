import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

const bookService = {
  getAllBooks: async () => {
    try {
      const response = await axios.get(`${API_URL}/books`, getAuthHeaders());
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Errore nel recupero dei libri';
      toast.error(message);
      throw new Error(message);
    }
  },

  addBook: async (bookData) => {
    try {
      const response = await axios.post(`${API_URL}/books`, bookData, getAuthHeaders());
      toast.success('Libro aggiunto con successo!');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Errore nell\'aggiunta del libro';
      toast.error(message);
      throw new Error(message);
    }
  },

  updateBook: async (id, bookData) => {
    try {
      const response = await axios.put(`${API_URL}/books/${id}`, bookData, getAuthHeaders());
      toast.success('Libro aggiornato con successo!');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Errore nell\'aggiornamento del libro';
      toast.error(message);
      throw new Error(message);
    }
  },

  deleteBook: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/books/${id}`, getAuthHeaders());
      toast.success('Libro eliminato con successo!');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Errore nell\'eliminazione del libro';
      toast.error(message);
      throw new Error(message);
    }
  },

  searchByISBN: async (isbn) => {
    try {
      const response = await axios.get(`${API_URL}/books/search/isbn/${isbn}`, getAuthHeaders());
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Libro non trovato';
      toast.error(message);
      throw new Error(message);
    }
  },

  searchByTitle: async (title) => {
    try {
      const response = await axios.get(`${API_URL}/books/search/title/${encodeURIComponent(title)}`, getAuthHeaders());
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Errore nella ricerca';
      toast.error(message);
      throw new Error(message);
    }
  }
};

export default bookService;