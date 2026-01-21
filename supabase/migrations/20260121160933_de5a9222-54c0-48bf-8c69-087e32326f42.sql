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