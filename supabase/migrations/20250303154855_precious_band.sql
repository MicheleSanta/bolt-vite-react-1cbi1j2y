-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own data" ON users_custom;
DROP POLICY IF EXISTS "Only admins can insert users" ON users_custom;
DROP POLICY IF EXISTS "Only admins can update users" ON users_custom;
DROP POLICY IF EXISTS "Only admins can delete users" ON users_custom;

-- Create new policies for users_custom table
CREATE POLICY "Allow public read access on users_custom"
  ON users_custom
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to insert their own data"
  ON users_custom
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow authenticated users to update their own data"
  ON users_custom
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR (SELECT role FROM users_custom WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Allow authenticated users to delete their own data"
  ON users_custom
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id OR (SELECT role FROM users_custom WHERE id = auth.uid()) = 'admin');

-- Create or replace function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM users_custom
  WHERE id = auth.uid();
  
  RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to public
GRANT EXECUTE ON FUNCTION get_user_role() TO public;

-- Create or replace function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM users_custom
    WHERE id = auth.uid()
    AND role = 'admin'
    AND attivo = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to public
GRANT EXECUTE ON FUNCTION is_admin() TO public;