/*
  # Schema completo per la libreria personale - Fix Policies

  1. Nuove Tabelle
    - `profiles` - Profili utente estesi
    - `books` - Collezione libri personale
    - `book_loans` - Sistema prestiti

  2. Sicurezza
    - RLS abilitato su tutte le tabelle
    - Policies per ogni operazione CRUD
    - Trigger per aggiornamenti automatici

  3. Fix
    - Rimuove policies esistenti prima di ricrearle
    - Evita errori di duplicazione
*/

-- Estendi la tabella auth.users con profili personalizzati
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabella libri con campi estesi
CREATE TABLE IF NOT EXISTS books (
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

-- Tabella prestiti libri con gestione avanzata
CREATE TABLE IF NOT EXISTS book_loans (
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

-- Abilita RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_loans ENABLE ROW LEVEL SECURITY;

-- Rimuovi policies esistenti se presenti (per evitare errori di duplicazione)

-- Profiles policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;

-- Books policies
DROP POLICY IF EXISTS "Users can read own books" ON books;
DROP POLICY IF EXISTS "Users can insert own books" ON books;
DROP POLICY IF EXISTS "Users can update own books" ON books;
DROP POLICY IF EXISTS "Users can delete own books" ON books;
DROP POLICY IF EXISTS "Users can manage own books" ON books;
DROP POLICY IF EXISTS "Users can select own books" ON books;

-- Book loans policies
DROP POLICY IF EXISTS "Users can read loans for their books" ON book_loans;
DROP POLICY IF EXISTS "Users can create loans for their books" ON book_loans;
DROP POLICY IF EXISTS "Users can update loans for their books" ON book_loans;
DROP POLICY IF EXISTS "Users can manage loans for their books" ON book_loans;

-- Crea nuove policies per profiles
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Crea nuove policies per books
CREATE POLICY "Users can select own books"
  ON books
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own books"
  ON books
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own books"
  ON books
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own books"
  ON books
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Crea nuove policies per book_loans
CREATE POLICY "Users can manage loans for their books"
  ON book_loans
  FOR ALL
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

-- Funzione per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Rimuovi trigger esistenti se presenti
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_books_updated_at ON books;
DROP TRIGGER IF EXISTS update_book_loans_updated_at ON book_loans;

-- Crea nuovi trigger per updated_at
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

-- Aggiungi indici per performance
CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_read_status ON books(read_status);
CREATE INDEX IF NOT EXISTS idx_books_rating ON books(rating);
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
CREATE INDEX IF NOT EXISTS idx_books_genre ON books(genre);
CREATE INDEX IF NOT EXISTS idx_books_year ON books(year);
CREATE INDEX IF NOT EXISTS idx_books_is_favorite ON books(is_favorite);

CREATE INDEX IF NOT EXISTS idx_book_loans_lender_id ON book_loans(lender_id);
CREATE INDEX IF NOT EXISTS idx_book_loans_status ON book_loans(status);
CREATE INDEX IF NOT EXISTS idx_book_loans_expected_return ON book_loans(expected_return_date);

-- Aggiungi constraint per validazione
ALTER TABLE books ADD CONSTRAINT IF NOT EXISTS books_year_check 
  CHECK (year IS NULL OR (year >= 1000 AND year <= EXTRACT(YEAR FROM NOW()) + 1));

ALTER TABLE books ADD CONSTRAINT IF NOT EXISTS books_pages_check 
  CHECK (pages >= 0);

ALTER TABLE books ADD CONSTRAINT IF NOT EXISTS books_rating_check 
  CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));

-- Funzione per creare automaticamente il profilo utente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, created_at, updated_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rimuovi trigger esistente se presente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger per creare automaticamente il profilo quando si registra un utente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();