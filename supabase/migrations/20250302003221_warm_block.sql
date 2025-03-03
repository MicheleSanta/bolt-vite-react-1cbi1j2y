/*
  # Setup authentication policies

  1. Security
    - Enable RLS on auth tables
    - Add policies for authenticated users
*/

-- Create a secure function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT (auth.jwt() ->> 'role') = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a secure function to get the current user's ID
CREATE OR REPLACE FUNCTION auth_uid()
RETURNS UUID AS $$
BEGIN
  RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update policies for clienti table
CREATE POLICY "Authenticated users can read all clients"
  ON clienti
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only authenticated users can insert clients"
  ON clienti
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can update clients"
  ON clienti
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Only authenticated users can delete clients"
  ON clienti
  FOR DELETE
  TO authenticated
  USING (true);

-- Update policies for affidamento table
CREATE POLICY "Authenticated users can read all affidamenti"
  ON affidamento
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only authenticated users can insert affidamenti"
  ON affidamento
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can update affidamenti"
  ON affidamento
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Only authenticated users can delete affidamenti"
  ON affidamento
  FOR DELETE
  TO authenticated
  USING (true);

-- Update policies for fatturazione table
CREATE POLICY "Authenticated users can read all fatturazioni"
  ON fatturazione
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only authenticated users can insert fatturazioni"
  ON fatturazione
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can update fatturazioni"
  ON fatturazione
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Only authenticated users can delete fatturazioni"
  ON fatturazione
  FOR DELETE
  TO authenticated
  USING (true);