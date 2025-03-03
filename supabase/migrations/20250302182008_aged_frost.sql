-- Create the affidamento_documenti table if it doesn't exist
CREATE TABLE IF NOT EXISTS affidamento_documenti (
  id SERIAL PRIMARY KEY,
  affidamento_id INTEGER NOT NULL REFERENCES affidamento(id) ON DELETE CASCADE,
  nome_file TEXT NOT NULL,
  tipo_file TEXT NOT NULL,
  dimensione INTEGER NOT NULL,
  url TEXT NOT NULL,
  data_caricamento TIMESTAMPTZ NOT NULL DEFAULT now(),
  descrizione TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security if not already enabled
ALTER TABLE affidamento_documenti ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can read all affidamento_documenti" ON affidamento_documenti;
DROP POLICY IF EXISTS "Only authenticated users can insert affidamento_documenti" ON affidamento_documenti;
DROP POLICY IF EXISTS "Only authenticated users can update affidamento_documenti" ON affidamento_documenti;
DROP POLICY IF EXISTS "Only authenticated users can delete affidamento_documenti" ON affidamento_documenti;

-- Create policies for affidamento_documenti
CREATE POLICY "Authenticated users can read all affidamento_documenti"
  ON affidamento_documenti
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only authenticated users can insert affidamento_documenti"
  ON affidamento_documenti
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can update affidamento_documenti"
  ON affidamento_documenti
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Only authenticated users can delete affidamento_documenti"
  ON affidamento_documenti
  FOR DELETE
  TO authenticated
  USING (true);