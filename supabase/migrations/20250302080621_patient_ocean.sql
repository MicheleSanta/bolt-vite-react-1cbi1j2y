/*
  # Add status and invoice tracking to rendicontazione

  1. New Columns
    - `stato` - Status of the rendicontazione (Da fatturare, Fatturato)
    - `numero_fattura` - Invoice number
    - `anno_fattura` - Invoice year
    - `data_fattura` - Invoice date
  
  2. Changes
    - Adds new columns to track invoice status and details
    - Adds default values for existing records
*/

DO $$
BEGIN
  -- Add stato column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rendicontazione' AND column_name = 'stato'
  ) THEN
    ALTER TABLE rendicontazione ADD COLUMN stato TEXT DEFAULT 'Da fatturare';
  END IF;

  -- Add numero_fattura column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rendicontazione' AND column_name = 'numero_fattura'
  ) THEN
    ALTER TABLE rendicontazione ADD COLUMN numero_fattura TEXT;
  END IF;

  -- Add anno_fattura column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rendicontazione' AND column_name = 'anno_fattura'
  ) THEN
    ALTER TABLE rendicontazione ADD COLUMN anno_fattura INTEGER;
  END IF;

  -- Add data_fattura column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rendicontazione' AND column_name = 'data_fattura'
  ) THEN
    ALTER TABLE rendicontazione ADD COLUMN data_fattura DATE;
  END IF;
END $$;

-- Set default values for existing records
UPDATE rendicontazione SET stato = 'Da fatturare' WHERE stato IS NULL;