UPDATE storage.buckets SET public = true WHERE id = 'event-covers';

DROP POLICY IF EXISTS "Anyone can view event covers" ON storage.objects;
CREATE POLICY "Anyone can view event covers"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'event-covers');
