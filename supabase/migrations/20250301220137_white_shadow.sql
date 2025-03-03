/*
  # Update RLS policies for clienti table

  1. Security Changes
    - Update RLS policies to allow public access to the clienti table
    - This allows unauthenticated users to perform CRUD operations
    - Note: In a production environment, you might want to implement proper authentication
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read all clients" ON clienti;
DROP POLICY IF EXISTS "Users can insert clients" ON clienti;
DROP POLICY IF EXISTS "Users can update clients" ON clienti;
DROP POLICY IF EXISTS "Users can delete clients" ON clienti;

-- Create new policies for public access
CREATE POLICY "Allow public read access"
  ON clienti
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access"
  ON clienti
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access"
  ON clienti
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow public delete access"
  ON clienti
  FOR DELETE
  TO public
  USING (true);