/*
  # Add auto-generated client code function

  This migration adds a function to generate the next client code automatically
  based on the highest existing code in the clienti_service_paghe table.
*/

-- Create a function to get the next client code
CREATE OR REPLACE FUNCTION get_next_client_code()
RETURNS TEXT AS $$
DECLARE
  latest_code TEXT;
  next_number INTEGER;
  next_code TEXT;
BEGIN
  -- Get the highest client code
  SELECT codice_cliente INTO latest_code
  FROM clienti_service_paghe
  ORDER BY codice_cliente DESC
  LIMIT 1;
  
  -- If no codes exist, start with C0001
  IF latest_code IS NULL THEN
    RETURN 'C0001';
  END IF;
  
  -- Extract the numeric part and increment
  next_number := CAST(SUBSTRING(latest_code FROM 2) AS INTEGER) + 1;
  
  -- Format the new code with leading zeros
  next_code := 'C' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN next_code;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_next_client_code() TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_client_code() TO anon;