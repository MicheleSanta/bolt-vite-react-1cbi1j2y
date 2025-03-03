/*
  # Create affidamento table

  1. New Tables
    - `affidamento`
      - `id` (serial, primary key)
      - `anno` (integer)
      - `determina` (text)
      - `cliente_id` (integer, foreign key to clienti.id)
      - `descrizione` (text)
      - `stato` (text)
      - `quantita` (numeric)
      - `prezzo_unitario` (numeric)
      - `imponibile` (numeric)
      - `iva` (numeric)
      - `totale` (numeric)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on `affidamento` table
    - Add policies for public access to the table
*/

CREATE TABLE IF NOT EXISTS affidamento (
  id SERIAL PRIMARY KEY,
  anno INTEGER NOT NULL,
  determina TEXT NOT NULL,
  cliente_id INTEGER NOT NULL REFERENCES clienti(id),
  descrizione TEXT NOT NULL,
  stato TEXT NOT NULL,
  quantita NUMERIC(10,2) NOT NULL,
  prezzo_unitario NUMERIC(10,2) NOT NULL,
  imponibile NUMERIC(10,2) NOT NULL,
  iva NUMERIC(10,2) NOT NULL,
  totale NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE affidamento ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access on affidamento"
  ON affidamento
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access on affidamento"
  ON affidamento
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access on affidamento"
  ON affidamento
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow public delete access on affidamento"
  ON affidamento
  FOR DELETE
  TO public
  USING (true);