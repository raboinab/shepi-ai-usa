-- Explicitly deny UPDATE operations on project_payments table
-- Payment records should only be created and read, never modified by users
CREATE POLICY "Users cannot update payment records" 
ON public.project_payments 
FOR UPDATE 
USING (false);