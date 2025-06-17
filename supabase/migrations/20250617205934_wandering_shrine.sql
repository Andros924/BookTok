/*
  # Schema completo per la libreria personale

  1. Nuove Tabelle
    - `profiles` - Profili utente estesi
    - `books` - Collezione libri personale
    - `book_loans` - Sistema prestiti avanzato
    - `reading_sessions` - Sessioni di lettura
    - `book_reviews` - Recensioni personali

  2. Sicurezza
    - RLS abilitato su tutte le tabelle
    - Policies granulari per ogni operazione
    - Trigger per aggiornamenti automatici

  3. Funzionalità Avanzate
    - Gestione prestiti con notifiche
    - Statistiche di lettura
    - Sistema di valutazioni
*/

-- Elimina tabelle esistenti se presenti
DROP TABLE IF EXISTS book_reviews CASCADE;
DROP TABLE IF EXISTS reading_sessions CASCADE;
DROP TABLE IF EXISTS book_loans CASCADE;
DROP TABLE IF EXISTS books CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Tabella profili utente estesi
CREATE TABLE profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  avatar_url text,
  bio text,
  reading_goal integer DEFAULT 12,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabella libri con campi estesi
CREATE TABLE books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  author text NOT NULL,
  isbn text,
  isbn13 text,
  year integer,
  description text,
  cover_image text,
  pages integer DEFAULT 0,
  language text DEFAULT 'Italiano',
  publisher text,
  genre text,
  personal_notes text,
  rating integer CHECK(rating >= 1 AND rating <= 5),
  read_status text DEFAULT 'to_read' CHECK(read_status IN ('to_read', 'reading', 'read', 'abandoned')),
  date_started timestamptz,
  date_finished timestamptz,
  purchase_date timestamptz,
  purchase_price decimal(10,2),
  location text DEFAULT 'Libreria',
  is_favorite boolean DEFAULT false,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabella prestiti con gestione avanzata
CREATE TABLE book_loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  lender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  borrower_name text NOT NULL,
  borrower_email text,
  borrower_phone text,
  loan_date timestamptz DEFAULT now(),
  expected_return_date timestamptz,
  actual_return_date timestamptz,
  status text DEFAULT 'active' CHECK(status IN ('active', 'returned', 'overdue', 'lost')),
  notes text,
  reminder_sent boolean DEFAULT false,
  deposit_amount decimal(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabella sessioni di lettura
CREATE TABLE reading_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_page integer DEFAULT 0,
  end_page integer DEFAULT 0,
  pages_read integer GENERATED ALWAYS AS (end_page - start_page) STORED,
  session_date timestamptz DEFAULT now(),
  duration_minutes integer,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Tabella recensioni personali
CREATE TABLE book_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK(rating >= 1 AND rating <= 5),
  title text,
  content text,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(book_id, user_id)
);

-- Abilita RLS su tutte le tabelle
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_reviews ENABLE ROW LEVEL SECURITY;

-- Policies per profiles
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policies per books
CREATE POLICY "Users can manage own books"
  ON books FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies per book_loans
CREATE POLICY "Users can manage loans for their books"
  ON book_loans FOR ALL
  TO authenticated
  USING (
    auth.uid() = lender_id OR 
    EXISTS (
      SELECT 1 FROM books 
      WHERE books.id = book_loans.book_id 
      AND books.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = lender_id AND
    EXISTS (
      SELECT 1 FROM books 
      WHERE books.id = book_loans.book_id 
      AND books.user_id = auth.uid()
    )
  );

-- Policies per reading_sessions
CREATE POLICY "Users can manage own reading sessions"
  ON reading_sessions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies per book_reviews
CREATE POLICY "Users can manage own reviews"
  ON book_reviews FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Funzione per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger per updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON books
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_book_loans_updated_at
  BEFORE UPDATE ON book_loans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_book_reviews_updated_at
  BEFORE UPDATE ON book_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Funzione per aggiornare automaticamente lo status dei prestiti
CREATE OR REPLACE FUNCTION update_loan_status()
RETURNS void AS $$
BEGIN
  UPDATE book_loans 
  SET status = 'overdue'
  WHERE status = 'active' 
    AND expected_return_date < now()
    AND expected_return_date IS NOT NULL;
END;
$$ language 'plpgsql';

-- Indici per performance
CREATE INDEX idx_books_user_id ON books(user_id);
CREATE INDEX idx_books_read_status ON books(read_status);
CREATE INDEX idx_books_rating ON books(rating);
CREATE INDEX idx_book_loans_lender_id ON book_loans(lender_id);
CREATE INDEX idx_book_loans_status ON book_loans(status);
CREATE INDEX idx_book_loans_expected_return ON book_loans(expected_return_date);
CREATE INDEX idx_reading_sessions_user_id ON reading_sessions(user_id);
CREATE INDEX idx_reading_sessions_book_id ON reading_sessions(book_id);
CREATE INDEX idx_book_reviews_user_id ON book_reviews(user_id);

-- Viste per statistiche
CREATE VIEW user_reading_stats AS
SELECT 
  u.id as user_id,
  p.name,
  COUNT(b.id) as total_books,
  COUNT(CASE WHEN b.read_status = 'read' THEN 1 END) as books_read,
  COUNT(CASE WHEN b.read_status = 'reading' THEN 1 END) as books_reading,
  COUNT(CASE WHEN b.read_status = 'to_read' THEN 1 END) as books_to_read,
  COALESCE(AVG(CASE WHEN b.rating IS NOT NULL THEN b.rating END), 0) as avg_rating,
  COALESCE(SUM(b.pages), 0) as total_pages,
  COUNT(bl.id) as total_loans,
  COUNT(CASE WHEN bl.status = 'active' THEN 1 END) as active_loans
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN books b ON u.id = b.user_id
LEFT JOIN book_loans bl ON u.id = bl.lender_id
GROUP BY u.id, p.name;