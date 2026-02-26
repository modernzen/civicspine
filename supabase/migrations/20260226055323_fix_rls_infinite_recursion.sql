/*
  # Fix RLS Infinite Recursion (500 Errors)

  ## Problem
  The `user_profiles` SELECT policy sub-queries `user_profiles` itself,
  causing infinite recursion. Every other table's policies also sub-query
  `user_profiles`, which triggers the same recursive loop.

  ## Solution
  1. Create two SECURITY DEFINER helper functions that bypass RLS:
     - `get_user_org_id()` — returns the current user's organization_id
     - `get_user_role()` — returns the current user's role
  2. Drop ALL existing RLS policies on all tables
  3. Recreate all policies using the helper functions instead of sub-queries

  ## Security
  - Helper functions are SECURITY DEFINER with restricted search_path
  - All policies remain scoped to authenticated users
  - Role-based restrictions preserved (admin, finance, grants)
  - No change to table structures or data
*/

-- ============================================
-- 1. Create SECURITY DEFINER helper functions
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid()
$$;

-- ============================================
-- 2. Drop ALL existing policies
-- ============================================

-- organizations
DROP POLICY IF EXISTS "Users can view own organization" ON organizations;
DROP POLICY IF EXISTS "Users can update own organization" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;

-- user_profiles
DROP POLICY IF EXISTS "Users can view profiles in own org" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- compliance_tasks
DROP POLICY IF EXISTS "Users can view org compliance tasks" ON compliance_tasks;
DROP POLICY IF EXISTS "Admin/finance can insert compliance tasks" ON compliance_tasks;
DROP POLICY IF EXISTS "Admin/finance can update compliance tasks" ON compliance_tasks;
DROP POLICY IF EXISTS "Admin can delete compliance tasks" ON compliance_tasks;

-- states_registered
DROP POLICY IF EXISTS "Users can view org state registrations" ON states_registered;
DROP POLICY IF EXISTS "Admin/finance can insert state registrations" ON states_registered;
DROP POLICY IF EXISTS "Admin/finance can update state registrations" ON states_registered;
DROP POLICY IF EXISTS "Admin can delete state registrations" ON states_registered;

-- board_members
DROP POLICY IF EXISTS "Users can view org board members" ON board_members;
DROP POLICY IF EXISTS "Admin can insert board members" ON board_members;
DROP POLICY IF EXISTS "Admin can update board members" ON board_members;
DROP POLICY IF EXISTS "Admin can delete board members" ON board_members;

-- grants
DROP POLICY IF EXISTS "Users can view org grants" ON grants;
DROP POLICY IF EXISTS "Admin/grants can insert grants" ON grants;
DROP POLICY IF EXISTS "Admin/grants can update grants" ON grants;
DROP POLICY IF EXISTS "Admin can delete grants" ON grants;

-- donations
DROP POLICY IF EXISTS "Users can view org donations" ON donations;
DROP POLICY IF EXISTS "Admin/finance can insert donations" ON donations;
DROP POLICY IF EXISTS "Admin/finance can update donations" ON donations;
DROP POLICY IF EXISTS "Admin can delete donations" ON donations;

-- audit_log
DROP POLICY IF EXISTS "Users can view org audit log" ON audit_log;
DROP POLICY IF EXISTS "System can insert audit log entries" ON audit_log;

-- ============================================
-- 3. Recreate ALL policies using helper functions
-- ============================================

-- organizations
CREATE POLICY "Users can view own organization"
  ON organizations FOR SELECT
  TO authenticated
  USING (id = public.get_user_org_id());

CREATE POLICY "Admins can update own organization"
  ON organizations FOR UPDATE
  TO authenticated
  USING (id = public.get_user_org_id() AND public.get_user_role() = 'admin')
  WITH CHECK (id = public.get_user_org_id() AND public.get_user_role() = 'admin');

CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- user_profiles
CREATE POLICY "Users can view profiles in own org"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR organization_id = public.get_user_org_id());

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- compliance_tasks
CREATE POLICY "Users can view org compliance tasks"
  ON compliance_tasks FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "Admin/finance can insert compliance tasks"
  ON compliance_tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.get_user_org_id()
    AND public.get_user_role() IN ('admin', 'finance')
  );

CREATE POLICY "Admin/finance can update compliance tasks"
  ON compliance_tasks FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND public.get_user_role() IN ('admin', 'finance')
  )
  WITH CHECK (
    organization_id = public.get_user_org_id()
    AND public.get_user_role() IN ('admin', 'finance')
  );

CREATE POLICY "Admin can delete compliance tasks"
  ON compliance_tasks FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND public.get_user_role() = 'admin'
  );

-- states_registered
CREATE POLICY "Users can view org state registrations"
  ON states_registered FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "Admin/finance can insert state registrations"
  ON states_registered FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.get_user_org_id()
    AND public.get_user_role() IN ('admin', 'finance')
  );

CREATE POLICY "Admin/finance can update state registrations"
  ON states_registered FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND public.get_user_role() IN ('admin', 'finance')
  )
  WITH CHECK (
    organization_id = public.get_user_org_id()
    AND public.get_user_role() IN ('admin', 'finance')
  );

CREATE POLICY "Admin can delete state registrations"
  ON states_registered FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND public.get_user_role() = 'admin'
  );

-- board_members
CREATE POLICY "Users can view org board members"
  ON board_members FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "Admin can insert board members"
  ON board_members FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.get_user_org_id()
    AND public.get_user_role() = 'admin'
  );

CREATE POLICY "Admin can update board members"
  ON board_members FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND public.get_user_role() = 'admin'
  )
  WITH CHECK (
    organization_id = public.get_user_org_id()
    AND public.get_user_role() = 'admin'
  );

CREATE POLICY "Admin can delete board members"
  ON board_members FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND public.get_user_role() = 'admin'
  );

-- grants
CREATE POLICY "Users can view org grants"
  ON grants FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "Admin/grants can insert grants"
  ON grants FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.get_user_org_id()
    AND public.get_user_role() IN ('admin', 'grants')
  );

CREATE POLICY "Admin/grants can update grants"
  ON grants FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND public.get_user_role() IN ('admin', 'grants')
  )
  WITH CHECK (
    organization_id = public.get_user_org_id()
    AND public.get_user_role() IN ('admin', 'grants')
  );

CREATE POLICY "Admin can delete grants"
  ON grants FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND public.get_user_role() = 'admin'
  );

-- donations
CREATE POLICY "Users can view org donations"
  ON donations FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "Admin/finance can insert donations"
  ON donations FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.get_user_org_id()
    AND public.get_user_role() IN ('admin', 'finance')
  );

CREATE POLICY "Admin/finance can update donations"
  ON donations FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND public.get_user_role() IN ('admin', 'finance')
  )
  WITH CHECK (
    organization_id = public.get_user_org_id()
    AND public.get_user_role() IN ('admin', 'finance')
  );

CREATE POLICY "Admin can delete donations"
  ON donations FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND public.get_user_role() = 'admin'
  );

-- audit_log
CREATE POLICY "Users can view org audit log"
  ON audit_log FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "Authenticated users can insert audit log"
  ON audit_log FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());