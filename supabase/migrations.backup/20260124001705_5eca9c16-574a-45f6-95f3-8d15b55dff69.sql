-- Create a function to determine correct fsType and fix all existing COA data
CREATE OR REPLACE FUNCTION fix_coa_fstype()
RETURNS void AS $$
DECLARE
  proj RECORD;
  accounts JSONB;
  updated_accounts JSONB;
  acc JSONB;
  account_type TEXT;
  normalized_type TEXT;
  correct_fs_type TEXT;
  i INTEGER;
BEGIN
  FOR proj IN 
    SELECT id, wizard_data 
    FROM projects 
    WHERE wizard_data->'chartOfAccounts'->'accounts' IS NOT NULL
      AND jsonb_array_length(wizard_data->'chartOfAccounts'->'accounts') > 0
  LOOP
    accounts := proj.wizard_data->'chartOfAccounts'->'accounts';
    updated_accounts := '[]'::jsonb;
    
    FOR i IN 0..jsonb_array_length(accounts)-1 LOOP
      acc := accounts->i;
      account_type := acc->>'accountType';
      
      -- Normalize: lowercase and replace underscores with spaces
      normalized_type := LOWER(REPLACE(COALESCE(account_type, ''), '_', ' '));
      
      -- Determine correct fsType based on Balance Sheet patterns
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
         OR normalized_type LIKE '%other liability%'
         OR normalized_type LIKE '%equity%' THEN
        correct_fs_type := 'BS';
      ELSE
        correct_fs_type := 'IS';
      END IF;
      
      -- Update the account with correct fsType
      acc := jsonb_set(acc, '{fsType}', to_jsonb(correct_fs_type));
      updated_accounts := updated_accounts || acc;
    END LOOP;
    
    -- Update the project with fixed accounts
    UPDATE projects 
    SET wizard_data = jsonb_set(
      wizard_data, 
      '{chartOfAccounts,accounts}', 
      updated_accounts
    ),
    updated_at = NOW()
    WHERE id = proj.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the fix
SELECT fix_coa_fstype();

-- Clean up the function
DROP FUNCTION fix_coa_fstype();