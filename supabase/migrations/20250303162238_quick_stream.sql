-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_user_role();

-- Create or replace function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- First try to get role from users_custom
  SELECT role INTO user_role
  FROM users_custom
  WHERE id = auth.uid();
  
  -- If no role found, return default role
  RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to public
GRANT EXECUTE ON FUNCTION get_user_role() TO public;
GRANT EXECUTE ON FUNCTION get_user_role() TO anon;
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;

-- Ensure users_custom has proper indices
CREATE INDEX IF NOT EXISTS idx_users_custom_id ON users_custom(id);
CREATE INDEX IF NOT EXISTS idx_users_custom_email ON users_custom(email);