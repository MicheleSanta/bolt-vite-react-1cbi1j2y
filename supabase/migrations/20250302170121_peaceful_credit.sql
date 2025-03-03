-- Add provvigione fields to affidamento table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affidamento' AND column_name = 'has_provvigione'
  ) THEN
    ALTER TABLE affidamento ADD COLUMN has_provvigione BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affidamento' AND column_name = 'tipo_provvigione'
  ) THEN
    ALTER TABLE affidamento ADD COLUMN tipo_provvigione TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affidamento' AND column_name = 'partner_provvigione'
  ) THEN
    ALTER TABLE affidamento ADD COLUMN partner_provvigione TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affidamento' AND column_name = 'percentuale_provvigione'
  ) THEN
    ALTER TABLE affidamento ADD COLUMN percentuale_provvigione NUMERIC(5,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affidamento' AND column_name = 'importo_provvigione'
  ) THEN
    ALTER TABLE affidamento ADD COLUMN importo_provvigione NUMERIC(10,2);
  END IF;
END $$;