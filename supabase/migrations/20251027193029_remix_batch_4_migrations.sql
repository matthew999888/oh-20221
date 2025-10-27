
-- Migration: 20251027040834
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'logistics', 'cadet');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Create allowed_emails table for pre-authorization
CREATE TABLE public.allowed_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

-- Create items table
CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  in_use INTEGER NOT NULL DEFAULT 0,
  assigned_to TEXT,
  condition TEXT NOT NULL DEFAULT 'good',
  location TEXT NOT NULL,
  notes TEXT,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

-- Create activity_logs table
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allowed_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user has ANY admin role
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- Create function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS Policies for profiles table
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- RLS Policies for user_roles table
CREATE POLICY "Users can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- RLS Policies for allowed_emails table
CREATE POLICY "Everyone can view allowed emails"
ON public.allowed_emails FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can insert allowed emails"
ON public.allowed_emails FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update allowed emails"
ON public.allowed_emails FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can delete allowed emails"
ON public.allowed_emails FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- RLS Policies for items table
CREATE POLICY "Everyone can view items"
ON public.items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and logistics can insert items"
ON public.items FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'logistics')
);

CREATE POLICY "Admins and logistics can update items"
ON public.items FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'logistics')
);

CREATE POLICY "Only admins can delete items"
ON public.items FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- RLS Policies for activity_logs table
CREATE POLICY "Everyone can view activity logs"
ON public.activity_logs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert activity logs"
ON public.activity_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allowed_record RECORD;
BEGIN
  -- Check if email is in allowed_emails
  SELECT * INTO allowed_record
  FROM public.allowed_emails
  WHERE email = NEW.email;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Email not authorized';
  END IF;

  -- Insert into profiles
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, allowed_record.name);

  -- Insert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, allowed_record.role);

  RETURN NEW;
END;
$$;

-- Trigger to auto-create profile and role on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add updated_at triggers
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert default allowed emails
INSERT INTO public.allowed_emails (email, name, role) VALUES
  ('instructor@school.edu', 'Instructor Davis', 'admin'),
  ('logistics@school.edu', 'C/MSgt Rodriguez', 'logistics'),
  ('cadet@school.edu', 'C/Amn Smith', 'cadet');

-- Migration: 20251027040909
-- Fix search_path for handle_updated_at function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Migration: 20251027044401
-- Update the handle_new_user function to allow any signup with default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert into profiles with email from auth
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));

  -- Assign default 'cadet' role to all new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'cadet');

  RETURN NEW;
END;
$$;

-- Add RLS policies for admins to manage user roles
CREATE POLICY "Admins can update user roles"
ON public.user_roles
FOR UPDATE
USING (is_admin(auth.uid()));

-- Add policy for admins to delete user roles if needed
CREATE POLICY "Admins can delete user roles"
ON public.user_roles
FOR DELETE
USING (is_admin(auth.uid()));

-- Allow admins to insert new roles
CREATE POLICY "Admins can insert user roles"
ON public.user_roles
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Migration: 20251027050611
-- Fix profiles table RLS to prevent public email exposure
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Allow users to view only their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT 
USING (auth.uid() = id);

-- Allow admins to view all profiles (needed for admin panel)
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT 
USING (is_admin(auth.uid()));
