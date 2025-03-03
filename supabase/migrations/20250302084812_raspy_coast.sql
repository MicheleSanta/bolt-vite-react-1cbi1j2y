/*
  # Add document storage for clients

  1. New Tables
    - `clienti_documenti`
      - `id` (serial, primary key)
      - `cliente_id` (integer, references clienti_service_paghe)
      - `nome_file` (text)
      - `tipo_file` (text)
      - `dimensione` (integer)
      - `url` (text)
      - `data_caricamento` (date)
      - `descrizione` (text)
      - `created_at` (timestamptz)
  2. Security
    - Enable RLS on `clienti_documenti` table
    - Add policies for authenticated users
*/

-- Create the clienti_documenti table
CREATE TABLE IF NOT EXISTS clienti_documenti (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES clienti_service_paghe(id) ON DELETE CASCADE,
  nome_file TEXT NOT NULL,
  tipo_file TEXT NOT NULL,
  dimensione INTEGER NOT NULL,
  url TEXT NOT NULL,
  data_caricamento TIMESTAMPTZ NOT NULL DEFAULT now(),
  descrizione TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE clienti_documenti ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can read all clienti_documenti"
  ON clienti_documenti
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only authenticated users can insert clienti_documenti"
  ON clienti_documenti
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can update clienti_documenti"
  ON clienti_documenti
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Only authenticated users can delete clienti_documenti"
  ON clienti_documenti
  FOR DELETE
  TO authenticated
  USING (true);

-- Create storage bucket for documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated users can update documents"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'documents');

CREATE POLICY "Anyone can read documents"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can delete documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents');