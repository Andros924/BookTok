/*
  # Schema iniziale per la libreria

  1. Tabelle
    - `profiles` - Profili utente estesi
    - `books` - Libri nella collezione
    - `book_loans` - Prestiti di libri
  
  2. Sicurezza
    - RLS abilitato su tutte le tabelle
    - Policies per accesso sicuro ai dati
*/

-- Estendi la tabella auth.users con profili personalizzati
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabella libri
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  author text NOT NULL,
  isbn text,
  year integer,
  description text,
  cover_image text,
  pages integer,
  language text DEFAULT 'Italiano',
  publisher text,
  genre text,
  personal_notes text,
  rating integer CHECK(rating >= 1 AND rating <= 5),
  read_status text DEFAULT 'to_read' CHECK(read_status IN ('to_read', 'reading', 'read')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabella prestiti libri
CREATE TABLE IF NOT EXISTS book_loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  lender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  borrower_email text NOT NULL,
  borrower_name text NOT NULL,
  loan_date timestamptz DEFAULT now(),
  expected_return_date timestamptz,
  actual_return_date timestamptz,
  status text DEFAULT 'active' CHECK(status IN ('active', 'returned', 'overdue')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Abilita RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_loans ENABLE ROW LEVEL SECURITY;

-- Policies per profiles
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policies per books
CREATE POLICY "Users can read own books"
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
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own books"
  ON books
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies per book_loans
CREATE POLICY "Users can read loans for their books"
  ON book_loans
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = lender_id OR 
    EXISTS (
      SELECT 1 FROM books 
      WHERE books.id = book_loans.book_id 
      AND books.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create loans for their books"
  ON book_loans
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = lender_id AND
    EXISTS (
      SELECT 1 FROM books 
      WHERE books.id = book_loans.book_id 
      AND books.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update loans for their books"
  ON book_loans
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = lender_id AND
    EXISTS (
      SELECT 1 FROM books 
      WHERE books.id = book_loans.book_id 
      AND books.user_id = auth.uid()
    )
  );

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

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