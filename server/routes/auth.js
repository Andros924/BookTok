import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../database/init.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ message: 'Errore del server' });
      }

      if (user) {
        return res.status(400).json({ message: 'Utente già esistente' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      db.run(
        'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
        [email, hashedPassword, name],
        function(err) {
          if (err) {
            return res.status(500).json({ message: 'Errore nella creazione dell\'utente' });
          }

          const token = jwt.sign({ userId: this.lastID }, JWT_SECRET);
          res.status(201).json({
            token,
            user: { id: this.lastID, email, name }
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ message: 'Errore del server' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ message: 'Errore del server' });
      }

      if (!user) {
        return res.status(400).json({ message: 'Credenziali non valide' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: 'Credenziali non valide' });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET);
      res.json({
        token,
        user: { id: user.id, email: user.email, name: user.name }
      });
    });
  } catch (error) {
    res.status(500).json({ message: 'Errore del server' });
  }
});

export default router;