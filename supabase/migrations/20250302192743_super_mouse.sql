-- Add ore column to fascia table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fascia' AND column_name = 'ore'
  ) THEN
    ALTER TABLE fascia ADD COLUMN ore INTEGER DEFAULT 1;
  END IF;
END $$;

-- Update existing fascia records with default ore values
UPDATE fascia SET ore = 2 WHERE nome = 'A' AND (ore IS NULL);
UPDATE fascia SET ore = 3 WHERE nome = 'B' AND (ore IS NULL);
UPDATE fascia SET ore = 4 WHERE nome = 'C' AND (ore IS NULL);
UPDATE fascia SET ore = 5 WHERE nome = 'D' AND (ore IS NULL);
UPDATE fascia SET ore = 6 WHERE nome = 'E' AND (ore IS NULL);
UPDATE fascia SET ore = 8 WHERE nome = 'F' AND (ore IS NULL);