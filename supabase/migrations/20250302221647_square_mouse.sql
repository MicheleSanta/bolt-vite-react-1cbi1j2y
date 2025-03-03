/*
  # Add mese table and update rendicontazione

  1. New Tables
    - `mese`
      - `id` (integer, primary key)
      - `descrizione` (text, month name in Italian)
  
  2. Changes
    - Add `id_mese` column to `rendicontazione` table
    - Populate the `mese` table with months from January to December
    - Update existing rendicontazione records to set the correct id_mese
*/

-- Create the mese table
CREATE TABLE IF NOT EXISTS mese (
  id INTEGER PRIMARY KEY,
  descrizione TEXT NOT NULL
);

-- Enable Row Level Security
ALTER TABLE mese ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can read all mese"
  ON mese
  FOR SELECT
  TO authenticated
  USING (true);

-- Populate the mese table with months
INSERT INTO mese (id, descrizione) VALUES
  (1, 'Gennaio'),
  (2, 'Febbraio'),
  (3, 'Marzo'),
  (4, 'Aprile'),
  (5, 'Maggio'),
  (6, 'Giugno'),
  (7, 'Luglio'),
  (8, 'Agosto'),
  (9, 'Settembre'),
  (10, 'Ottobre'),
  (11, 'Novembre'),
  (12, 'Dicembre')
ON CONFLICT (id) DO NOTHING;

-- Add id_mese column to rendicontazione table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rendicontazione' AND column_name = 'id_mese'
  ) THEN
    ALTER TABLE rendicontazione ADD COLUMN id_mese INTEGER REFERENCES mese(id);
  END IF;
END $$;

-- Update existing rendicontazione records to set the correct id_mese
UPDATE rendicontazione SET id_mese = 1 WHERE mese = 'Gennaio';
UPDATE rendicontazione SET id_mese = 2 WHERE mese = 'Febbraio';
UPDATE rendicontazione SET id_mese = 3 WHERE mese = 'Marzo';
UPDATE rendicontazione SET id_mese = 4 WHERE mese = 'Aprile';
UPDATE rendicontazione SET id_mese = 5 WHERE mese = 'Maggio';
UPDATE rendicontazione SET id_mese = 6 WHERE mese = 'Giugno';
UPDATE rendicontazione SET id_mese = 7 WHERE mese = 'Luglio';
UPDATE rendicontazione SET id_mese = 8 WHERE mese = 'Agosto';
UPDATE rendicontazione SET id_mese = 9 WHERE mese = 'Settembre';
UPDATE rendicontazione SET id_mese = 10 WHERE mese = 'Ottobre';
UPDATE rendicontazione SET id_mese = 11 WHERE mese = 'Novembre';
UPDATE rendicontazione SET id_mese = 12 WHERE mese = 'Dicembre';