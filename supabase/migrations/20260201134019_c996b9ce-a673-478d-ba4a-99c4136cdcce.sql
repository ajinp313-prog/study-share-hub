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