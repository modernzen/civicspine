import { useState } from 'react';
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
} from 'lucide-react';
import { useComplianceData } from '../../hooks/useComplianceData';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { getDeadlineStatus, formatDate, daysUntil, classNames } from '../../lib/utils';
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

export default function CompliancePage() {
  const { organization } = useAuth();
  const { tasks, loading, refetch } = useComplianceData();
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const [form, setForm] = useState({
    title: '',
    type: 'IRS_990' as string,
    jurisdiction: 'federal',
    due_date: '',
    notes: '',
  });

  const irsTasks = tasks.filter(t => t.type === 'IRS_990');
  const activeIRS = irsTasks.find(t => t.status !== 'complete');

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

  if (loading) {
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
            Track your IRS filing obligations and validate before submission
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

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
                  <FileText className="w-5 h-5 text-navy-300" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Form {organization?.form_990_type ?? '990'}</h3>
                  <p className="text-xs text-slate-500">{activeIRS.title || 'Current filing period'}</p>
                </div>
              </div>
            </div>
            <DeadlineCountdown date={activeIRS.due_date} label="Filing Deadline" />
          </div>

          <div className="flex items-center gap-3 mb-4">
            <StatusBadge status={activeIRS.status} />
            <span className="text-xs text-slate-500">
              Form type based on {organization?.form_990_type === '990-N' ? 'gross receipts ≤ $50,000' :
                organization?.form_990_type === '990-EZ' ? 'gross receipts < $200,000 & assets < $500,000' :
                  'gross receipts ≥ $200,000 or assets ≥ $500,000'}
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
    </div>
  );
}
