/*
  # Create notifications table

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, FK to organizations)
      - `user_id` (uuid, FK to auth.users, nullable for org-wide notifications)
      - `type` (text: 'deadline_approaching', 'deadline_overdue', 'coi_unsigned', 'ack_pending', 'grant_report_due')
      - `title` (text)
      - `message` (text)
      - `entity_type` (text: 'compliance_task', 'state_registration', 'board_member', 'grant', 'donation')
      - `entity_id` (uuid, nullable)
      - `read` (boolean, default false)
      - `created_at` (timestamptz)
  2. Security
    - Enable RLS on `notifications` table
    - Users can read notifications for their own organization
    - Users can update (mark as read) their own organization's notifications
    - Only system (service role) creates notifications, but we allow authenticated inserts for the org
  3. Indexes
    - Index on organization_id + read for fast unread queries
    - Index on created_at for ordering
*/

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  entity_type text NOT NULL DEFAULT '',
  entity_id uuid,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_notifications_org_read ON notifications(organization_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

CREATE POLICY "Users can read own org notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (organization_id = get_user_org_id());

CREATE POLICY "Users can insert notifications for own org"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "Users can mark own org notifications as read"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());
