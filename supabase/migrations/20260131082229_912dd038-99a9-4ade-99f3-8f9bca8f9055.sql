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