/*
  # Fix Books Table Constraints and Validation

  1. Updates
    - Fix any constraint issues
    - Ensure proper data types
    - Add missing indexes
    - Update RLS policies

  2. Security
    - Ensure RLS is properly configured
    - Update policies for better performance
*/

-- Ensure the books table has proper constraints
ALTER TABLE books 
  ALTER COLUMN pages SET DEFAULT 0,
  ALTER COLUMN language SET DEFAULT 'Italiano',
  ALTER COLUMN location SET DEFAULT 'Libreria',
  ALTER COLUMN read_status SET DEFAULT 'to_read',
  ALTER COLUMN is_favorite SET DEFAULT false;

-- Update the rating constraint to be more explicit
ALTER TABLE books DROP CONSTRAINT IF EXISTS books_rating_check;
ALTER TABLE books ADD CONSTRAINT books_rating_check 
  CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));

-- Update the read_status constraint to be more explicit
ALTER TABLE books DROP CONSTRAINT IF EXISTS books_read_status_check;
ALTER TABLE books ADD CONSTRAINT books_read_status_check 
  CHECK (read_status IN ('to_read', 'reading', 'read', 'abandoned'));

-- Ensure year is reasonable
ALTER TABLE books DROP CONSTRAINT IF EXISTS books_year_check;
ALTER TABLE books ADD CONSTRAINT books_year_check 
  CHECK (year IS NULL OR (year >= 1000 AND year <= EXTRACT(YEAR FROM NOW()) + 1));

-- Ensure pages is not negative
ALTER TABLE books DROP CONSTRAINT IF EXISTS books_pages_check;
ALTER TABLE books ADD CONSTRAINT books_pages_check 
  CHECK (pages >= 0);

-- Add index for better performance on common queries
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
CREATE INDEX IF NOT EXISTS idx_books_genre ON books(genre);
CREATE INDEX IF NOT EXISTS idx_books_year ON books(year);
CREATE INDEX IF NOT EXISTS idx_books_is_favorite ON books(is_favorite);

-- Update RLS policies for better performance
DROP POLICY IF EXISTS "Users can manage own books" ON books;

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

-- Ensure RLS is enabled
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON books TO authenticated;