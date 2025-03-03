/*
  # Add Partner, Tecnico, and Fascia tables
  
  1. New Tables
    - `partner` - Stores partner information
      - `id` (serial, primary key)
      - `nome` (text, not null)
      - `created_at` (timestamp with timezone)
    
    - `tecnico` - Stores technical staff information
      - `id` (serial, primary key)
      - `nome` (text, not null)
      - `created_at` (timestamp with timezone)
    
    - `fascia` - Stores pricing tiers with rates
      - `id` (serial, primary key)
      - `nome` (text, not null)
      - `tariffa` (numeric, not null)
      - `descrizione` (text)
      - `created_at` (timestamp with timezone)
  
  2. Security
    - Enable RLS on all tables
    - Add policies for public access to all tables
*/

-- Create Partner table
CREATE TABLE IF NOT EXISTS partner (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE partner ENABLE ROW LEVEL SECURITY;

-- Create policies for public access to partner table
CREATE POLICY "Allow public read access on partner"
  ON partner
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access on partner"
  ON partner
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access on partner"
  ON partner
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow public delete access on partner"
  ON partner
  FOR DELETE
  TO public
  USING (true);

-- Create Tecnico table
CREATE TABLE IF NOT EXISTS tecnico (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tecnico ENABLE ROW LEVEL SECURITY;

-- Create policies for public access to tecnico table
CREATE POLICY "Allow public read access on tecnico"
  ON tecnico
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access on tecnico"
  ON tecnico
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access on tecnico"
  ON tecnico
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow public delete access on tecnico"
  ON tecnico
  FOR DELETE
  TO public
  USING (true);

-- Create Fascia table
CREATE TABLE IF NOT EXISTS fascia (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  tariffa NUMERIC(10,2) NOT NULL,
  descrizione TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE fascia ENABLE ROW LEVEL SECURITY;

-- Create policies for public access to fascia table
CREATE POLICY "Allow public read access on fascia"
  ON fascia
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access on fascia"
  ON fascia
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access on fascia"
  ON fascia
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow public delete access on fascia"
  ON fascia
  FOR DELETE
  TO public
  USING (true);

-- Insert default data for fascia
INSERT INTO fascia (nome, tariffa, descrizione) VALUES
  ('A', 10.00, 'Fascia base'),
  ('B', 15.00, 'Fascia intermedia'),
  ('C', 20.00, 'Fascia avanzata'),
  ('D', 25.00, 'Fascia premium'),
  ('E', 30.00, 'Fascia enterprise'),
  ('F', 35.00, 'Fascia custom')
ON CONFLICT (nome) DO NOTHING;