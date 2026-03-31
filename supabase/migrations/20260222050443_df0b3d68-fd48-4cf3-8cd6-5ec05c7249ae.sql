
-- Create a papers_public view that excludes user_id (matching notes_public pattern)
CREATE OR REPLACE VIEW public.papers_public
WITH (security_invoker = on)
AS
SELECT
  id,
  title,
  description,
  subject,
  level,
  university,
  year,
  file_size,
  downloads,
  file_path,
  status,
  created_at,
  updated_at
FROM public.papers;
