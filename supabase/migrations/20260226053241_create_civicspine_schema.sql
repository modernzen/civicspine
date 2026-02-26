/*
  # CivicSpine Core Schema

  1. New Tables
    - `organizations` - Nonprofit org profiles with EIN, fiscal year, form type
      - `id` (uuid, primary key)
      - `name` (text) - Organization legal name
      - `ein` (text) - Employer Identification Number
      - `form_990_type` (text) - 990-N, 990-EZ, or 990
      - `fiscal_year_end` (integer) - Month number (1-12)
      - `created_at` (timestamptz)
    
    - `user_profiles` - Users linked to organizations with roles
      - `id` (uuid, primary key, references auth.users)
      - `organization_id` (uuid, references organizations)
      - `role` (text) - admin, board, finance, grants
      - `full_name` (text)
      - `email` (text)
      - `created_at` (timestamptz)

    - `compliance_tasks` - IRS, state, policy, and audit compliance tracking
      - `id` (uuid, primary key)
      - `organization_id` (uuid)
      - `type` (text) - IRS_990, STATE_REGISTRATION, POLICY_REVIEW, AUDIT
      - `title` (text)
      - `jurisdiction` (text)
      - `due_date` (date)
      - `status` (text) - pending, filed, extended, complete
      - `notes` (text)
      - `document_url` (text)
      - `created_at` (timestamptz)

    - `states_registered` - Multi-state charitable registration tracking
      - `id` (uuid, primary key)
      - `organization_id` (uuid)
      - `state` (text)
      - `registration_status` (text)
      - `renewal_due_date` (date)
      - `solicitation_active` (boolean)
      - `document_url` (text)
      - `created_at` (timestamptz)

    - `board_members` - Board member tracking with governance compliance
      - `id` (uuid, primary key)
      - `organization_id` (uuid)
      - `name` (text)
      - `email` (text)
      - `title` (text)
      - `term_start` (date)
      - `term_end` (date)
      - `conflict_of_interest_signed` (boolean)
      - `last_policy_acknowledged_at` (timestamptz)
      - `created_at` (timestamptz)

    - `grants` - Grant tracking with reporting deadlines
      - `id` (uuid, primary key)
      - `organization_id` (uuid)
      - `funder_name` (text)
      - `grant_name` (text)
      - `restricted` (boolean)
      - `amount_awarded` (numeric)
      - `date_awarded` (date)
      - `reporting_due_date` (date)
      - `status` (text) - active, reporting_due, closed, pending
      - `narrative_template_doc_url` (text)
      - `notes` (text)
      - `created_at` (timestamptz)

    - `donations` - Donation records with acknowledgment tracking
      - `id` (uuid, primary key)
      - `organization_id` (uuid)
      - `donor_name` (text)
      - `donor_email` (text)
      - `amount` (numeric)
      - `date_received` (date)
      - `restricted` (boolean)
      - `designation` (text)
      - `acknowledgment_sent` (boolean)
      - `acknowledgment_sent_at` (timestamptz)
      - `created_at` (timestamptz)

    - `audit_log` - Audit trail for key actions
      - `id` (uuid, primary key)
      - `organization_id` (uuid)
      - `user_id` (uuid)
      - `action` (text)
      - `entity_type` (text)
      - `entity_id` (uuid)
      - `details` (jsonb)
      - `created_at` (timestamptz)

  2. Security
    - RLS enabled on ALL tables
    - All policies scoped to organization_id membership
    - Role-based access where applicable
*/

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  ein text DEFAULT '',
  form_990_type text NOT NULL DEFAULT '990-N',
  fiscal_year_end integer NOT NULL DEFAULT 12,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin',
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Compliance tasks table
CREATE TABLE IF NOT EXISTS compliance_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'IRS_990',
  title text NOT NULL DEFAULT '',
  jurisdiction text NOT NULL DEFAULT 'federal',
  due_date date,
  status text NOT NULL DEFAULT 'pending',
  notes text DEFAULT '',
  document_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE compliance_tasks ENABLE ROW LEVEL SECURITY;

-- States registered table
CREATE TABLE IF NOT EXISTS states_registered (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  state text NOT NULL,
  registration_status text NOT NULL DEFAULT 'pending',
  renewal_due_date date,
  solicitation_active boolean NOT NULL DEFAULT false,
  document_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE states_registered ENABLE ROW LEVEL SECURITY;

-- Board members table
CREATE TABLE IF NOT EXISTS board_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text DEFAULT '',
  title text DEFAULT '',
  term_start date,
  term_end date,
  conflict_of_interest_signed boolean NOT NULL DEFAULT false,
  last_policy_acknowledged_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;

-- Grants table
CREATE TABLE IF NOT EXISTS grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  funder_name text NOT NULL,
  grant_name text DEFAULT '',
  restricted boolean NOT NULL DEFAULT false,
  amount_awarded numeric NOT NULL DEFAULT 0,
  date_awarded date,
  reporting_due_date date,
  status text NOT NULL DEFAULT 'pending',
  narrative_template_doc_url text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE grants ENABLE ROW LEVEL SECURITY;

-- Donations table
CREATE TABLE IF NOT EXISTS donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  donor_name text NOT NULL,
  donor_email text DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  date_received date NOT NULL DEFAULT CURRENT_DATE,
  restricted boolean NOT NULL DEFAULT false,
  designation text DEFAULT '',
  acknowledgment_sent boolean NOT NULL DEFAULT false,
  acknowledgment_sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  entity_type text NOT NULL DEFAULT '',
  entity_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Organizations: users can only see their own org
CREATE POLICY "Users can view own organization"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.organization_id = organizations.id
      AND user_profiles.id = auth.uid()
    )
  );

CREATE POLICY "Users can update own organization"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.organization_id = organizations.id
      AND user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.organization_id = organizations.id
      AND user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- User profiles
CREATE POLICY "Users can view profiles in own org"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Compliance tasks: org-scoped
CREATE POLICY "Users can view org compliance tasks"
  ON compliance_tasks FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin/finance can insert compliance tasks"
  ON compliance_tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'finance')
    )
  );

CREATE POLICY "Admin/finance can update compliance tasks"
  ON compliance_tasks FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'finance')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'finance')
    )
  );

CREATE POLICY "Admin can delete compliance tasks"
  ON compliance_tasks FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- States registered: org-scoped
CREATE POLICY "Users can view org state registrations"
  ON states_registered FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin/finance can insert state registrations"
  ON states_registered FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'finance')
    )
  );

CREATE POLICY "Admin/finance can update state registrations"
  ON states_registered FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'finance')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'finance')
    )
  );

CREATE POLICY "Admin can delete state registrations"
  ON states_registered FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Board members: org-scoped
CREATE POLICY "Users can view org board members"
  ON board_members FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin can insert board members"
  ON board_members FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can update board members"
  ON board_members FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can delete board members"
  ON board_members FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Grants: org-scoped
CREATE POLICY "Users can view org grants"
  ON grants FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin/grants can insert grants"
  ON grants FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'grants')
    )
  );

CREATE POLICY "Admin/grants can update grants"
  ON grants FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'grants')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'grants')
    )
  );

CREATE POLICY "Admin can delete grants"
  ON grants FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Donations: org-scoped
CREATE POLICY "Users can view org donations"
  ON donations FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin/finance can insert donations"
  ON donations FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'finance')
    )
  );

CREATE POLICY "Admin/finance can update donations"
  ON donations FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'finance')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'finance')
    )
  );

CREATE POLICY "Admin can delete donations"
  ON donations FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Audit log: org-scoped, read-only for non-admins
CREATE POLICY "Users can view org audit log"
  ON audit_log FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can insert audit log entries"
  ON audit_log FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_org ON user_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_compliance_tasks_org ON compliance_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_compliance_tasks_due ON compliance_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_compliance_tasks_status ON compliance_tasks(status);
CREATE INDEX IF NOT EXISTS idx_states_registered_org ON states_registered(organization_id);
CREATE INDEX IF NOT EXISTS idx_board_members_org ON board_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_grants_org ON grants(organization_id);
CREATE INDEX IF NOT EXISTS idx_grants_status ON grants(status);
CREATE INDEX IF NOT EXISTS idx_donations_org ON donations(organization_id);
CREATE INDEX IF NOT EXISTS idx_donations_ack ON donations(acknowledgment_sent);
CREATE INDEX IF NOT EXISTS idx_audit_log_org ON audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);