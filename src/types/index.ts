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

export type FilingStatus = 'draft' | 'in_review' | 'approved' | 'filed';
export type SectionStatus = 'not_started' | 'in_progress' | 'ai_drafted' | 'reviewed';
export type FormType = '990-N' | '990-EZ' | '990';

export interface FilingDraft {
  id: string;
  organization_id: string;
  fiscal_year: number;
  form_type: FormType;
  status: FilingStatus;
  current_step: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FilingDraftSection {
  id: string;
  draft_id: string;
  section_key: string;
  data: Record<string, unknown>;
  ai_generated: Record<string, unknown>;
  status: SectionStatus;
  created_at: string;
  updated_at: string;
}

export interface FilingSectionDef {
  key: string;
  label: string;
  description: string;
}

export const FILING_SECTIONS_990N: FilingSectionDef[] = [
  { key: 'org_info', label: 'Organization Information', description: 'Legal name, EIN, address, and principal officer' },
];

export const FILING_SECTIONS_990EZ: FilingSectionDef[] = [
  { key: 'org_info', label: 'Organization Information', description: 'Legal name, EIN, address, and tax period' },
  { key: 'revenue', label: 'Revenue & Expenses', description: 'Contributions, program revenue, and total expenses' },
  { key: 'expenses', label: 'Expense Allocation', description: 'Program services, management, and fundraising' },
  { key: 'officers', label: 'Officers & Directors', description: 'Board members, officers, and compensation' },
  { key: 'mission', label: 'Mission & Programs', description: 'Mission statement and program accomplishments' },
  { key: 'governance', label: 'Governance & Policies', description: 'Governance practices and required policies' },
  { key: 'financial_statements', label: 'Balance Sheet', description: 'Assets, liabilities, and net assets' },
];

export const FILING_SECTIONS_990: FilingSectionDef[] = [
  { key: 'org_info', label: 'Organization Information', description: 'Legal name, EIN, address, and tax period' },
  { key: 'revenue', label: 'Statement of Revenue', description: 'Part VIII: All revenue sources and totals' },
  { key: 'expenses', label: 'Functional Expenses', description: 'Part IX: Expenses by function and natural classification' },
  { key: 'officers', label: 'Compensation', description: 'Part VII: Officers, directors, trustees, key employees' },
  { key: 'mission', label: 'Program Accomplishments', description: 'Part III: Mission and program service achievements' },
  { key: 'governance', label: 'Governance & Disclosure', description: 'Part VI: Governance, management, and disclosure' },
  { key: 'financial_statements', label: 'Financial Statements', description: 'Parts X-XII: Balance sheet, reconciliation, and reporting' },
];

export function getFilingSections(formType: FormType): FilingSectionDef[] {
  switch (formType) {
    case '990-N': return FILING_SECTIONS_990N;
    case '990-EZ': return FILING_SECTIONS_990EZ;
    case '990': return FILING_SECTIONS_990;
  }
}
