/*
  # Update affidamento table with new fields

  1. Changes to Tables
    - `affidamento`
      - Add `numero_determina` (text)
      - Add `data` (date)
  
  2. Notes
    - The `descrizione` field already exists in the table
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affidamento' AND column_name = 'numero_determina'
  ) THEN
    ALTER TABLE affidamento ADD COLUMN numero_determina TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affidamento' AND column_name = 'data'
  ) THEN
    ALTER TABLE affidamento ADD COLUMN data DATE DEFAULT CURRENT_DATE;
  END IF;
END $$;