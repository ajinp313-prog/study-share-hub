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