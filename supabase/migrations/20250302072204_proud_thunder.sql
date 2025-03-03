/*
  # Add cedolini_previsti and fascia_personalizzata to clienti_service_paghe

  1. New Columns
    - `cedolini_previsti` (integer, default 1)
    - `fascia_personalizzata` (boolean, default false)
  2. Changes
    - Adds columns to track expected number of payslips
    - Adds flag to indicate if fascia is manually set
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clienti_service_paghe' AND column_name = 'cedolini_previsti'
  ) THEN
    ALTER TABLE clienti_service_paghe ADD COLUMN cedolini_previsti INTEGER DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clienti_service_paghe' AND column_name = 'fascia_personalizzata'
  ) THEN
    ALTER TABLE clienti_service_paghe ADD COLUMN fascia_personalizzata BOOLEAN DEFAULT false;
  END IF;
END $$;