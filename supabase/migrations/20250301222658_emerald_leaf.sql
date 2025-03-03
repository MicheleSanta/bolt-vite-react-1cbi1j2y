/*
  # Add data termine field to affidamento table

  1. Changes to Tables
    - `affidamento`
      - Add `data_termine` (date) - To track when an affidamento is scheduled to end
  
  2. Notes
    - This complements the existing `data` field which represents the start date
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affidamento' AND column_name = 'data_termine'
  ) THEN
    ALTER TABLE affidamento ADD COLUMN data_termine DATE;
  END IF;
END $$;