export interface Organization {
  id: string;
  name: string;
  ein: string;
  form_990_type: '990-N' | '990-EZ' | '990';
  fiscal_year_end: number;
  created_at: string;
}

export interface UserProfile {
  id: string;
  organization_id: string;
  role: 'admin' | 'board' | 'finance' | 'grants';
  full_name: string;
  email: string;
  created_at: string;
}

export interface ComplianceTask {
  id: string;
  organization_id: string;
  type: 'IRS_990' | 'STATE_REGISTRATION' | 'POLICY_REVIEW' | 'AUDIT';
  title: string;
  jurisdiction: string;
  due_date: string | null;
  status: 'pending' | 'filed' | 'extended' | 'complete';
  notes: string;
  document_url: string;
  created_at: string;
}

export interface StateRegistration {
  id: string;
  organization_id: string;
  state: string;
  registration_status: string;
  renewal_due_date: string | null;
  solicitation_active: boolean;
  document_url: string;
  created_at: string;
}

export interface BoardMember {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  title: string;
  term_start: string | null;
  term_end: string | null;
  conflict_of_interest_signed: boolean;
  last_policy_acknowledged_at: string | null;
  created_at: string;
}

export interface Grant {
  id: string;
  organization_id: string;
  funder_name: string;
  grant_name: string;
  restricted: boolean;
  amount_awarded: number;
  date_awarded: string | null;
  reporting_due_date: string | null;
  status: 'active' | 'reporting_due' | 'closed' | 'pending';
  narrative_template_doc_url: string;
  notes: string;
  created_at: string;
}

export interface Donation {
  id: string;
  organization_id: string;
  donor_name: string;
  donor_email: string;
  amount: number;
  date_received: string;
  restricted: boolean;
  designation: string;
  acknowledgment_sent: boolean;
  acknowledgment_sent_at: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  organization_id: string;
  user_id: string | null;
  type: 'deadline_approaching' | 'deadline_overdue' | 'coi_unsigned' | 'ack_pending' | 'grant_report_due';
  title: string;
  message: string;
  entity_type: string;
  entity_id: string | null;
  read: boolean;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  organization_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}
