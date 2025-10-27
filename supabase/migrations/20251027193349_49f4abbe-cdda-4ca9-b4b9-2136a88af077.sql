-- Insert admin emails into allowed_emails table
INSERT INTO public.allowed_emails (email, name, role) VALUES
  ('mlehman84@lhsd.k12.oh.us', 'M. Lehman', 'admin'),
  ('sroberts50@lhsd.k12.oh.us', 'S. Roberts', 'admin'),
  ('crice78@lhsd.k12.oh.us', 'C. Rice', 'admin')
ON CONFLICT (email) DO UPDATE SET role = 'admin';

-- Update the handle_new_user function to check allowed_emails and assign the appropriate role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Insert into profiles with email from auth
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));

  -- Check if email is in allowed_emails table
  SELECT role INTO user_role
  FROM public.allowed_emails
  WHERE email = NEW.email
  LIMIT 1;

  -- If email found in allowed_emails, use that role, otherwise default to 'cadet'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE(user_role, 'cadet'));

  RETURN NEW;
END;
$$;