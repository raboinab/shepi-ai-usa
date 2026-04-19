-- Add unique constraint for project payments upsert
ALTER TABLE project_payments 
ADD CONSTRAINT project_payments_project_user_unique 
UNIQUE (project_id, user_id);