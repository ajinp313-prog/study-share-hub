-- Create notes table
CREATE TABLE public.notes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL,
    level TEXT NOT NULL,
    chapter_topic TEXT,
    university TEXT,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    downloads INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notes
CREATE POLICY "Users can upload their own notes"
ON public.notes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own notes"
ON public.notes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
ON public.notes FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
ON public.notes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view approved notes"
ON public.notes FOR SELECT
USING (status = 'approved');

CREATE POLICY "Admins can view all notes"
ON public.notes FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update any note"
ON public.notes FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_notes_updated_at
BEFORE UPDATE ON public.notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to increment note download count
CREATE OR REPLACE FUNCTION public.increment_note_download_count(note_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE notes 
  SET downloads = downloads + 1 
  WHERE id = note_id AND status = 'approved';
END;
$$;

-- Create notes storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('notes', 'notes', true);

-- Storage policies for notes bucket
CREATE POLICY "Anyone can view notes files"
ON storage.objects FOR SELECT
USING (bucket_id = 'notes');

CREATE POLICY "Authenticated users can upload notes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'notes' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own notes files"
ON storage.objects FOR DELETE
USING (bucket_id = 'notes' AND auth.uid()::text = (storage.foldername(name))[1]);