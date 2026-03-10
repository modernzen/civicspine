import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileCheck2,
  Plus,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  FileText,
  Loader2,
  Sparkles,
  ArrowRight,
  CalendarClock,
  Trash2,
} from 'lucide-react';
import { useComplianceData } from '../../hooks/useComplianceData';
import { useFilingDrafts } from '../../hooks/useFilingData';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { getDeadlineStatus, formatDate, daysUntil, classNames } from '../../lib/utils';
import { getFilingSections } from '../../types';
import type { FormType, FilingDraft, FilingStatus } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';
import DeadlineCountdown from '../../components/ui/DeadlineCountdown';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';

const CHECKLIST_990 = [
  { key: 'legal_name', label: 'Legal name matches IRS records' },
  { key: 'ein_correct', label: 'EIN is correct on all pages' },
  { key: 'address_current', label: 'Principal office address is current' },
  { key: 'revenue_totals', label: 'Revenue totals are not blank or zero (unless applicable)' },
  { key: 'expenses_match', label: 'Expense totals match supporting schedules' },
  { key: 'officer_compensation', label: 'Officer compensation reported accurately' },
  { key: 'board_members_listed', label: 'All current board members listed' },
  { key: 'mission_described', label: 'Mission statement / exempt purpose described' },
  { key: 'schedules_attached', label: 'All required schedules attached' },
  { key: 'signature_present', label: 'Form is signed and dated' },
  { key: 'fiscal_year_correct', label: 'Fiscal year period is correct' },
  { key: 'public_inspection', label: 'Public inspection copy available' },
];

function getFilingStatusBadge(status: FilingStatus) {
  switch (status) {
    case 'draft': return 'badge-warning';
    case 'in_review': return 'badge-neutral';
    case 'approved': return 'badge-success';
    case 'filed': return 'badge-success';
  }
}

function getFilingStatusLabel(status: FilingStatus) {
  switch (status) {
    case 'draft': return 'Draft';
    case 'in_review': return 'In Review';
    case 'approved': return 'Approved';
    case 'filed': return 'Filed';
  }
}

export default function CompliancePage() {
  const { organization } = useAuth();
  const { tasks, loading, refetch } = useComplianceData();
  const { drafts, loading: draftsLoading, createDraft, refetch: refetchDrafts } = useFilingDrafts();
  const navigate = useNavigate();

  const [showAdd, setShowAdd] = useState(false);
  const [showNewFiling, setShowNewFiling] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const [form, setForm] = useState({
    title: '',
    type: 'IRS_990' as string,
    jurisdiction: 'federal',
    due_date: '',
    notes: '',
  });

  const [newFilingYear, setNewFilingYear] = useState(new Date().getFullYear());

  const irsTasks = tasks.filter(t => t.type === 'IRS_990');
  const activeIRS = irsTasks.find(t => t.status !== 'complete');
  const formType = (organization?.form_990_type ?? '990-EZ') as FormType;

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!organization) return;
    setSaving(true);
    await supabase.from('compliance_tasks').insert({
      organization_id: organization.id,
      title: form.title,
      type: form.type,
      jurisdiction: form.jurisdiction,
      due_date: form.due_date || null,
      notes: form.notes,
    });
    setForm({ title: '', type: 'IRS_990', jurisdiction: 'federal', due_date: '', notes: '' });
    setShowAdd(false);
    setSaving(false);
    await refetch();
  }

  async function updateTaskStatus(taskId: string, status: string) {
    await supabase.from('compliance_tasks').update({ status }).eq('id', taskId);
    await refetch();
  }

  async function handleStartFiling() {
    const draft = await createDraft(newFilingYear, formType);
    setShowNewFiling(false);
    if (draft) {
      navigate(`/compliance/filing/${draft.id}`);
    }
  }

  async function deleteDraft(id: string) {
    await supabase.from('filing_drafts').delete().eq('id', id);
    await refetchDrafts();
  }

  function getDraftProgress(draft: FilingDraft): number {
    const sectionDefs = getFilingSections(draft.form_type as FormType);
    if (draft.status === 'filed' || draft.status === 'approved') return 100;
    return Math.round((draft.current_step / (sectionDefs.length + 1)) * 100);
  }

  if (loading || draftsLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-navy-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">IRS 990 Filing Assistant</h1>
          <p className="text-sm text-slate-500">
            Prepare your IRS filing with AI-powered form completion
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowNewFiling(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4" /> Start New Filing
          </button>
          <button onClick={() => setShowAdd(true)} className="btn-secondary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      {drafts.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Filing Drafts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drafts.map((draft, i) => {
              const progress = getDraftProgress(draft);
              return (
                <motion.div
                  key={draft.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="card-hover p-5 cursor-pointer group"
                  onClick={() => navigate(`/compliance/filing/${draft.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-navy-800/60 border border-navy-700/40 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-navy-300" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Form {draft.form_type}</p>
                        <p className="text-xs text-slate-500">FY {draft.fiscal_year}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={getFilingStatusBadge(draft.status)}>
                        {getFilingStatusLabel(draft.status)}
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); deleteDraft(draft.id); }}
                        className="p-1 text-slate-600 hover:text-accent-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-navy-800/60 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-navy-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Updated {formatDate(draft.updated_at)}
                    </span>
                    <span className="text-xs text-navy-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {draft.status === 'draft' ? 'Continue' : 'View'} <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {drafts.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-teal-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">AI-Powered 990 Preparation</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
            Start a new filing to let AI help you complete your Form {formType}. It will pull data from your
            existing records and generate intelligent suggestions for each section.
          </p>
          <button onClick={() => setShowNewFiling(true)} className="btn-primary inline-flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4" /> Start Your First Filing
          </button>
        </motion.div>
      )}

      {activeIRS && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-navy-800/60 border border-navy-700/40 flex items-center justify-center">
                  <CalendarClock className="w-5 h-5 text-navy-300" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Filing Deadline</h3>
                  <p className="text-xs text-slate-500">{activeIRS.title || 'Current filing period'}</p>
                </div>
              </div>
            </div>
            <DeadlineCountdown date={activeIRS.due_date} label="Filing Deadline" />
          </div>

          <div className="flex items-center gap-3 mb-4">
            <StatusBadge status={activeIRS.status} />
            <span className="text-xs text-slate-500">
              Form {organization?.form_990_type ?? '990'}
            </span>
          </div>

          {activeIRS.status !== 'complete' && (
            <div className="flex gap-2">
              <button
                onClick={() => updateTaskStatus(activeIRS.id, 'filed')}
                className="btn-primary text-sm flex items-center gap-2"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Mark as Filed
              </button>
              <button
                onClick={() => updateTaskStatus(activeIRS.id, 'extended')}
                className="btn-secondary text-sm"
              >
                Request Extension
              </button>
              <button
                onClick={() => updateTaskStatus(activeIRS.id, 'complete')}
                className="btn-secondary text-sm"
              >
                Complete
              </button>
            </div>
          )}
        </motion.div>
      )}

      <div className="card">
        <div className="px-5 py-4 border-b border-navy-800/40">
          <h3 className="text-sm font-semibold text-white">Pre-Filing Checklist</h3>
          <p className="text-xs text-slate-500 mt-1">
            Validate these items before submitting Form {organization?.form_990_type ?? '990'}
          </p>
        </div>
        <div className="divide-y divide-navy-800/20">
          {CHECKLIST_990.map((item) => (
            <label
              key={item.key}
              onClick={() => setCheckedItems(prev => {
                const next = new Set(prev);
                if (next.has(item.key)) next.delete(item.key); else next.add(item.key);
                return next;
              })}
              className="flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-navy-800/10 transition-colors"
            >
              <div className={classNames(
                'w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0',
                checkedItems.has(item.key)
                  ? 'bg-success-500/20 border-success-500/50'
                  : 'border-navy-700/50'
              )}>
                {checkedItems.has(item.key) && <CheckCircle2 className="w-3.5 h-3.5 text-success-400" />}
              </div>
              <span className={classNames(
                'text-sm transition-colors',
                checkedItems.has(item.key) ? 'text-slate-500 line-through' : 'text-slate-300'
              )}>
                {item.label}
              </span>
            </label>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-navy-800/40 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {checkedItems.size} of {CHECKLIST_990.length} items verified
          </span>
          <div className="w-32 h-1.5 rounded-full bg-navy-800/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-success-500/60 transition-all duration-300"
              style={{ width: `${(checkedItems.size / CHECKLIST_990.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-navy-800/40 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">All Compliance Tasks</h3>
          <span className="text-xs text-slate-500">{tasks.length} total</span>
        </div>
        {tasks.length === 0 ? (
          <EmptyState
            icon={FileCheck2}
            title="No compliance tasks"
            description="Create your first compliance task to start tracking IRS filings, policy reviews, and audits."
            action={{ label: 'Add Task', onClick: () => setShowAdd(true) }}
          />
        ) : (
          <div className="divide-y divide-navy-800/20">
            {tasks.map((task) => {
              const status = task.status === 'complete' ? 'complete' : getDeadlineStatus(task.due_date);
              const days = daysUntil(task.due_date);
              return (
                <div key={task.id} className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    {status === 'overdue' && <AlertCircle className="w-4 h-4 text-accent-400 shrink-0" />}
                    {status === 'urgent' && <AlertTriangle className="w-4 h-4 text-warning-400 shrink-0" />}
                    {(status === 'upcoming' || status === 'none') && <Clock className="w-4 h-4 text-slate-500 shrink-0" />}
                    {(status === 'ok' || status === 'complete') && <CheckCircle2 className="w-4 h-4 text-success-500 shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-sm text-slate-300 truncate">{task.title || `${task.type} — ${task.jurisdiction}`}</p>
                      <p className="text-xs text-slate-500">{formatDate(task.due_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge
                      status={task.status === 'complete' ? 'complete' : task.status}
                      label={task.status !== 'complete' && days !== null ? `${Math.abs(days)}d ${days < 0 ? 'late' : 'left'}` : undefined}
                    />
                    {task.status !== 'complete' && (
                      <button
                        onClick={() => updateTaskStatus(task.id, 'complete')}
                        className="text-xs text-slate-500 hover:text-success-400 transition-colors"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Compliance Task">
        <form onSubmit={handleAddTask} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input-field"
              placeholder="e.g., FY2025 Form 990-EZ Filing"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="input-field"
              >
                <option value="IRS_990">IRS 990</option>
                <option value="STATE_REGISTRATION">State Registration</option>
                <option value="POLICY_REVIEW">Policy Review</option>
                <option value="AUDIT">Audit</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Jurisdiction</label>
              <input
                type="text"
                value={form.jurisdiction}
                onChange={(e) => setForm({ ...form, jurisdiction: e.target.value })}
                className="input-field"
                placeholder="federal"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Due Date</label>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input-field min-h-[80px] resize-none"
              placeholder="Optional notes"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 text-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Task
            </button>
            <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary text-sm">
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={showNewFiling} onClose={() => setShowNewFiling(false)} title="Start New 990 Filing">
        <div className="space-y-5">
          <div className="p-4 bg-navy-800/40 border border-navy-700/40 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-navy-300" />
              <span className="text-sm font-semibold text-white">Form {formType}</span>
            </div>
            <p className="text-xs text-slate-500">
              {formType === '990-N' ? 'e-Postcard for organizations with gross receipts <= $50,000' :
               formType === '990-EZ' ? 'Short form for gross receipts < $200,000 and assets < $500,000' :
               'Full form for gross receipts >= $200,000 or assets >= $500,000'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Fiscal Year</label>
            <input
              type="number"
              value={newFilingYear}
              onChange={e => setNewFilingYear(Number(e.target.value))}
              className="input-field font-mono"
              min={2020}
              max={2030}
            />
            <p className="text-xs text-slate-500 mt-1.5">The fiscal year this filing covers</p>
          </div>

          <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-xs font-medium text-teal-300">AI-Assisted Preparation</span>
            </div>
            <p className="text-xs text-teal-400/80">
              The wizard will pre-populate data from your existing records and offer AI-generated suggestions
              for each section of the form.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={handleStartFiling} className="btn-primary flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4" /> Begin Filing
            </button>
            <button onClick={() => setShowNewFiling(false)} className="btn-secondary text-sm">
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
