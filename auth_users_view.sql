-- Create a view to access auth.users with more fields
CREATE OR REPLACE VIEW auth_users_view AS
SELECT 
  id, 
  email, 
  created_at, 
  last_sign_in_at,
  user_metadata,
  app_metadata
FROM auth.users;

-- Grant access to the view
GRANT SELECT ON auth_users_view TO anon, authenticated, service_role;

