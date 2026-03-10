/*
  # Create atomic organization + profile setup function

  1. New Functions
    - `create_org_and_profile(org_name text, user_full_name text, user_email text)`
      - SECURITY DEFINER function that bypasses RLS
      - Creates an organization row
      - Creates a user_profile row linking the calling user to the new org
      - Returns the newly created organization as JSON
      - Runs atomically in a single transaction to prevent partial data

  2. Why This Is Needed
    - During signup, the user has no profile yet, so `get_user_org_id()` returns NULL
    - The SELECT RLS policy on `organizations` uses `get_user_org_id()`, which blocks
      the RETURNING clause of an INSERT...SELECT chain
    - This SECURITY DEFINER function bypasses RLS to perform both inserts atomically
*/

CREATE OR REPLACE FUNCTION public.create_org_and_profile(
  org_name text,
  user_full_name text,
  user_email text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org organizations%ROWTYPE;
  calling_user_id uuid := auth.uid();
BEGIN
  IF calling_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM user_profiles WHERE id = calling_user_id) THEN
    RAISE EXCEPTION 'User profile already exists';
  END IF;

  INSERT INTO organizations (name)
  VALUES (org_name)
  RETURNING * INTO new_org;

  INSERT INTO user_profiles (id, organization_id, role, full_name, email)
  VALUES (calling_user_id, new_org.id, 'admin', user_full_name, user_email);

  RETURN row_to_json(new_org);
END;
$$;
