/*
  # Aggiungi collezione film al progetto

  1. Nuove Tabelle
    - `movies` - Collezione film personale
    - `movie_loans` - Sistema prestiti per film

  2. Sicurezza
    - RLS abilitato su tutte le tabelle
    - Policies per accesso sicuro ai dati

  3. Performance
    - Indici per query comuni
    - Vista per statistiche film
*/

-- Tabella film con campi specifici per i film
CREATE TABLE IF NOT EXISTS movies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  director text NOT NULL,
  year integer,
  duration_minutes integer,
  description text,
  cover_image text,
  language text DEFAULT 'Italiano',
  studio text,
  genre text,
  personal_notes text,
  rating integer,
  watch_status text DEFAULT 'to_watch',
  date_started timestamptz,
  date_finished timestamptz,
  purchase_date timestamptz,
  purchase_price decimal(10,2),
  location text DEFAULT 'Collezione',
  is_favorite boolean DEFAULT false,
  format text DEFAULT 'Digital',
  tags text[],
  imdb_id text,
  tmdb_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabella prestiti film
CREATE TABLE IF NOT EXISTS movie_loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id uuid REFERENCES movies(id) ON DELETE CASCADE NOT NULL,
  lender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  borrower_name text NOT NULL,
  borrower_email text,
  borrower_phone text,
  loan_date timestamptz DEFAULT now(),
  expected_return_date timestamptz,
  actual_return_date timestamptz,
  status text DEFAULT 'active',
  notes text,
  reminder_sent boolean DEFAULT false,
  deposit_amount decimal(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Aggiungi constraint per movies
DO $$
BEGIN
  -- Rating constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'movies_rating_check' 
    AND table_name = 'movies'
  ) THEN
    ALTER TABLE movies ADD CONSTRAINT movies_rating_check 
      CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));
  END IF;

  -- Watch status constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'movies_watch_status_check' 
    AND table_name = 'movies'
  ) THEN
    ALTER TABLE movies ADD CONSTRAINT movies_watch_status_check 
      CHECK (watch_status IN ('to_watch', 'watching', 'watched', 'abandoned'));
  END IF;

  -- Year constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'movies_year_check' 
    AND table_name = 'movies'
  ) THEN
    ALTER TABLE movies ADD CONSTRAINT movies_year_check 
      CHECK (year IS NULL OR (year >= 1888 AND year <= EXTRACT(YEAR FROM NOW()) + 5));
  END IF;

  -- Duration constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'movies_duration_check' 
    AND table_name = 'movies'
  ) THEN
    ALTER TABLE movies ADD CONSTRAINT movies_duration_check 
      CHECK (duration_minutes IS NULL OR duration_minutes > 0);
  END IF;

  -- Format constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'movies_format_check' 
    AND table_name = 'movies'
  ) THEN
    ALTER TABLE movies ADD CONSTRAINT movies_format_check 
      CHECK (format IN ('DVD', 'Blu-ray', 'Digital', '4K UHD', 'VHS'));
  END IF;
END $$;

-- Aggiungi constraint per movie_loans
DO $$
BEGIN
  -- Status constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'movie_loans_status_check' 
    AND table_name = 'movie_loans'
  ) THEN
    ALTER TABLE movie_loans ADD CONSTRAINT movie_loans_status_check 
      CHECK (status IN ('active', 'returned', 'overdue', 'lost'));
  END IF;
END $$;

-- Abilita RLS
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE movie_loans ENABLE ROW LEVEL SECURITY;

-- Rimuovi policies esistenti se presenti
DO $$
BEGIN
  -- Movies policies
  DROP POLICY IF EXISTS "Users can select own movies" ON movies;
  DROP POLICY IF EXISTS "Users can insert own movies" ON movies;
  DROP POLICY IF EXISTS "Users can update own movies" ON movies;
  DROP POLICY IF EXISTS "Users can delete own movies" ON movies;

  -- Movie loans policies
  DROP POLICY IF EXISTS "Users can manage loans for their movies" ON movie_loans;
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Ignore errors if policies don't exist
END $$;

-- Policies per movies
CREATE POLICY "Users can select own movies"
  ON movies FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own movies"
  ON movies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own movies"
  ON movies FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own movies"
  ON movies FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies per movie_loans
CREATE POLICY "Users can manage loans for their movies"
  ON movie_loans FOR ALL
  TO authenticated
  USING (
    auth.uid() = lender_id OR 
    EXISTS (
      SELECT 1 FROM movies 
      WHERE movies.id = movie_loans.movie_id 
      AND movies.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = lender_id AND
    EXISTS (
      SELECT 1 FROM movies 
      WHERE movies.id = movie_loans.movie_id 
      AND movies.user_id = auth.uid()
    )
  );

-- Trigger per updated_at sui film (solo se la funzione esiste)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    -- Rimuovi trigger esistenti se presenti
    DROP TRIGGER IF EXISTS update_movies_updated_at ON movies;
    DROP TRIGGER IF EXISTS update_movie_loans_updated_at ON movie_loans;
    
    -- Crea nuovi trigger
    CREATE TRIGGER update_movies_updated_at
      BEFORE UPDATE ON movies
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_movie_loans_updated_at
      BEFORE UPDATE ON movie_loans
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_movies_user_id ON movies(user_id);
CREATE INDEX IF NOT EXISTS idx_movies_watch_status ON movies(watch_status);
CREATE INDEX IF NOT EXISTS idx_movies_rating ON movies(rating);
CREATE INDEX IF NOT EXISTS idx_movies_title ON movies(title);
CREATE INDEX IF NOT EXISTS idx_movies_director ON movies(director);
CREATE INDEX IF NOT EXISTS idx_movies_genre ON movies(genre);
CREATE INDEX IF NOT EXISTS idx_movies_year ON movies(year);
CREATE INDEX IF NOT EXISTS idx_movies_is_favorite ON movies(is_favorite);
CREATE INDEX IF NOT EXISTS idx_movies_format ON movies(format);

CREATE INDEX IF NOT EXISTS idx_movie_loans_lender_id ON movie_loans(lender_id);
CREATE INDEX IF NOT EXISTS idx_movie_loans_status ON movie_loans(status);
CREATE INDEX IF NOT EXISTS idx_movie_loans_expected_return ON movie_loans(expected_return_date);

-- Vista per statistiche film utente
CREATE OR REPLACE VIEW user_movie_stats AS
SELECT 
  p.id as user_id,
  p.name,
  COUNT(m.id) as total_movies,
  COUNT(CASE WHEN m.watch_status = 'watched' THEN 1 END) as movies_watched,
  COUNT(CASE WHEN m.watch_status = 'watching' THEN 1 END) as movies_watching,
  COUNT(CASE WHEN m.watch_status = 'to_watch' THEN 1 END) as movies_to_watch,
  ROUND(AVG(CASE WHEN m.rating IS NOT NULL THEN m.rating END), 2) as avg_rating,
  SUM(COALESCE(m.duration_minutes, 0)) as total_minutes,
  COUNT(ml.id) as total_loans,
  COUNT(CASE WHEN ml.status = 'active' THEN 1 END) as active_loans
FROM profiles p
LEFT JOIN movies m ON p.id = m.user_id
LEFT JOIN movie_loans ml ON p.id = ml.lender_id
GROUP BY p.id, p.name;

-- Commenti per documentazione
COMMENT ON TABLE movies IS 'Collezione film personale degli utenti';
COMMENT ON TABLE movie_loans IS 'Sistema prestiti per i film';
COMMENT ON COLUMN movies.format IS 'Formato fisico o digitale del film';
COMMENT ON COLUMN movies.watch_status IS 'Stato di visione del film';
COMMENT ON COLUMN movies.duration_minutes IS 'Durata del film in minuti';