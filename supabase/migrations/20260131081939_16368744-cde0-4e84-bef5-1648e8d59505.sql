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