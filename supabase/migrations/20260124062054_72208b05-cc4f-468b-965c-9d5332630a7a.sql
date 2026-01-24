-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('patient', 'doctor');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'patient',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
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

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own patient role"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id AND role = 'patient');

-- Create access_keys table for secure report sharing
CREATE TABLE public.access_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  key_hash text NOT NULL,
  key_preview text NOT NULL, -- Last 4 characters for display
  label text, -- Optional label like "Dr. Smith"
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  revoked_at timestamp with time zone,
  last_used_at timestamp with time zone,
  use_count integer NOT NULL DEFAULT 0
);

-- Enable RLS on access_keys
ALTER TABLE public.access_keys ENABLE ROW LEVEL SECURITY;

-- RLS policies for access_keys (patients can manage their own keys)
CREATE POLICY "Users can view their own access keys"
  ON public.access_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own access keys"
  ON public.access_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own access keys"
  ON public.access_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own access keys"
  ON public.access_keys FOR DELETE
  USING (auth.uid() = user_id);

-- Create report_access_logs table for auditing
CREATE TABLE public.report_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_key_id uuid REFERENCES public.access_keys(id) ON DELETE SET NULL,
  patient_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  doctor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  accessed_at timestamp with time zone NOT NULL DEFAULT now(),
  report_type text NOT NULL, -- 'weekly', 'monthly', etc.
  ip_address text,
  user_agent text
);

-- Enable RLS on report_access_logs
ALTER TABLE public.report_access_logs ENABLE ROW LEVEL SECURITY;

-- Patients can view logs of access to their reports
CREATE POLICY "Patients can view access logs for their reports"
  ON public.report_access_logs FOR SELECT
  USING (auth.uid() = patient_user_id);

-- Doctors can view their own access logs
CREATE POLICY "Doctors can view their own access logs"
  ON public.report_access_logs FOR SELECT
  USING (auth.uid() = doctor_user_id);

-- Create index for faster key lookups
CREATE INDEX idx_access_keys_key_hash ON public.access_keys(key_hash);
CREATE INDEX idx_access_keys_user_status ON public.access_keys(user_id, status);
CREATE INDEX idx_report_access_logs_patient ON public.report_access_logs(patient_user_id);
CREATE INDEX idx_report_access_logs_doctor ON public.report_access_logs(doctor_user_id);

-- Function to auto-assign patient role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'patient');
  RETURN NEW;
END;
$$;

-- Trigger to auto-assign patient role
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();