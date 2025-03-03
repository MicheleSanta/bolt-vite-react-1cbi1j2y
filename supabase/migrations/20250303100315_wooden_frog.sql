/*
  # Create Users Table and Authentication System

  1. New Tables
    - `users_custom`
      - `id` (uuid, primary key) - Links to auth.users
      - `email` (text, unique) - User's email address
      - `role` (text) - User's role (admin, user, etc)
      - `nome` (text) - User's full name
      - `telefono` (text) - User's phone number
      - `note` (text) - Additional notes
      - `attivo` (boolean) - Whether the user is active
      - `ultimo_accesso` (timestamptz) - Last login timestamp
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on users_custom table
    - Add policies for authenticated users
    - Add trigger to update updated_at timestamp
*/

-- Create users_custom table
CREATE TABLE IF NOT EXISTS users_custom (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'user',
  nome text,
  telefono text,
  note text,
  attivo boolean DEFAULT true,
  ultimo_accesso timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users_custom ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can read their own data"
  ON users_custom
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR role = 'admin');

CREATE POLICY "Only admins can insert users"
  ON users_custom
  FOR INSERT
  TO authenticated
  WITH CHECK (role = 'admin');

CREATE POLICY "Only admins can update users"
  ON users_custom
  FOR UPDATE
  TO authenticated
  USING (role = 'admin');

CREATE POLICY "Only admins can delete users"
  ON users_custom
  FOR DELETE
  TO authenticated
  USING (role = 'admin');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_users_custom_updated_at
  BEFORE UPDATE ON users_custom
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to check if user is admin
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

-- Create function to get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role
    FROM users_custom
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update last login timestamp
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users_custom
  SET ultimo_accesso = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update last login on auth.users
CREATE TRIGGER on_auth_user_login
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION update_last_login();