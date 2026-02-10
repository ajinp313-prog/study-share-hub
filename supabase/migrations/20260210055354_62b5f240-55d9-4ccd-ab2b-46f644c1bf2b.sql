
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
