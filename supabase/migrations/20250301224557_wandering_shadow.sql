/*
  # Add function to count affidamenti per client

  1. New Functions
    - `get_affidamenti_count_for_client` - Returns the count of affidamenti for a specific client
  
  2. Security
    - Function is accessible to all authenticated users
*/

CREATE OR REPLACE FUNCTION get_affidamenti_count_for_client(client_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
  affidamenti_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO affidamenti_count
  FROM affidamento
  WHERE cliente_id = client_id;
  
  RETURN affidamenti_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_affidamenti_count_for_client(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_affidamenti_count_for_client(INTEGER) TO anon;