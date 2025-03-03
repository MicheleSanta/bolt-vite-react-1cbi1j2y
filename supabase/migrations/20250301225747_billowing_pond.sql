/*
  # Add ufficio and residenza fields to clienti table

  1. Changes
    - Add `ufficio` text field to `clienti` table
    - Add `indirizzo` text field to `clienti` table
    - Add `citta` text field to `clienti` table
    - Add `cap` text field to `clienti` table
    - Add `provincia` text field to `clienti` table
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clienti' AND column_name = 'ufficio'
  ) THEN
    ALTER TABLE clienti ADD COLUMN ufficio TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clienti' AND column_name = 'indirizzo'
  ) THEN
    ALTER TABLE clienti ADD COLUMN indirizzo TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clienti' AND column_name = 'citta'
  ) THEN
    ALTER TABLE clienti ADD COLUMN citta TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clienti' AND column_name = 'cap'
  ) THEN
    ALTER TABLE clienti ADD COLUMN cap TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clienti' AND column_name = 'provincia'
  ) THEN
    ALTER TABLE clienti ADD COLUMN provincia TEXT;
  END IF;
END $$;