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