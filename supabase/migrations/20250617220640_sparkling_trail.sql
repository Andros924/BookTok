/*
  # Fix Database Schema

  1. Database Structure
    - Fix existing tables and constraints
    - Ensure proper RLS policies
    - Add missing indexes and constraints

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for all operations
    - Ensure proper user isolation

  3. Performance
    - Add indexes for common queries
    - Optimize table structure
*/

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
  -- Drop profiles policies
  DROP POLICY IF EXISTS "Enable select for users based on user_id" ON profiles;
  DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
  DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;
  DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON profiles;
  DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;

  -- Drop books policies
  DROP POLICY IF EXISTS "Users can select own books" ON books;
  DROP POLICY IF EXISTS "Users can insert own books" ON books;
  DROP POLICY IF EXISTS "Users can update own books" ON books;
  DROP POLICY IF EXISTS "Users can delete own books" ON books;

  -- Drop book_loans policies
  DROP POLICY IF EXISTS "Users can manage loans for their books" ON book_loans;
  
  -- Drop reading_sessions policies if they exist
  DROP POLICY IF EXISTS "Users can manage own reading sessions" ON reading_sessions;
  
  -- Drop book_reviews policies if they exist
  DROP POLICY IF EXISTS "Users can manage own reviews" ON book_reviews;
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Ignore errors if policies don't exist
END $$;

-- Ensure tables exist with correct structure
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  avatar_url text,
  bio text,
  reading_goal integer DEFAULT 12,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure books table has all required columns
DO $$
BEGIN
  -- Add missing columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'isbn13') THEN
    ALTER TABLE books ADD COLUMN isbn13 text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'date_started') THEN
    ALTER TABLE books ADD COLUMN date_started timestamptz;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'date_finished') THEN
    ALTER TABLE books ADD COLUMN date_finished timestamptz;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'purchase_date') THEN
    ALTER TABLE books ADD COLUMN purchase_date timestamptz;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'purchase_price') THEN
    ALTER TABLE books ADD COLUMN purchase_price numeric(10,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'location') THEN
    ALTER TABLE books ADD COLUMN location text DEFAULT 'Libreria';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'is_favorite') THEN
    ALTER TABLE books ADD COLUMN is_favorite boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'tags') THEN
    ALTER TABLE books ADD COLUMN tags text[];
  END IF;
END $$;

-- Update read_status constraint to include 'abandoned'
DO $$
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE books DROP CONSTRAINT IF EXISTS books_read_status_check;
  
  -- Add new constraint with 'abandoned' status
  ALTER TABLE books ADD CONSTRAINT books_read_status_check 
    CHECK (read_status IN ('to_read', 'reading', 'read', 'abandoned'));
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Ignore if constraint already exists
END $$;

-- Ensure book_loans table has all required columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'book_loans' AND column_name = 'borrower_phone') THEN
    ALTER TABLE book_loans ADD COLUMN borrower_phone text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'book_loans' AND column_name = 'reminder_sent') THEN
    ALTER TABLE book_loans ADD COLUMN reminder_sent boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'book_loans' AND column_name = 'deposit_amount') THEN
    ALTER TABLE book_loans ADD COLUMN deposit_amount numeric(10,2);
  END IF;
END $$;

-- Update book_loans status constraint to include 'lost'
DO $$
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE book_loans DROP CONSTRAINT IF EXISTS book_loans_status_check;
  
  -- Add new constraint with 'lost' status
  ALTER TABLE book_loans ADD CONSTRAINT book_loans_status_check 
    CHECK (status IN ('active', 'returned', 'overdue', 'lost'));
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Ignore if constraint already exists
END $$;

-- Create reading_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS reading_sessions (
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

-- Create book_reviews table if it doesn't exist
CREATE TABLE IF NOT EXISTS book_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  content text,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(book_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_reviews ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies for profiles
CREATE POLICY "Enable select for users based on user_id"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on user_id"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable delete for users based on user_id"
  ON profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Create comprehensive policies for books
CREATE POLICY "Users can select own books"
  ON books FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own books"
  ON books FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own books"
  ON books FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own books"
  ON books FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create comprehensive policies for book_loans
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

-- Create policies for reading_sessions
CREATE POLICY "Users can manage own reading sessions"
  ON reading_sessions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for book_reviews
CREATE POLICY "Users can manage own reviews"
  ON book_reviews FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_books_updated_at ON books;
DROP TRIGGER IF EXISTS update_book_loans_updated_at ON book_loans;
DROP TRIGGER IF EXISTS update_book_reviews_updated_at ON book_reviews;

-- Create triggers for updated_at
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

-- Add performance indexes
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

CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_id ON reading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_book_id ON reading_sessions(book_id);

CREATE INDEX IF NOT EXISTS idx_book_reviews_user_id ON book_reviews(user_id);

-- Add validation constraints
DO $$
BEGIN
  -- Books constraints
  ALTER TABLE books DROP CONSTRAINT IF EXISTS books_year_check;
  ALTER TABLE books ADD CONSTRAINT books_year_check 
    CHECK (year IS NULL OR (year >= 1000 AND year <= EXTRACT(YEAR FROM NOW()) + 1));

  ALTER TABLE books DROP CONSTRAINT IF EXISTS books_pages_check;
  ALTER TABLE books ADD CONSTRAINT books_pages_check 
    CHECK (pages >= 0);

  ALTER TABLE books DROP CONSTRAINT IF EXISTS books_rating_check;
  ALTER TABLE books ADD CONSTRAINT books_rating_check 
    CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Ignore if constraints already exist
END $$;

-- Create or replace function for automatic profile creation
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

-- Drop existing trigger to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create user reading stats view
CREATE OR REPLACE VIEW user_reading_stats AS
SELECT 
  p.id as user_id,
  p.name,
  COUNT(b.id) as total_books,
  COUNT(CASE WHEN b.read_status = 'read' THEN 1 END) as books_read,
  COUNT(CASE WHEN b.read_status = 'reading' THEN 1 END) as books_reading,
  COUNT(CASE WHEN b.read_status = 'to_read' THEN 1 END) as books_to_read,
  ROUND(AVG(CASE WHEN b.rating IS NOT NULL THEN b.rating END), 2) as avg_rating,
  SUM(COALESCE(b.pages, 0)) as total_pages,
  COUNT(bl.id) as total_loans,
  COUNT(CASE WHEN bl.status = 'active' THEN 1 END) as active_loans
FROM profiles p
LEFT JOIN books b ON p.id = b.user_id
LEFT JOIN book_loans bl ON p.id = bl.lender_id
GROUP BY p.id, p.name;