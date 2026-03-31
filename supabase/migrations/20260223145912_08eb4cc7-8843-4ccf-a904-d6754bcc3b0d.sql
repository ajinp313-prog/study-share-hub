
-- Create download_history table to track user downloads
CREATE TABLE public.download_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('paper', 'note')),
  item_title TEXT NOT NULL,
  item_subject TEXT NOT NULL,
  item_level TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.download_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own download history
CREATE POLICY "Users can view their own downloads"
ON public.download_history
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own downloads
CREATE POLICY "Users can record their own downloads"
ON public.download_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all downloads
CREATE POLICY "Admins can view all downloads"
ON public.download_history
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Deny unauthenticated access
CREATE POLICY "Deny unauthenticated access to download_history"
ON public.download_history
FOR SELECT
USING (false);

-- Index for fast lookups by user
CREATE INDEX idx_download_history_user_id ON public.download_history (user_id, created_at DESC);
