/*
  # Create state registration documents table and storage bucket

  1. New Tables
    - `state_registration_documents`
      - `id` (uuid, primary key) - Unique document identifier
      - `state_registration_id` (uuid, FK) - References the parent state registration
      - `organization_id` (uuid, FK) - References the owning organization
      - `file_name` (text) - Original file name
      - `file_path` (text) - Path within storage bucket
      - `file_size` (bigint) - File size in bytes
      - `content_type` (text) - MIME type of the file
      - `uploaded_by` (uuid) - User who uploaded the file
      - `created_at` (timestamptz) - Upload timestamp

  2. Security
    - Enable RLS on `state_registration_documents` table
    - SELECT: All org members can view documents for their org
    - INSERT: Admin/finance roles can upload documents
    - DELETE: Admin/finance roles can delete documents

  3. Storage
    - Create private `state-documents` bucket with 10MB file size limit
    - Storage policies scoped to organization paths
*/

CREATE TABLE IF NOT EXISTS state_registration_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_registration_id uuid NOT NULL REFERENCES states_registered(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  content_type text NOT NULL DEFAULT '',
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_state_reg_docs_registration
  ON state_registration_documents(state_registration_id);

CREATE INDEX IF NOT EXISTS idx_state_reg_docs_org
  ON state_registration_documents(organization_id);

ALTER TABLE state_registration_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view state registration documents"
  ON state_registration_documents
  FOR SELECT
  TO authenticated
  USING (organization_id = get_user_org_id());

CREATE POLICY "Admin/finance can insert state registration documents"
  ON state_registration_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = get_user_org_id()
    AND get_user_role() IN ('admin', 'finance')
  );

CREATE POLICY "Admin/finance can delete state registration documents"
  ON state_registration_documents
  FOR DELETE
  TO authenticated
  USING (
    organization_id = get_user_org_id()
    AND get_user_role() IN ('admin', 'finance')
  );

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('state-documents', 'state-documents', false, 10485760)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Org members can read state documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'state-documents'
    AND (storage.foldername(name))[1] = get_user_org_id()::text
  );

CREATE POLICY "Admin/finance can upload state documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'state-documents'
    AND (storage.foldername(name))[1] = get_user_org_id()::text
    AND get_user_role() IN ('admin', 'finance')
  );

CREATE POLICY "Admin/finance can delete state documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'state-documents'
    AND (storage.foldername(name))[1] = get_user_org_id()::text
    AND get_user_role() IN ('admin', 'finance')
  );
