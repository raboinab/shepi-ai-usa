-- Migration: Fix missing category field in Chart of Accounts for existing projects
-- This derives the category from the stored accountType field

CREATE OR REPLACE FUNCTION fix_coa_categories()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_record RECORD;
  updated_wizard_data jsonb;
  account_obj jsonb;
  account_type text;
  normalized_type text;
  derived_category text;
  fs_type text;
  updated_accounts jsonb;
  i int;
BEGIN
  -- Process each project that has chartOfAccounts data
  FOR project_record IN 
    SELECT id, wizard_data 
    FROM projects 
    WHERE wizard_data->'chartOfAccounts'->'accounts' IS NOT NULL
      AND jsonb_array_length(wizard_data->'chartOfAccounts'->'accounts') > 0
  LOOP
    updated_accounts := '[]'::jsonb;
    
    -- Process each account
    FOR i IN 0..jsonb_array_length(project_record.wizard_data->'chartOfAccounts'->'accounts') - 1
    LOOP
      account_obj := project_record.wizard_data->'chartOfAccounts'->'accounts'->i;
      account_type := COALESCE(account_obj->>'accountType', '');
      
      -- Normalize: lowercase and replace underscores with spaces
      normalized_type := lower(replace(account_type, '_', ' '));
      
      -- Determine fsType first (for default category fallback)
      IF normalized_type LIKE '%bank%' 
         OR normalized_type LIKE '%accounts receivable%'
         OR normalized_type LIKE '%other current asset%'
         OR normalized_type LIKE '%current asset%'
         OR normalized_type LIKE '%fixed asset%'
         OR normalized_type LIKE '%other asset%'
         OR normalized_type LIKE '%accounts payable%'
         OR normalized_type LIKE '%credit card%'
         OR normalized_type LIKE '%other current liability%'
         OR normalized_type LIKE '%current liability%'
         OR normalized_type LIKE '%long term liability%'
         OR normalized_type LIKE '%equity%' THEN
        fs_type := 'BS';
      ELSE
        fs_type := 'IS';
      END IF;
      
      -- Derive category from accountType
      IF normalized_type LIKE '%bank%' 
         OR normalized_type LIKE '%accounts receivable%' 
         OR normalized_type LIKE '%other current asset%' THEN
        derived_category := 'Current Assets';
      ELSIF normalized_type LIKE '%fixed asset%' THEN
        derived_category := 'Fixed Assets';
      ELSIF normalized_type LIKE '%other asset%' 
            OR (normalized_type LIKE '%asset%' AND normalized_type NOT LIKE '%current%') THEN
        derived_category := 'Other Assets';
      ELSIF normalized_type LIKE '%accounts payable%' 
            OR normalized_type LIKE '%credit card%' 
            OR normalized_type LIKE '%other current liability%' THEN
        derived_category := 'Current Liabilities';
      ELSIF normalized_type LIKE '%long term liability%' 
            OR (normalized_type LIKE '%liability%' AND normalized_type NOT LIKE '%current%') THEN
        derived_category := 'Long-Term Liabilities';
      ELSIF normalized_type LIKE '%equity%' THEN
        derived_category := 'Equity';
      ELSIF normalized_type LIKE '%income%' OR normalized_type LIKE '%revenue%' THEN
        derived_category := 'Revenue';
      ELSIF normalized_type LIKE '%cost of goods%' OR normalized_type LIKE '%cogs%' THEN
        derived_category := 'COGS';
      ELSIF normalized_type LIKE '%expense%' THEN
        derived_category := 'Operating Expenses';
      ELSIF normalized_type LIKE '%other income%' OR normalized_type LIKE '%other expense%' THEN
        derived_category := 'Other Income';
      ELSE
        -- Default based on FS type
        IF fs_type = 'BS' THEN
          derived_category := 'Other Assets';
        ELSE
          derived_category := 'Operating Expenses';
        END IF;
      END IF;
      
      -- Update account with derived category (only if missing or empty)
      IF account_obj->>'category' IS NULL OR account_obj->>'category' = '' THEN
        account_obj := account_obj || jsonb_build_object('category', derived_category);
      END IF;
      
      updated_accounts := updated_accounts || jsonb_build_array(account_obj);
    END LOOP;
    
    -- Update the project with the fixed accounts
    updated_wizard_data := project_record.wizard_data || 
      jsonb_build_object('chartOfAccounts', 
        (project_record.wizard_data->'chartOfAccounts') || 
        jsonb_build_object('accounts', updated_accounts)
      );
    
    UPDATE projects 
    SET wizard_data = updated_wizard_data,
        updated_at = now()
    WHERE id = project_record.id;
    
    RAISE NOTICE 'Fixed categories for project %', project_record.id;
  END LOOP;
END;
$$;

-- Execute the fix
SELECT fix_coa_categories();

-- Clean up
DROP FUNCTION IF EXISTS fix_coa_categories();