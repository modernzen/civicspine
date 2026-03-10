import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Plus,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Save,
  Trash2,
} from 'lucide-react';
import { useComplianceData } from '../../hooks/useComplianceData';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { getDeadlineStatus, formatDate, daysUntil, US_STATES } from '../../lib/utils';
import { STATE_PORTALS } from '../../lib/statePortals';
import type { StateRegistration } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';

interface StateForm {
  state: string;
  registration_status: string;
  renewal_due_date: string;
  solicitation_active: boolean;
  registration_number: string;
}

const emptyForm: StateForm = {
  state: '',
  registration_status: 'active',
  renewal_due_date: '',
  solicitation_active: true,
  registration_number: '',
};

function PortalLink({ stateName, className }: { stateName: string; className?: string }) {
  const portal = STATE_PORTALS[stateName];
  if (!portal) return null;
  return (
    <a
      href={portal.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={className || 'inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 transition-colors'}
    >
      <ExternalLink className="w-3.5 h-3.5" />
      <span>{portal.agency}</span>
    </a>
  );
}

export default function StatesPage() {
  const { organization } = useAuth();
  const { states, loading, refetch } = useComplianceData();
  const [showAdd, setShowAdd] = useState(false);
  const [editingState, setEditingState] = useState<StateRegistration | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<StateForm>(emptyForm);

  function openAdd() {
    setForm(emptyForm);
    setShowAdd(true);
  }

  function openEdit(reg: StateRegistration) {
    setForm({
      state: reg.state,
      registration_status: reg.registration_status,
      renewal_due_date: reg.renewal_due_date ?? '',
      solicitation_active: reg.solicitation_active,
      registration_number: reg.registration_number ?? '',
    });
    setEditingState(reg);
  }

  function closeEdit() {
    setEditingState(null);
    setForm(emptyForm);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!organization) return;
    setSaving(true);
    await supabase.from('states_registered').insert({
      organization_id: organization.id,
      state: form.state,
      registration_status: form.registration_status,
      renewal_due_date: form.renewal_due_date || null,
      solicitation_active: form.solicitation_active,
      registration_number: form.registration_number || null,
    });
    setForm(emptyForm);
    setShowAdd(false);
    setSaving(false);
    await refetch();
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingState) return;
    setSaving(true);
    await supabase
      .from('states_registered')
      .update({
        registration_status: form.registration_status,
        renewal_due_date: form.renewal_due_date || null,
        solicitation_active: form.solicitation_active,
        registration_number: form.registration_number || null,
      })
      .eq('id', editingState.id);
    setSaving(false);
    closeEdit();
    await refetch();
  }

  async function handleDelete() {
    if (!editingState) return;
    setDeleting(true);
    await supabase.from('states_registered').delete().eq('id', editingState.id);
    setDeleting(false);
    closeEdit();
    await refetch();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-navy-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeCount = states.filter(s => s.registration_status === 'active').length;
  const upcomingRenewals = states.filter(s => {
    const status = getDeadlineStatus(s.renewal_due_date);
    return status === 'urgent' || status === 'overdue';
  });

  const selectedPortal = form.state ? STATE_PORTALS[form.state] : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Multi-State Registration Tracker</h1>
          <p className="text-sm text-slate-500">
            Track charitable solicitation registrations across jurisdictions
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Add State
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-2xl font-bold text-white">{activeCount}</p>
          <p className="text-sm text-slate-400 mt-1">Active Registrations</p>
        </div>
        <div className="card p-5">
          <p className="text-2xl font-bold text-white">{states.length}</p>
          <p className="text-sm text-slate-400 mt-1">States Tracked</p>
        </div>
        <div className="card p-5">
          <p className="text-2xl font-bold text-warning-400">{upcomingRenewals.length}</p>
          <p className="text-sm text-slate-400 mt-1">Renewals Due Soon</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-navy-800/40">
          <h3 className="text-sm font-semibold text-white">State Registrations</h3>
        </div>
        {states.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No state registrations"
            description="Add the states where your organization solicits donations to track registration requirements."
            action={{ label: 'Add State', onClick: openAdd }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-navy-800/40">
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">State</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">Reg #</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">Renewal Due</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">Solicitation</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">Deadline</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">Portal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800/20">
                {states.map((state, i) => {
                  const deadlineStatus = getDeadlineStatus(state.renewal_due_date);
                  const days = daysUntil(state.renewal_due_date);
                  return (
                    <motion.tr
                      key={state.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => openEdit(state)}
                      className="hover:bg-navy-800/20 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-slate-500" />
                          <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                            {state.state}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge
                          status={state.registration_status === 'active' ? 'active' : state.registration_status === 'expired' ? 'overdue' : 'pending'}
                          label={state.registration_status}
                        />
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-slate-400 font-mono">
                          {state.registration_number || '--'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-slate-400">{formatDate(state.renewal_due_date)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                          state.solicitation_active
                            ? 'bg-success-500/10 text-success-400 border border-success-500/20'
                            : 'bg-navy-800/40 text-slate-500 border border-navy-700/30'
                        }`}>
                          {state.solicitation_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {days !== null ? (
                          <div className="flex items-center gap-2">
                            {deadlineStatus === 'overdue' && <AlertCircle className="w-3.5 h-3.5 text-accent-400" />}
                            {deadlineStatus === 'urgent' && <AlertTriangle className="w-3.5 h-3.5 text-warning-400" />}
                            {deadlineStatus === 'ok' && <CheckCircle2 className="w-3.5 h-3.5 text-success-500" />}
                            <span className={`text-sm tabular-nums ${
                              deadlineStatus === 'overdue' ? 'text-accent-400' :
                              deadlineStatus === 'urgent' ? 'text-warning-400' : 'text-slate-400'
                            }`}>
                              {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-500">--</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <PortalLink stateName={state.state} />
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add State Registration">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">State</label>
            <select
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="input-field"
              required
            >
              <option value="">Select a state</option>
              {US_STATES.filter(s => !states.some(existing => existing.state === s)).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          {selectedPortal && (
            <a
              href={selectedPortal.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-sky-500/5 border border-sky-500/15 text-sky-400 hover:bg-sky-500/10 transition-colors"
            >
              <ExternalLink className="w-4 h-4 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium">Open {form.state} Portal</p>
                <p className="text-xs text-sky-400/60 truncate">{selectedPortal.agency}</p>
              </div>
            </a>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Registration Status</label>
            <select
              value={form.registration_status}
              onChange={(e) => setForm({ ...form, registration_status: e.target.value })}
              className="input-field"
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="expired">Expired</option>
              <option value="exempt">Exempt</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Registration Number</label>
            <input
              type="text"
              value={form.registration_number}
              onChange={(e) => setForm({ ...form, registration_number: e.target.value })}
              className="input-field"
              placeholder="e.g. CH-12345"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Renewal Due Date</label>
            <input
              type="date"
              value={form.renewal_due_date}
              onChange={(e) => setForm({ ...form, renewal_due_date: e.target.value })}
              className="input-field"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.solicitation_active}
              onChange={(e) => setForm({ ...form, solicitation_active: e.target.checked })}
              className="w-4 h-4 rounded border-navy-700/50 bg-navy-900 text-navy-500 focus:ring-navy-500"
            />
            <label className="text-sm text-slate-400">Actively soliciting in this state</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 text-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Registration
            </button>
            <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary text-sm">
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editingState} onClose={closeEdit} title={`Edit ${editingState?.state ?? ''} Registration`}>
        <form onSubmit={handleUpdate} className="space-y-4">
          {editingState && STATE_PORTALS[editingState.state] && (
            <a
              href={STATE_PORTALS[editingState.state].url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-sky-500/5 border border-sky-500/15 text-sky-400 hover:bg-sky-500/10 transition-colors"
            >
              <ExternalLink className="w-4 h-4 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium">Open {editingState.state} State Portal</p>
                <p className="text-xs text-sky-400/60 truncate">{STATE_PORTALS[editingState.state].agency}</p>
              </div>
            </a>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Registration Status</label>
            <select
              value={form.registration_status}
              onChange={(e) => setForm({ ...form, registration_status: e.target.value })}
              className="input-field"
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="expired">Expired</option>
              <option value="exempt">Exempt</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Registration Number</label>
            <input
              type="text"
              value={form.registration_number}
              onChange={(e) => setForm({ ...form, registration_number: e.target.value })}
              className="input-field"
              placeholder="e.g. CH-12345"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Renewal Due Date</label>
            <input
              type="date"
              value={form.renewal_due_date}
              onChange={(e) => setForm({ ...form, renewal_due_date: e.target.value })}
              className="input-field"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.solicitation_active}
              onChange={(e) => setForm({ ...form, solicitation_active: e.target.checked })}
              className="w-4 h-4 rounded border-navy-700/50 bg-navy-900 text-navy-500 focus:ring-navy-500"
            />
            <label className="text-sm text-slate-400">Actively soliciting in this state</label>
          </div>
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors px-3 py-2 rounded-lg hover:bg-red-500/10"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Remove
            </button>
            <div className="flex gap-3">
              <button type="button" onClick={closeEdit} className="btn-secondary text-sm">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 text-sm">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
