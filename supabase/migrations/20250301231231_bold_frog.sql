/*
  # Add fiscal fields to clienti table

  1. Changes
    - Add `codice_fiscale` column to `clienti` table
    - Add `partita_iva` column to `clienti` table
    - Add `pec` column to `clienti` table
  
  2. Purpose
    - Store fiscal identification data for clients
    - Store certified email address (PEC) for official communications
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clienti' AND column_name = 'codice_fiscale'
  ) THEN
    ALTER TABLE clienti ADD COLUMN codice_fiscale TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clienti' AND column_name = 'partita_iva'
  ) THEN
    ALTER TABLE clienti ADD COLUMN partita_iva TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clienti' AND column_name = 'pec'
  ) THEN
    ALTER TABLE clienti ADD COLUMN pec TEXT;
  END IF;
END $$;