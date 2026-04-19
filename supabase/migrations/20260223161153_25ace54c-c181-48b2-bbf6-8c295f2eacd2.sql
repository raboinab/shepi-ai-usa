
-- Add missing DELETE policy for workflows table
CREATE POLICY "Users can delete their own workflows"
ON public.workflows
FOR DELETE
USING (auth.uid() = user_id);

-- Add missing DELETE policy for docuclipper_jobs table
CREATE POLICY "Users can delete their own docuclipper jobs"
ON public.docuclipper_jobs
FOR DELETE
USING (auth.uid() = user_id);
