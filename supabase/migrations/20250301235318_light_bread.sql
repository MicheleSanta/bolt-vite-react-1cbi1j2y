/*
  # Create fatturazione table for billing deadlines

  1. New Tables
    - `fatturazione` (billing deadlines)
      - `id` (serial, primary key)
      - `affidamento_id` (integer, foreign key to affidamento table)
      - `percentuale` (numeric, percentage of the total amount)
      - `importo` (numeric, amount to be invoiced)
      - `data_scadenza` (date, due date)
      - `stato` (text, status of the billing: 'Da emettere', 'Emessa', 'Pagata')
      - `numero_fattura` (text, invoice number if issued)
      - `data_emissione` (date, date when the invoice was issued)
      - `data_pagamento` (date, date when the invoice was paid)
      - `note` (text, additional notes)
      - `created_at` (timestamptz, creation timestamp)

  2. Security
    - Enable RLS on `fatturazione` table
    - Add policies for public access (read, insert, update, delete)
*/

CREATE TABLE IF NOT EXISTS fatturazione (
  id SERIAL PRIMARY KEY,
  affidamento_id INTEGER NOT NULL REFERENCES affidamento(id) ON DELETE CASCADE,
  percentuale NUMERIC(5,2) NOT NULL,
  importo NUMERIC(10,2) NOT NULL,
  data_scadenza DATE NOT NULL,
  stato TEXT NOT NULL DEFAULT 'Da emettere',
  numero_fattura TEXT,
  data_emissione DATE,
  data_pagamento DATE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE fatturazione ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access on fatturazione"
  ON fatturazione
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access on fatturazione"
  ON fatturazione
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access on fatturazione"
  ON fatturazione
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow public delete access on fatturazione"
  ON fatturazione
  FOR DELETE
  TO public
  USING (true);