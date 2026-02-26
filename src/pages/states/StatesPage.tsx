import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Plus,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useComplianceData } from '../../hooks/useComplianceData';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { getDeadlineStatus, formatDate, daysUntil, US_STATES } from '../../lib/utils';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';

export default function StatesPage() {
  const { organization } = useAuth();
  const { states, loading, refetch } = useComplianceData();
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    state: '',
    registration_status: 'active',
    renewal_due_date: '',
    solicitation_active: true,
  });

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
    });
    setForm({ state: '', registration_status: 'active', renewal_due_date: '', solicitation_active: true });
    setShowAdd(false);
    setSaving(false);
    await refetch();
  }

  async function toggleSolicitation(id: string, current: boolean) {
    await supabase.from('states_registered').update({ solicitation_active: !current }).eq('id', id);
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Multi-State Registration Tracker</h1>
          <p className="text-sm text-slate-500">
            Track charitable solicitation registrations across jurisdictions
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 text-sm">
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
            action={{ label: 'Add State', onClick: () => setShowAdd(true) }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-navy-800/40">
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">State</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">Renewal Due</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">Solicitation</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">Deadline</th>
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
                      className="hover:bg-navy-800/10 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-slate-500" />
                          <span className="text-sm font-medium text-slate-300">{state.state}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={state.registration_status === 'active' ? 'active' : state.registration_status === 'expired' ? 'overdue' : 'pending'} label={state.registration_status} />
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-slate-400">{formatDate(state.renewal_due_date)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => toggleSolicitation(state.id, state.solicitation_active)}
                          className={`text-xs font-medium px-3 py-1 rounded-full transition-all ${
                            state.solicitation_active
                              ? 'bg-success-500/10 text-success-400 border border-success-500/20'
                              : 'bg-navy-800/40 text-slate-500 border border-navy-700/30'
                          }`}
                        >
                          {state.solicitation_active ? 'Active' : 'Inactive'}
                        </button>
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
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
              {US_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
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
    </div>
  );
}
