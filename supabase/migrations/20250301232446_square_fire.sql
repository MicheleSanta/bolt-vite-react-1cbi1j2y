/*
  # Add codice univoco field to clienti table

  1. Changes
    - Add `codice_univoco` column to `clienti` table
  
  2. Purpose
    - Store the unique code (codice univoco) used for electronic invoicing in Italy
    - Required for proper fiscal documentation and electronic invoicing
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clienti' AND column_name = 'codice_univoco'
  ) THEN
    ALTER TABLE clienti ADD COLUMN codice_univoco TEXT;
  END IF;
END $$;