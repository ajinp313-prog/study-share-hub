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