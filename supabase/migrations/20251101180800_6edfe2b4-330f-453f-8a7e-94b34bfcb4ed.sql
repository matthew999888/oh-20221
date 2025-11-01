-- Part 2: Add checkout tracking and update policies
-- Add checkout tracking fields to items table
ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS checked_out_by text,
ADD COLUMN IF NOT EXISTS checkout_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS checkout_status text DEFAULT 'available';

-- Create checkout_log table for tracking history
CREATE TABLE IF NOT EXISTS public.checkout_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cadet_name text NOT NULL,
  item_id uuid REFERENCES public.items(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  checkout_date timestamp with time zone NOT NULL DEFAULT now(),
  checkin_date timestamp with time zone,
  status text NOT NULL DEFAULT 'out',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on checkout_log
ALTER TABLE public.checkout_log ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view checkout logs
CREATE POLICY "Everyone can view checkout logs"
ON public.checkout_log
FOR SELECT
USING (true);

-- Only admins, leads, and staff can insert checkout logs
CREATE POLICY "Admins, leads, and staff can insert checkout logs"
ON public.checkout_log
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'lead'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role)
);

-- Only admins, leads, and staff can update checkout logs
CREATE POLICY "Admins, leads, and staff can update checkout logs"
ON public.checkout_log
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'lead'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role)
);

-- Update items table policies for new roles
DROP POLICY IF EXISTS "Admins and logistics can insert items" ON public.items;
DROP POLICY IF EXISTS "Admins and logistics can update items" ON public.items;

CREATE POLICY "Admins, leads, and staff can insert items"
ON public.items
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'lead'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role)
);

CREATE POLICY "Admins, leads, and staff can update items"
ON public.items
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'lead'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role)
);

-- Update delete policy to include lead
DROP POLICY IF EXISTS "Only admins can delete items" ON public.items;

CREATE POLICY "Admins and leads can delete items"
ON public.items
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'lead'::app_role)
);

-- Create inventory_changes table for tracking quantity edits
CREATE TABLE IF NOT EXISTS public.inventory_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES public.items(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  old_quantity integer NOT NULL,
  new_quantity integer NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  changed_by_name text NOT NULL,
  changed_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on inventory_changes
ALTER TABLE public.inventory_changes ENABLE ROW LEVEL SECURITY;

-- Everyone can view inventory changes
CREATE POLICY "Everyone can view inventory changes"
ON public.inventory_changes
FOR SELECT
USING (true);

-- Admins, leads, and staff can insert inventory changes
CREATE POLICY "Admins, leads, and staff can insert inventory changes"
ON public.inventory_changes
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'lead'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role)
);

-- Update user_roles policies for lead role
DROP POLICY IF EXISTS "Admins can update user roles" ON public.user_roles;

CREATE POLICY "Only admins can update user roles"
ON public.user_roles
FOR UPDATE
USING (is_admin(auth.uid()));

-- Ensure only admins can manage roles (not leads)
DROP POLICY IF EXISTS "Admins can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;

CREATE POLICY "Only admins can insert user roles"
ON public.user_roles
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;

CREATE POLICY "Only admins can delete user roles"
ON public.user_roles
FOR DELETE
USING (is_admin(auth.uid()));