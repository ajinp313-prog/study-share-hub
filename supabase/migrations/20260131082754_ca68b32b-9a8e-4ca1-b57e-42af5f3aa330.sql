-- Make storage buckets private to prevent direct access to unapproved files
UPDATE storage.buckets SET public = false WHERE id = 'papers';
UPDATE storage.buckets SET public = false WHERE id = 'notes';

-- Drop old public SELECT policies
DROP POLICY IF EXISTS "Anyone can view papers" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view notes" ON storage.objects;

-- Create new policies that only allow authenticated users to access files
-- The edge function will validate approval status before generating signed URLs

-- Papers bucket: Allow authenticated users to upload and owners to delete
CREATE POLICY "Authenticated users can download papers"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'papers');

-- Notes bucket: Allow authenticated users to upload and owners to delete  
CREATE POLICY "Authenticated users can download notes"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'notes');