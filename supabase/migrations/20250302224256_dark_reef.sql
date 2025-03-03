-- Add anno column to fascia table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fascia' AND column_name = 'anno'
  ) THEN
    ALTER TABLE fascia ADD COLUMN anno INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE);
  END IF;
END $$;

-- Update existing fascia records with current year if anno is null
UPDATE fascia SET anno = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER WHERE anno IS NULL;