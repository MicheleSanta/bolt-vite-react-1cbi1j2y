/*
  # Add additional information fields to clienti table

  1. Changes
    - Add `sito_web` column to store client website URL
    - Add `note` column to store additional notes about the client
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clienti' AND column_name = 'sito_web'
  ) THEN
    ALTER TABLE clienti ADD COLUMN sito_web TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clienti' AND column_name = 'note'
  ) THEN
    ALTER TABLE clienti ADD COLUMN note TEXT;
  END IF;
END $$;