/*
  # Add Clienti Service Paghe table

  1. New Tables
    - `clienti_service_paghe`
      - `id` (serial, primary key)
      - `codice_cliente` (text, not null)
      - `nome_cliente` (text, not null)
      - `numero_commessa` (text)
      - `data_attivazione` (date)
      - `data_cessazione` (date)
      - `tipo_servizio` (text)
      - `software` (text)
      - `fascia` (text)
      - `adempimenti` (text)
      - `referente` (text)
      - `altre_informazioni` (text)
      - `partner` (text)
      - `created_at` (timestamptz, default now())
  2. Security
    - Enable RLS on `clienti_service_paghe` table
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS clienti_service_paghe (
  id SERIAL PRIMARY KEY,
  codice_cliente TEXT NOT NULL,
  nome_cliente TEXT NOT NULL,
  numero_commessa TEXT,
  data_attivazione DATE,
  data_cessazione DATE,
  tipo_servizio TEXT,
  software TEXT,
  fascia TEXT,
  adempimenti TEXT,
  referente TEXT,
  altre_informazioni TEXT,
  partner TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE clienti_service_paghe ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can read all clienti_service_paghe"
  ON clienti_service_paghe
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only authenticated users can insert clienti_service_paghe"
  ON clienti_service_paghe
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can update clienti_service_paghe"
  ON clienti_service_paghe
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Only authenticated users can delete clienti_service_paghe"
  ON clienti_service_paghe
  FOR DELETE
  TO authenticated
  USING (true);