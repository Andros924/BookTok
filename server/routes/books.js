import express from 'express';
import { db } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';
import { searchBookByISBN, searchBooksByTitle } from '../services/bookService.js';

const router = express.Router();

// Get all books for authenticated user
router.get('/', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM books WHERE user_id = ? ORDER BY created_at DESC',
    [req.userId],
    (err, books) => {
      if (err) {
        return res.status(500).json({ message: 'Errore nel recupero dei libri' });
      }
      res.json(books);
    }
  );
});

// Add a new book
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      author,
      isbn,
      year,
      description,
      cover_image,
      pages,
      language,
      publisher,
      genre,
      personal_notes,
      rating,
      read_status
    } = req.body;

    db.run(
      `INSERT INTO books (
        user_id, title, author, isbn, year, description, cover_image,
        pages, language, publisher, genre, personal_notes, rating, read_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.userId, title, author, isbn, year, description, cover_image,
        pages, language, publisher, genre, personal_notes, rating, read_status
      ],
      function(err) {
        if (err) {
          return res.status(500).json({ message: 'Errore nell\'aggiunta del libro' });
        }

        // Get the created book
        db.get('SELECT * FROM books WHERE id = ?', [this.lastID], (err, book) => {
          if (err) {
            return res.status(500).json({ message: 'Errore nel recupero del libro' });
          }
          res.status(201).json(book);
        });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Errore del server' });
  }
});

// Search books by ISBN
router.get('/search/isbn/:isbn', authenticateToken, async (req, res) => {
  try {
    const { isbn } = req.params;
    const bookData = await searchBookByISBN(isbn);
    res.json(bookData);
  } catch (error) {
    res.status(404).json({ message: 'Libro non trovato' });
  }
});

// Search books by title
router.get('/search/title/:title', authenticateToken, async (req, res) => {
  try {
    const { title } = req.params;
    const books = await searchBooksByTitle(title);
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: 'Errore nella ricerca' });
  }
});

// Update book
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const {
    title,
    author,
    isbn,
    year,
    description,
    cover_image,
    pages,
    language,
    publisher,
    genre,
    personal_notes,
    rating,
    read_status
  } = req.body;

  db.run(
    `UPDATE books SET 
      title = ?, author = ?, isbn = ?, year = ?, description = ?, cover_image = ?,
      pages = ?, language = ?, publisher = ?, genre = ?, personal_notes = ?, 
      rating = ?, read_status = ?
    WHERE id = ? AND user_id = ?`,
    [
      title, author, isbn, year, description, cover_image,
      pages, language, publisher, genre, personal_notes, rating, read_status,
      id, req.userId
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Errore nell\'aggiornamento del libro' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: 'Libro non trovato' });
      }

      res.json({ message: 'Libro aggiornato con successo' });
    }
  );
});

// Delete book
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run(
    'DELETE FROM books WHERE id = ? AND user_id = ?',
    [id, req.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Errore nell\'eliminazione del libro' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: 'Libro non trovato' });
      }

      res.json({ message: 'Libro eliminato con successo' });
    }
  );
});

export default router;