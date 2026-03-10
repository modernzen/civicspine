/*
  # Create Filing Drafts Tables for AI-Powered 990 Preparation

  1. New Tables
    - `filing_drafts` - Tracks each 990 filing session
      - `id` (uuid, primary key)
      - `organization_id` (uuid, references organizations)
      - `fiscal_year` (integer) - The fiscal year this filing covers
      - `form_type` (text) - 990-N, 990-EZ, or 990
      - `status` (text) - draft, in_review, approved, filed
      - `current_step` (integer) - Tracks wizard progress (0-based)
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `filing_draft_sections` - Stores each section's structured data
      - `id` (uuid, primary key)
      - `draft_id` (uuid, references filing_drafts)
      - `section_key` (text) - e.g. org_info, revenue, expenses, officers, mission, governance, financial_statements
      - `data` (jsonb) - User-entered structured data for this section
      - `ai_generated` (jsonb) - AI-generated suggestions/content for this section
      - `status` (text) - not_started, in_progress, ai_drafted, reviewed
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - RLS enabled on both tables
    - Scoped to organization_id via get_user_org_id()
    - Admin/finance can create and modify drafts
    - All org members can view drafts

  3. Indexes
    - draft_id + section_key unique constraint on filing_draft_sections
    - organization_id index on filing_drafts
    - status index on filing_drafts
*/

-- Filing drafts table
CREATE TABLE IF NOT EXISTS filing_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  fiscal_year integer NOT NULL,
  form_type text NOT NULL DEFAULT '990-N',
  status text NOT NULL DEFAULT 'draft',
  current_step integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE filing_drafts ENABLE ROW LEVEL SECURITY;

-- Filing draft sections table
CREATE TABLE IF NOT EXISTS filing_draft_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id uuid NOT NULL REFERENCES filing_drafts(id) ON DELETE CASCADE,
  section_key text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_generated jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'not_started',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(draft_id, section_key)
);

ALTER TABLE filing_draft_sections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for filing_drafts

CREATE POLICY "Users can view org filing drafts"
  ON filing_drafts FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "Admin/finance can insert filing drafts"
  ON filing_drafts FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.get_user_org_id()
    AND public.get_user_role() IN ('admin', 'finance')
  );

CREATE POLICY "Admin/finance can update filing drafts"
  ON filing_drafts FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND public.get_user_role() IN ('admin', 'finance')
  )
  WITH CHECK (
    organization_id = public.get_user_org_id()
    AND public.get_user_role() IN ('admin', 'finance')
  );

CREATE POLICY "Admin can delete filing drafts"
  ON filing_drafts FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND public.get_user_role() = 'admin'
  );

-- RLS Policies for filing_draft_sections (scoped via draft's organization)

CREATE POLICY "Users can view org filing draft sections"
  ON filing_draft_sections FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM filing_drafts
      WHERE filing_drafts.id = filing_draft_sections.draft_id
      AND filing_drafts.organization_id = public.get_user_org_id()
    )
  );

CREATE POLICY "Admin/finance can insert filing draft sections"
  ON filing_draft_sections FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM filing_drafts
      WHERE filing_drafts.id = filing_draft_sections.draft_id
      AND filing_drafts.organization_id = public.get_user_org_id()
      AND public.get_user_role() IN ('admin', 'finance')
    )
  );

CREATE POLICY "Admin/finance can update filing draft sections"
  ON filing_draft_sections FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM filing_drafts
      WHERE filing_drafts.id = filing_draft_sections.draft_id
      AND filing_drafts.organization_id = public.get_user_org_id()
      AND public.get_user_role() IN ('admin', 'finance')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM filing_drafts
      WHERE filing_drafts.id = filing_draft_sections.draft_id
      AND filing_drafts.organization_id = public.get_user_org_id()
      AND public.get_user_role() IN ('admin', 'finance')
    )
  );

CREATE POLICY "Admin can delete filing draft sections"
  ON filing_draft_sections FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM filing_drafts
      WHERE filing_drafts.id = filing_draft_sections.draft_id
      AND filing_drafts.organization_id = public.get_user_org_id()
      AND public.get_user_role() = 'admin'
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_filing_drafts_org ON filing_drafts(organization_id);
CREATE INDEX IF NOT EXISTS idx_filing_drafts_status ON filing_drafts(status);
CREATE INDEX IF NOT EXISTS idx_filing_draft_sections_draft ON filing_draft_sections(draft_id);
