/*
  # Fix document storage for clients

  1. Updates
    - Fix policy conflicts by using IF NOT EXISTS for policy creation
    - Ensure storage bucket and policies are properly created
*/

-- Create the clienti_documenti table if it doesn't exist
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

-- Enable Row Level Security if not already enabled
ALTER TABLE clienti_documenti ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users with IF NOT EXISTS to avoid conflicts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'clienti_documenti' AND policyname = 'Authenticated users can read all clienti_documenti'
  ) THEN
    CREATE POLICY "Authenticated users can read all clienti_documenti"
      ON clienti_documenti
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'clienti_documenti' AND policyname = 'Only authenticated users can insert clienti_documenti'
  ) THEN
    CREATE POLICY "Only authenticated users can insert clienti_documenti"
      ON clienti_documenti
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'clienti_documenti' AND policyname = 'Only authenticated users can update clienti_documenti'
  ) THEN
    CREATE POLICY "Only authenticated users can update clienti_documenti"
      ON clienti_documenti
      FOR UPDATE
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'clienti_documenti' AND policyname = 'Only authenticated users can delete clienti_documenti'
  ) THEN
    CREATE POLICY "Only authenticated users can delete clienti_documenti"
      ON clienti_documenti
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Create storage bucket for documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies with IF NOT EXISTS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'Authenticated users can upload documents'
  ) THEN
    CREATE POLICY "Authenticated users can upload documents"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'documents');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'Authenticated users can update documents'
  ) THEN
    CREATE POLICY "Authenticated users can update documents"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (bucket_id = 'documents');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'Anyone can read documents'
  ) THEN
    CREATE POLICY "Anyone can read documents"
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = 'documents');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'Authenticated users can delete documents'
  ) THEN
    CREATE POLICY "Authenticated users can delete documents"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (bucket_id = 'documents');
  END IF;
END $$;