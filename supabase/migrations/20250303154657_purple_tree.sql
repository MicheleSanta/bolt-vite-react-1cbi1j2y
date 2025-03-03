-- Add employee role support and fix auth triggers
DO $$
BEGIN
  -- Drop existing triggers
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
  
  -- Drop existing functions
  DROP FUNCTION IF EXISTS handle_new_user();
  DROP FUNCTION IF EXISTS handle_user_update();
END $$;

-- Create or replace the function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users_custom (
    id,
    email,
    role,
    nome,
    telefono,
    note,
    attivo
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    NEW.raw_user_meta_data->>'nome',
    NEW.raw_user_meta_data->>'telefono',
    NEW.raw_user_meta_data->>'note',
    true
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    role = COALESCE(NEW.raw_user_meta_data->>'role', users_custom.role),
    nome = COALESCE(NEW.raw_user_meta_data->>'nome', users_custom.nome),
    telefono = COALESCE(NEW.raw_user_meta_data->>'telefono', users_custom.telefono),
    note = COALESCE(NEW.raw_user_meta_data->>'note', users_custom.note),
    ultimo_accesso = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create or replace function to handle user updates
CREATE OR REPLACE FUNCTION handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users_custom
  SET 
    email = NEW.email,
    role = COALESCE(NEW.raw_user_meta_data->>'role', users_custom.role),
    nome = COALESCE(NEW.raw_user_meta_data->>'nome', users_custom.nome),
    telefono = COALESCE(NEW.raw_user_meta_data->>'telefono', users_custom.telefono),
    note = COALESCE(NEW.raw_user_meta_data->>'note', users_custom.note),
    updated_at = now()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user updates
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_update();

-- Create function to check if user is employee
CREATE OR REPLACE FUNCTION is_employee()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM users_custom
    WHERE id = auth.uid()
    AND role = 'employee'
    AND attivo = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;