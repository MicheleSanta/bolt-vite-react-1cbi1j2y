/*
  # Add CIG field to affidamento table

  1. Changes to Tables
    - `affidamento`
      - Add `cig` (text) - To store the CIG (Codice Identificativo Gara) code
  
  2. Notes
    - CIG is an important identification code for Italian public contracts
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affidamento' AND column_name = 'cig'
  ) THEN
    ALTER TABLE affidamento ADD COLUMN cig TEXT;
  END IF;
END $$;