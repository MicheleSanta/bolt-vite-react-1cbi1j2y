-- Add min_cedolini and max_cedolini columns to fascia table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fascia' AND column_name = 'min_cedolini'
  ) THEN
    ALTER TABLE fascia ADD COLUMN min_cedolini INTEGER DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fascia' AND column_name = 'max_cedolini'
  ) THEN
    ALTER TABLE fascia ADD COLUMN max_cedolini INTEGER DEFAULT 999999;
  END IF;
END $$;

-- Update existing fascia records with default ranges if they haven't been set already
UPDATE fascia SET min_cedolini = 1, max_cedolini = 10 WHERE nome = 'A' AND (min_cedolini IS NULL OR max_cedolini IS NULL);
UPDATE fascia SET min_cedolini = 11, max_cedolini = 20 WHERE nome = 'B' AND (min_cedolini IS NULL OR max_cedolini IS NULL);
UPDATE fascia SET min_cedolini = 21, max_cedolini = 30 WHERE nome = 'C' AND (min_cedolini IS NULL OR max_cedolini IS NULL);
UPDATE fascia SET min_cedolini = 31, max_cedolini = 50 WHERE nome = 'D' AND (min_cedolini IS NULL OR max_cedolini IS NULL);
UPDATE fascia SET min_cedolini = 51, max_cedolini = 100 WHERE nome = 'E' AND (min_cedolini IS NULL OR max_cedolini IS NULL);
UPDATE fascia SET min_cedolini = 101, max_cedolini = 999999 WHERE nome = 'F' AND (min_cedolini IS NULL OR max_cedolini IS NULL);