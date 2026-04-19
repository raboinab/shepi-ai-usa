-- Fix Chart of Accounts account numbers and names from processed_data source
-- This migration re-extracts Id (for accountNumber) and Name (for accountName) 
-- from the original QuickBooks data stored in processed_data

CREATE OR REPLACE FUNCTION fix_coa_account_numbers_and_names()
RETURNS void AS $$
DECLARE
  proj RECORD;
  pd_record RECORD;
  raw_accounts JSONB;
  accounts JSONB;
  updated_accounts JSONB;
  acc JSONB;
  raw_acc JSONB;
  account_id TEXT;
  new_account_number TEXT;
  new_account_name TEXT;
  raw_id TEXT;
  raw_acct_num TEXT;
  raw_name TEXT;
  i INTEGER;
  j INTEGER;
  match_found BOOLEAN;
BEGIN
  -- Process each project that has chart of accounts data
  FOR proj IN 
    SELECT id, wizard_data 
    FROM projects 
    WHERE wizard_data->'chartOfAccounts'->'accounts' IS NOT NULL
      AND jsonb_array_length(wizard_data->'chartOfAccounts'->'accounts') > 0
  LOOP
    accounts := proj.wizard_data->'chartOfAccounts'->'accounts';
    updated_accounts := '[]'::jsonb;
    
    -- Get the latest chart_of_accounts processed_data for this project
    SELECT data INTO raw_accounts
    FROM processed_data
    WHERE project_id = proj.id
      AND data_type = 'chart_of_accounts'
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Extract raw accounts from various possible locations in the JSON
    IF raw_accounts IS NOT NULL THEN
      -- Handle QueryResponse.Account format from QuickBooks API
      IF raw_accounts->'QueryResponse'->'Account' IS NOT NULL THEN
        raw_accounts := raw_accounts->'QueryResponse'->'Account';
      -- Handle accounts array format
      ELSIF raw_accounts->'accounts' IS NOT NULL THEN
        raw_accounts := raw_accounts->'accounts';
      ELSIF raw_accounts->'Accounts' IS NOT NULL THEN
        raw_accounts := raw_accounts->'Accounts';
      END IF;
    END IF;
    
    -- Process each account in wizard_data
    FOR i IN 0..jsonb_array_length(accounts)-1 LOOP
      acc := accounts->i;
      account_id := acc->>'accountId';
      new_account_number := acc->>'accountNumber';
      new_account_name := acc->>'accountName';
      
      -- Try to find matching raw account to get correct Id and Name
      IF raw_accounts IS NOT NULL AND jsonb_typeof(raw_accounts) = 'array' THEN
        match_found := FALSE;
        
        FOR j IN 0..jsonb_array_length(raw_accounts)-1 LOOP
          raw_acc := raw_accounts->j;
          raw_id := COALESCE(raw_acc->>'Id', raw_acc->>'id', '');
          
          -- Match by account ID
          IF raw_id != '' AND raw_id = account_id THEN
            match_found := TRUE;
            
            -- Get account number: prefer AcctNum, fallback to Id
            raw_acct_num := COALESCE(
              NULLIF(raw_acc->>'AcctNum', ''),
              NULLIF(raw_acc->>'acctNum', ''),
              NULLIF(raw_acc->>'accountNumber', ''),
              NULLIF(raw_acc->>'number', ''),
              raw_id
            );
            
            -- Get account name: prefer Name, use fullyQualifiedName as fallback
            raw_name := COALESCE(
              NULLIF(raw_acc->>'Name', ''),
              NULLIF(raw_acc->>'name', ''),
              NULLIF(raw_acc->>'accountName', ''),
              NULLIF(raw_acc->>'FullyQualifiedName', ''),
              NULLIF(raw_acc->>'fullyQualifiedName', ''),
              new_account_name
            );
            
            -- Update if we found better values
            IF raw_acct_num IS NOT NULL AND raw_acct_num != '' THEN
              new_account_number := raw_acct_num;
            END IF;
            IF raw_name IS NOT NULL AND raw_name != '' THEN
              new_account_name := raw_name;
            END IF;
            
            EXIT; -- Found match, stop searching
          END IF;
        END LOOP;
        
        -- If no match by accountId, try to match by account name
        IF NOT match_found AND new_account_name IS NOT NULL AND new_account_name != '' THEN
          FOR j IN 0..jsonb_array_length(raw_accounts)-1 LOOP
            raw_acc := raw_accounts->j;
            raw_name := COALESCE(raw_acc->>'Name', raw_acc->>'name', '');
            
            IF LOWER(raw_name) = LOWER(new_account_name) THEN
              raw_id := COALESCE(raw_acc->>'Id', raw_acc->>'id', '');
              raw_acct_num := COALESCE(
                NULLIF(raw_acc->>'AcctNum', ''),
                NULLIF(raw_acc->>'acctNum', ''),
                raw_id
              );
              
              IF raw_acct_num IS NOT NULL AND raw_acct_num != '' THEN
                new_account_number := raw_acct_num;
              END IF;
              
              EXIT;
            END IF;
          END LOOP;
        END IF;
      END IF;
      
      -- Update the account with corrected values
      acc := jsonb_set(acc, '{accountNumber}', to_jsonb(COALESCE(new_account_number, '')));
      acc := jsonb_set(acc, '{accountName}', to_jsonb(COALESCE(new_account_name, '')));
      
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
SELECT fix_coa_account_numbers_and_names();

-- Clean up the function
DROP FUNCTION fix_coa_account_numbers_and_names();