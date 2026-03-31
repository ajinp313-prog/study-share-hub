
-- Allow admins to delete any paper
CREATE POLICY "Admins can delete any paper"
ON public.papers
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete any note
CREATE POLICY "Admins can delete any note"
ON public.notes
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
