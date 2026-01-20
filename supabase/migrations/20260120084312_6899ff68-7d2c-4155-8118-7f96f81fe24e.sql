-- Create papers table for uploaded question papers
CREATE TABLE public.papers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL,
    level TEXT NOT NULL,
    university TEXT,
    year INTEGER,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    downloads INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on papers
ALTER TABLE public.papers ENABLE ROW LEVEL SECURITY;

-- Papers RLS policies
CREATE POLICY "Anyone can view approved papers"
ON public.papers FOR SELECT
USING (status = 'approved');

CREATE POLICY "Users can view their own papers"
ON public.papers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can upload papers"
ON public.papers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own papers"
ON public.papers FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own papers"
ON public.papers FOR DELETE
USING (auth.uid() = user_id);

-- Add points column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 0;

-- Create points history table
CREATE TABLE public.points_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    points INTEGER NOT NULL,
    action TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on points_history
ALTER TABLE public.points_history ENABLE ROW LEVEL SECURITY;

-- Points history RLS policies
CREATE POLICY "Users can view their own points history"
ON public.points_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own points history"
ON public.points_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Trigger for papers updated_at
CREATE TRIGGER update_papers_updated_at
BEFORE UPDATE ON public.papers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for papers
INSERT INTO storage.buckets (id, name, public) VALUES ('papers', 'papers', true);

-- Storage policies for papers bucket
CREATE POLICY "Anyone can view papers"
ON storage.objects FOR SELECT
USING (bucket_id = 'papers');

CREATE POLICY "Authenticated users can upload papers"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'papers' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own paper files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'papers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own paper files"
ON storage.objects FOR DELETE
USING (bucket_id = 'papers' AND auth.uid()::text = (storage.foldername(name))[1]);