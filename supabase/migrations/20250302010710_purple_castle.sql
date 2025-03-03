/*
  # Create rendicontazione table for service paghe

  1. New Tables
    - `rendicontazione`
      - `id` (serial, primary key)
      - `partner` (text)
      - `nome_tecnico` (text)
      - `mese` (text)
      - `anno` (integer)
      - `codice_cliente` (text)
      - `nome_cliente` (text)
      - `numero_commessa` (text)
      - `numero_cedolini` (integer)
      - `numero_cedolini_extra` (integer)
      - `totale_cedolini` (integer)
      - `fascia` (text)
      - `importo` (numeric)
      - `created_at` (timestamptz)
  2. Security
    - Enable RLS on `rendicontazione` table
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS rendicontazione (
  id SERIAL PRIMARY KEY,
  partner TEXT NOT NULL,
  nome_tecnico TEXT NOT NULL,
  mese TEXT NOT NULL,
  anno INTEGER NOT NULL,
  codice_cliente TEXT NOT NULL,
  nome_cliente TEXT NOT NULL,
  numero_commessa TEXT,
  numero_cedolini INTEGER NOT NULL,
  numero_cedolini_extra INTEGER NOT NULL DEFAULT 0,
  totale_cedolini INTEGER NOT NULL,
  fascia TEXT NOT NULL,
  importo NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE rendicontazione ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can read all rendicontazioni"
  ON rendicontazione
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only authenticated users can insert rendicontazioni"
  ON rendicontazione
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can update rendicontazioni"
  ON rendicontazione
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Only authenticated users can delete rendicontazioni"
  ON rendicontazione
  FOR DELETE
  TO authenticated
  USING (true);