-- ========================================
-- Migration: 20260120083242_215d7717-a643-4ecf-8401-86083bd6e601.sql
-- ========================================
-- Create profiles table for student information
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    study_level TEXT,
    subjects_of_interest TEXT[],
    career_goals TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, name, mobile)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'mobile', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();


-- ========================================
-- Migration: 20260120084312_6899ff68-7d2c-4155-8118-7f96f81fe24e.sql
-- ========================================
-- Create papers table for uploaded question papers
CREATE TABLE public.papers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL,
    level TEXT NOT NULL,
    university TEXT,
    year INTEGER,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    downloads INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on papers
ALTER TABLE public.papers ENABLE ROW LEVEL SECURITY;

-- Papers RLS policies
CREATE POLICY "Anyone can view approved papers"
ON public.papers FOR SELECT
USING (status = 'approved');

CREATE POLICY "Users can view their own papers"
ON public.papers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can upload papers"
ON public.papers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own papers"
ON public.papers FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own papers"
ON public.papers FOR DELETE
USING (auth.uid() = user_id);

-- Add points column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 0;

-- Create points history table
CREATE TABLE public.points_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    points INTEGER NOT NULL,
    action TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on points_history
ALTER TABLE public.points_history ENABLE ROW LEVEL SECURITY;

-- Points history RLS policies
CREATE POLICY "Users can view their own points history"
ON public.points_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own points history"
ON public.points_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Trigger for papers updated_at
CREATE TRIGGER update_papers_updated_at
BEFORE UPDATE ON public.papers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for papers
INSERT INTO storage.buckets (id, name, public) VALUES ('papers', 'papers', true);

-- Storage policies for papers bucket
CREATE POLICY "Anyone can view papers"
ON storage.objects FOR SELECT
USING (bucket_id = 'papers');

CREATE POLICY "Authenticated users can upload papers"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'papers' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own paper files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'papers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own paper files"
ON storage.objects FOR DELETE
USING (bucket_id = 'papers' AND auth.uid()::text = (storage.foldername(name))[1]);


-- ========================================
-- Migration: 20260121160933_de5a9222-54c0-48bf-8c69-087e32326f42.sql
-- ========================================
-- Create a function to increment download count securely
CREATE OR REPLACE FUNCTION public.increment_download_count(paper_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE papers 
  SET downloads = downloads + 1 
  WHERE id = paper_id AND status = 'approved';
END;
$$;


-- ========================================
-- Migration: 20260121161250_7c8ae806-647b-49f9-ae8c-df37adb356cf.sql
-- ========================================
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
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

-- RLS: Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- RLS: Only admins can manage roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Add policy for admins to view all papers (including pending)
CREATE POLICY "Admins can view all papers"
ON public.papers
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Add policy for admins to update any paper status
CREATE POLICY "Admins can update any paper"
ON public.papers
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));


-- ========================================
-- Migration: 20260122175034_c7b4e12a-b80c-40e1-bf2c-d11b550ce5e8.sql
-- ========================================
-- Create function to get user email by mobile number
-- This uses SECURITY DEFINER to safely access auth.users
CREATE OR REPLACE FUNCTION public.get_user_email_by_mobile(mobile_number TEXT)
RETURNS TABLE(email TEXT) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT au.email::TEXT
  FROM auth.users au
  INNER JOIN public.profiles p ON p.user_id = au.id
  WHERE p.mobile = mobile_number
     OR p.mobile LIKE '%' || mobile_number || '%'
     OR mobile_number LIKE '%' || p.mobile || '%'
  LIMIT 1;
END;
$$;


-- ========================================
-- Migration: 20260123105914_d0a90611-4930-4069-8990-e39285594b50.sql
-- ========================================
-- Create support_tickets table
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can view their own tickets
CREATE POLICY "Users can view their own tickets"
ON public.support_tickets
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own tickets
CREATE POLICY "Users can create their own tickets"
ON public.support_tickets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all tickets
CREATE POLICY "Admins can view all tickets"
ON public.support_tickets
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update any ticket
CREATE POLICY "Admins can update any ticket"
ON public.support_tickets
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


-- ========================================
-- Migration: 20260127171325_e196dc1d-5a14-4356-979d-6f3ed8b6f918.sql
-- ========================================
-- Create notes table
CREATE TABLE public.notes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL,
    level TEXT NOT NULL,
    chapter_topic TEXT,
    university TEXT,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    downloads INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notes
CREATE POLICY "Users can upload their own notes"
ON public.notes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own notes"
ON public.notes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
ON public.notes FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
ON public.notes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view approved notes"
ON public.notes FOR SELECT
USING (status = 'approved');

CREATE POLICY "Admins can view all notes"
ON public.notes FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update any note"
ON public.notes FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_notes_updated_at
BEFORE UPDATE ON public.notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to increment note download count
CREATE OR REPLACE FUNCTION public.increment_note_download_count(note_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE notes 
  SET downloads = downloads + 1 
  WHERE id = note_id AND status = 'approved';
END;
$$;

-- Create notes storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('notes', 'notes', true);

-- Storage policies for notes bucket
CREATE POLICY "Anyone can view notes files"
ON storage.objects FOR SELECT
USING (bucket_id = 'notes');

CREATE POLICY "Authenticated users can upload notes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'notes' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own notes files"
ON storage.objects FOR DELETE
USING (bucket_id = 'notes' AND auth.uid()::text = (storage.foldername(name))[1]);


-- ========================================
-- Migration: 20260128102326_a99d59c2-5927-4ac7-94d6-ee9d5129e9db.sql
-- ========================================
-- Create feedback table for student suggestions and ideas
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Users can submit their own feedback
CREATE POLICY "Users can submit feedback"
ON public.feedback
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
ON public.feedback
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback"
ON public.feedback
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update feedback status
CREATE POLICY "Admins can update feedback"
ON public.feedback
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_feedback_updated_at
BEFORE UPDATE ON public.feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


-- ========================================
-- Migration: 20260131081939_16368744-cde0-4e84-bef5-1648e8d59505.sql
-- ========================================
-- Create a public view for approved notes that excludes user_id
CREATE OR REPLACE VIEW public.notes_public
WITH (security_invoker=on) AS
  SELECT 
    id,
    title,
    description,
    subject,
    level,
    chapter_topic,
    university,
    file_path,
    file_size,
    downloads,
    status,
    created_at,
    updated_at
  FROM public.notes
  WHERE status = 'approved';

-- Grant SELECT on the view to anonymous and authenticated users
GRANT SELECT ON public.notes_public TO anon, authenticated;


-- ========================================
-- Migration: 20260131082229_912dd038-99a9-4ade-99f3-8f9bca8f9055.sql
-- ========================================
-- 1. Fix SQL injection in mobile lookup function - use exact match only
CREATE OR REPLACE FUNCTION public.get_user_email_by_mobile(mobile_number text)
 RETURNS TABLE(email text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  sanitized_mobile text;
BEGIN
  -- Sanitize input: only allow digits
  sanitized_mobile := regexp_replace(mobile_number, '[^0-9]', '', 'g');
  
  -- Require minimum length for security
  IF length(sanitized_mobile) < 10 THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT au.email::TEXT
  FROM auth.users au
  INNER JOIN public.profiles p ON p.user_id = au.id
  WHERE regexp_replace(p.mobile, '[^0-9]', '', 'g') = sanitized_mobile
  LIMIT 1;
END;
$function$;

-- 2. Remove direct INSERT policy from points_history for regular users
DROP POLICY IF EXISTS "Users can insert their own points history" ON public.points_history;

-- 3. Create a secure function to award points (only called after verified actions)
CREATE OR REPLACE FUNCTION public.award_upload_points(
  p_user_id uuid,
  p_action text,
  p_description text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  points_to_award integer := 50;
  valid_action boolean := false;
  recent_upload_exists boolean := false;
BEGIN
  -- Only allow specific valid actions
  IF p_action NOT IN ('note_upload', 'paper_upload') THEN
    RETURN false;
  END IF;
  
  -- Verify the user exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = p_user_id) THEN
    RETURN false;
  END IF;

  -- Check if there's a recent upload (within last 5 minutes) that hasn't been awarded points yet
  IF p_action = 'note_upload' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.notes n
      WHERE n.user_id = p_user_id
      AND n.created_at > now() - interval '5 minutes'
      AND NOT EXISTS (
        SELECT 1 FROM public.points_history ph
        WHERE ph.user_id = p_user_id
        AND ph.action = 'note_upload'
        AND ph.created_at > n.created_at - interval '1 minute'
        AND ph.created_at < n.created_at + interval '1 minute'
      )
    ) INTO recent_upload_exists;
  ELSIF p_action = 'paper_upload' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.papers p
      WHERE p.user_id = p_user_id
      AND p.created_at > now() - interval '5 minutes'
      AND NOT EXISTS (
        SELECT 1 FROM public.points_history ph
        WHERE ph.user_id = p_user_id
        AND ph.action = 'paper_upload'
        AND ph.created_at > p.created_at - interval '1 minute'
        AND ph.created_at < p.created_at + interval '1 minute'
      )
    ) INTO recent_upload_exists;
  END IF;

  IF NOT recent_upload_exists THEN
    RETURN false;
  END IF;

  -- Insert points history record
  INSERT INTO public.points_history (user_id, points, action, description)
  VALUES (p_user_id, points_to_award, p_action, p_description);

  -- Update user's total points
  UPDATE public.profiles
  SET points = points + points_to_award
  WHERE user_id = p_user_id;

  RETURN true;
END;
$$;

-- 4. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.award_upload_points(uuid, text, text) TO authenticated;


-- ========================================
-- Migration: 20260131082754_ca68b32b-9a8e-4ca1-b57e-42af5f3aa330.sql
-- ========================================
-- Make storage buckets private to prevent direct access to unapproved files
UPDATE storage.buckets SET public = false WHERE id = 'papers';
UPDATE storage.buckets SET public = false WHERE id = 'notes';

-- Drop old public SELECT policies
DROP POLICY IF EXISTS "Anyone can view papers" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view notes" ON storage.objects;

-- Create new policies that only allow authenticated users to access files
-- The edge function will validate approval status before generating signed URLs

-- Papers bucket: Allow authenticated users to upload and owners to delete
CREATE POLICY "Authenticated users can download papers"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'papers');

-- Notes bucket: Allow authenticated users to upload and owners to delete  
CREATE POLICY "Authenticated users can download notes"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'notes');


-- ========================================
-- Migration: 20260201134019_c996b9ce-a673-478d-ba4a-99c4136cdcce.sql
-- ========================================
-- First, drop and recreate the SELECT policy to ensure it requires authentication
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create a new policy that explicitly requires authentication AND ownership
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Also add admin access policy so admins can view all profiles if needed
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));


-- ========================================
-- Migration: 20260203060537_ea3a6538-6bff-4c83-a090-4096466d808f.sql
-- ========================================
-- Create function to deduct points when paper is deleted
CREATE OR REPLACE FUNCTION public.deduct_upload_points_on_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  points_to_deduct integer := 50;
  action_type text;
BEGIN
  -- Determine action type based on table
  IF TG_TABLE_NAME = 'papers' THEN
    action_type := 'paper_upload';
  ELSIF TG_TABLE_NAME = 'notes' THEN
    action_type := 'note_upload';
  ELSE
    RETURN OLD;
  END IF;

  -- Record the points deduction in history
  INSERT INTO public.points_history (user_id, points, action, description)
  VALUES (OLD.user_id, -points_to_deduct, action_type || '_deleted', 'Deleted: ' || OLD.title);

  -- Deduct from user's total points (ensure it doesn't go below 0)
  UPDATE public.profiles
  SET points = GREATEST(0, points - points_to_deduct)
  WHERE user_id = OLD.user_id;

  RETURN OLD;
END;
$function$;

-- Create trigger for papers table
CREATE TRIGGER deduct_points_on_paper_delete
  BEFORE DELETE ON public.papers
  FOR EACH ROW
  EXECUTE FUNCTION public.deduct_upload_points_on_delete();

-- Create trigger for notes table
CREATE TRIGGER deduct_points_on_note_delete
  BEFORE DELETE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.deduct_upload_points_on_delete();


-- ========================================
-- Migration: 20260203060936_9caea889-f935-405d-9b8a-edc07bf7f3a7.sql
-- ========================================
-- Add explicit policies to deny unauthenticated access to profiles table
CREATE POLICY "Deny unauthenticated access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- Add explicit policies to deny unauthenticated access to points_history table
CREATE POLICY "Deny unauthenticated access to points_history"
ON public.points_history
FOR SELECT
TO anon
USING (false);


-- ========================================
-- Migration: 20260203061026_dfa68538-8d25-4c67-82cf-5f8f1fb17ac6.sql
-- ========================================
-- Add explicit policies to deny unauthenticated access to support_tickets table
CREATE POLICY "Deny unauthenticated access to support_tickets"
ON public.support_tickets
FOR SELECT
TO anon
USING (false);

-- Add explicit policies to deny unauthenticated access to feedback table
CREATE POLICY "Deny unauthenticated access to feedback"
ON public.feedback
FOR SELECT
TO anon
USING (false);

-- Add explicit policies to deny unauthenticated access to user_roles table
CREATE POLICY "Deny unauthenticated access to user_roles"
ON public.user_roles
FOR SELECT
TO anon
USING (false);


-- ========================================
-- Migration: 20260210055354_62b5f240-55d9-4ccd-ab2b-46f644c1bf2b.sql
-- ========================================

CREATE OR REPLACE FUNCTION public.award_upload_points(p_user_id uuid, p_action text, p_description text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  points_to_award integer;
  recent_upload_exists boolean := false;
BEGIN
  -- Determine points based on action type
  IF p_action = 'paper_upload' THEN
    points_to_award := 20;
  ELSIF p_action = 'note_upload' THEN
    points_to_award := 25;
  ELSE
    RETURN false;
  END IF;
  
  -- Verify the user exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = p_user_id) THEN
    RETURN false;
  END IF;

  -- Check if there's a recent upload (within last 5 minutes) that hasn't been awarded points yet
  IF p_action = 'note_upload' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.notes n
      WHERE n.user_id = p_user_id
      AND n.created_at > now() - interval '5 minutes'
      AND NOT EXISTS (
        SELECT 1 FROM public.points_history ph
        WHERE ph.user_id = p_user_id
        AND ph.action = 'note_upload'
        AND ph.created_at > n.created_at - interval '1 minute'
        AND ph.created_at < n.created_at + interval '1 minute'
      )
    ) INTO recent_upload_exists;
  ELSIF p_action = 'paper_upload' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.papers p
      WHERE p.user_id = p_user_id
      AND p.created_at > now() - interval '5 minutes'
      AND NOT EXISTS (
        SELECT 1 FROM public.points_history ph
        WHERE ph.user_id = p_user_id
        AND ph.action = 'paper_upload'
        AND ph.created_at > p.created_at - interval '1 minute'
        AND ph.created_at < p.created_at + interval '1 minute'
      )
    ) INTO recent_upload_exists;
  END IF;

  IF NOT recent_upload_exists THEN
    RETURN false;
  END IF;

  -- Insert points history record
  INSERT INTO public.points_history (user_id, points, action, description)
  VALUES (p_user_id, points_to_award, p_action, p_description);

  -- Update user's total points
  UPDATE public.profiles
  SET points = points + points_to_award
  WHERE user_id = p_user_id;

  RETURN true;
END;
$function$;

-- Also update the deduction trigger to match new values
CREATE OR REPLACE FUNCTION public.deduct_upload_points_on_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  points_to_deduct integer;
  action_type text;
BEGIN
  IF TG_TABLE_NAME = 'papers' THEN
    points_to_deduct := 20;
    action_type := 'paper_upload';
  ELSIF TG_TABLE_NAME = 'notes' THEN
    points_to_deduct := 25;
    action_type := 'note_upload';
  ELSE
    RETURN OLD;
  END IF;

  INSERT INTO public.points_history (user_id, points, action, description)
  VALUES (OLD.user_id, -points_to_deduct, action_type || '_deleted', 'Deleted: ' || OLD.title);

  UPDATE public.profiles
  SET points = GREATEST(0, points - points_to_deduct)
  WHERE user_id = OLD.user_id;

  RETURN OLD;
END;
$function$;



-- ========================================
-- Migration: 20260315170000_mobile_lookup_rate_limit.sql
-- ========================================
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Mobile-lookup rate limiting
--
-- Adds a per-mobile call counter to the get_user_email_by_mobile RPC so that
-- an unauthenticated caller cannot enumerate all registered mobile numbers at
-- speed.  The counter allows up to 5 lookups per 15-minute window before
-- returning an empty result set (silent rejection â€” no oracle for the caller).
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- 1. Create a small audit table to track call counts per mobile per window.
CREATE TABLE IF NOT EXISTS public.mobile_lookup_rate_limit (
    mobile          TEXT        NOT NULL,
    window_start    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    attempt_count   INTEGER     NOT NULL DEFAULT 1,
    PRIMARY KEY (mobile, window_start)
);

-- Enable RLS â€” only the SECURITY DEFINER function can write to this table.
ALTER TABLE public.mobile_lookup_rate_limit ENABLE ROW LEVEL SECURITY;

-- No user-facing policies; only server-side SECURITY DEFINER functions access it.

-- 2. Replace the existing get_user_email_by_mobile with rate-limited version.
CREATE OR REPLACE FUNCTION public.get_user_email_by_mobile(mobile_number TEXT)
RETURNS TABLE(email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_window        TIMESTAMP WITH TIME ZONE;
    v_count         INTEGER;
    v_max_attempts  CONSTANT INTEGER := 5;
    v_window_mins   CONSTANT INTEGER := 15;
BEGIN
    -- Round down to the nearest 15-minute window.
    v_window := date_trunc('hour', now()) +
                INTERVAL '15 minutes' *
                FLOOR(EXTRACT(MINUTE FROM now()) / v_window_mins);

    -- Upsert the attempt counter for this mobile + window.
    INSERT INTO public.mobile_lookup_rate_limit (mobile, window_start, attempt_count)
    VALUES (mobile_number, v_window, 1)
    ON CONFLICT (mobile, window_start)
    DO UPDATE SET attempt_count = mobile_lookup_rate_limit.attempt_count + 1
    RETURNING attempt_count INTO v_count;

    -- If the caller has exceeded the limit, return nothing silently.
    IF v_count > v_max_attempts THEN
        RETURN;
    END IF;

    -- Return the email for the given mobile number.
    RETURN QUERY
        SELECT au.email::TEXT
        FROM auth.users AS au
        JOIN public.profiles AS p ON p.user_id = au.id
        WHERE p.mobile = mobile_number
        LIMIT 1;
END;
$$;

-- 3. Scheduled clean-up: remove rows older than 1 hour to keep the table small.
--    (Run manually or via a pg_cron job; we provide the function here.)
CREATE OR REPLACE FUNCTION public.cleanup_mobile_lookup_rate_limit()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    DELETE FROM public.mobile_lookup_rate_limit
    WHERE window_start < now() - INTERVAL '1 hour';
$$;



