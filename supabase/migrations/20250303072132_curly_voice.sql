/*
  # Add fields to tecnico table
  
  1. New Fields
    - `codice_fiscale` (text) - Codice fiscale del tecnico
    - `attivo` (boolean) - Flag per indicare se il tecnico è attivo
    - `data_attivazione` (date) - Data di attivazione del tecnico
  
  2. Changes
    - Add default values for existing records
*/

-- Add new columns to tecnico table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tecnico' AND column_name = 'codice_fiscale'
  ) THEN
    ALTER TABLE tecnico ADD COLUMN codice_fiscale TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tecnico' AND column_name = 'attivo'
  ) THEN
    ALTER TABLE tecnico ADD COLUMN attivo BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tecnico' AND column_name = 'data_attivazione'
  ) THEN
    ALTER TABLE tecnico ADD COLUMN data_attivazione DATE DEFAULT CURRENT_DATE;
  END IF;
END $$;

-- Set default values for existing records
UPDATE tecnico SET attivo = true WHERE attivo IS NULL;
UPDATE tecnico SET data_attivazione = CURRENT_DATE WHERE data_attivazione IS NULL;