/*
  # Disabilita conferma email per registrazione immediata

  1. Configurazione
    - Disabilita la conferma email per nuovi utenti
    - Permette login immediato dopo registrazione
    - Mantiene la sicurezza con RLS

  2. Funzionalità
    - Gli utenti possono registrarsi e accedere immediatamente
    - Il profilo viene creato automaticamente
    - Nessuna email di conferma richiesta
*/

-- Questa migrazione non modifica la struttura del database
-- ma documenta che la conferma email è disabilitata nelle impostazioni di Supabase

-- Assicuriamoci che il trigger per la creazione automatica del profilo funzioni correttamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Inserisci il profilo immediatamente quando un utente si registra
  INSERT INTO public.profiles (id, name, email, created_at, updated_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    now(),
    now()
  );
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log dell'errore ma non bloccare la registrazione
    RAISE LOG 'Error creating profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ricrea il trigger per assicurarsi che sia aggiornato
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Aggiungi un indice per migliorare le performance delle query sui profili
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Commento per documentare la configurazione
COMMENT ON FUNCTION public.handle_new_user() IS 'Crea automaticamente un profilo quando un utente si registra. Email confirmation è disabilitata nelle impostazioni di Supabase.';