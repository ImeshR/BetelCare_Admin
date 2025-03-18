-- Create the users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,  -- First + Last name
  provider TEXT,  -- Authentication provider (email, Google, etc.)
  last_sign_in_at TIMESTAMP,
  email_confirmed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    display_name,
    provider,
    last_sign_in_at,
    email_confirmed_at,
    created_at
  ) VALUES (
    NEW.id,
    NEW.email,
    CONCAT(NEW.raw_user_meta_data->>'first_name', ' ', NEW.raw_user_meta_data->>'last_name'),
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    NEW.last_sign_in_at,
    NEW.email_confirmed_at,
    NEW.created_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function when a user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a function to handle user updates
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET
    email = NEW.email,
    display_name = CONCAT(NEW.raw_user_meta_data->>'first_name', ' ', NEW.raw_user_meta_data->>'last_name'),
    provider = COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    last_sign_in_at = NEW.last_sign_in_at,
    email_confirmed_at = NEW.email_confirmed_at
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function when a user is updated
CREATE OR REPLACE TRIGGER on_auth_user_updated
AFTER UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- Grant necessary permissions
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to view all users
CREATE POLICY "Allow authenticated users to view all users"
ON public.users
FOR SELECT
TO authenticated
USING (true);

