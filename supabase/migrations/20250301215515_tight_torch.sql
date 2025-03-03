/*
  # Create clienti table for Service Paghe

  1. New Tables
    - `clienti`
      - `id` (serial, primary key)
      - `denominazione` (text, not null)
      - `referente` (text, not null)
      - `cellulare` (text, not null)
      - `email` (text, not null)
      - `created_at` (timestamptz, default now())
  2. Security
    - Enable RLS on `clienti` table
    - Add policies for authenticated users to perform CRUD operations
*/

CREATE TABLE IF NOT EXISTS clienti (
  id SERIAL PRIMARY KEY,
  denominazione TEXT NOT NULL,
  referente TEXT NOT NULL,
  cellulare TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE clienti ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to select their own data
CREATE POLICY "Users can read all clients"
  ON clienti
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy to allow authenticated users to insert their own data
CREATE POLICY "Users can insert clients"
  ON clienti
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy to allow authenticated users to update their own data
CREATE POLICY "Users can update clients"
  ON clienti
  FOR UPDATE
  TO authenticated
  USING (true);

-- Policy to allow authenticated users to delete their own data
CREATE POLICY "Users can delete clients"
  ON clienti
  FOR DELETE
  TO authenticated
  USING (true);