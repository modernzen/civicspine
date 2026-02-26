import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Landmark,
  Plus,
  Loader2,
  DollarSign,
  Lock,
  Unlock,
} from 'lucide-react';
import { useComplianceData } from '../../hooks/useComplianceData';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { getDeadlineStatus, formatDate, formatCurrency, daysUntil } from '../../lib/utils';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';

export default function GrantsPage() {
  const { organization } = useAuth();
  const { grants, loading, refetch } = useComplianceData();
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    funder_name: '',
    grant_name: '',
    restricted: false,
    amount_awarded: '',
    date_awarded: '',
    reporting_due_date: '',
    notes: '',
  });

  const activeGrants = grants.filter(g => g.status === 'active' || g.status === 'reporting_due');
  const totalActive = activeGrants.reduce((s, g) => s + g.amount_awarded, 0);
  const restrictedTotal = activeGrants.filter(g => g.restricted).reduce((s, g) => s + g.amount_awarded, 0);
  const unrestricted = totalActive - restrictedTotal;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!organization) return;
    setSaving(true);
    await supabase.from('grants').insert({
      organization_id: organization.id,
      funder_name: form.funder_name,
      grant_name: form.grant_name,
      restricted: form.restricted,
      amount_awarded: parseFloat(form.amount_awarded) || 0,
      date_awarded: form.date_awarded || null,
      reporting_due_date: form.reporting_due_date || null,
      status: 'active',
      notes: form.notes,
    });
    setForm({ funder_name: '', grant_name: '', restricted: false, amount_awarded: '', date_awarded: '', reporting_due_date: '', notes: '' });
    setShowAdd(false);
    setSaving(false);
    await refetch();
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('grants').update({ status }).eq('id', id);
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
          <h1 className="text-2xl font-bold text-white mb-1">Grant Management</h1>
          <p className="text-sm text-slate-500">
            Track grants, restricted funds, and reporting deadlines
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Add Grant
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalActive)}</p>
          <p className="text-sm text-slate-400 mt-1">Active Grant Funding</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-warning-400" />
          </div>
          <p className="text-2xl font-bold text-warning-400">{formatCurrency(restrictedTotal)}</p>
          <p className="text-sm text-slate-400 mt-1">Restricted Funds</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Unlock className="w-4 h-4 text-success-400" />
          </div>
          <p className="text-2xl font-bold text-success-400">{formatCurrency(unrestricted)}</p>
          <p className="text-sm text-slate-400 mt-1">Unrestricted Funds</p>
        </div>
        <div className="card p-5">
          <p className="text-2xl font-bold text-white">{activeGrants.length}</p>
          <p className="text-sm text-slate-400 mt-1">Active Grants</p>
        </div>
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-navy-800/40 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">All Grants</h3>
          <span className="text-xs text-slate-500">{grants.length} total</span>
        </div>
        {grants.length === 0 ? (
          <EmptyState
            icon={Landmark}
            title="No grants tracked"
            description="Add grants to track restricted and unrestricted funds along with reporting deadlines."
            action={{ label: 'Add Grant', onClick: () => setShowAdd(true) }}
          />
        ) : (
          <div className="divide-y divide-navy-800/20">
            {grants.map((grant, i) => {
              const deadlineStatus = getDeadlineStatus(grant.reporting_due_date);
              const days = daysUntil(grant.reporting_due_date);
              return (
                <motion.div
                  key={grant.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="px-5 py-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-white truncate">{grant.funder_name}</p>
                        {grant.restricted && (
                          <span className="badge-warning"><Lock className="w-3 h-3" /> Restricted</span>
                        )}
                      </div>
                      {grant.grant_name && (
                        <p className="text-xs text-slate-500">{grant.grant_name}</p>
                      )}
                      <div className="flex items-center gap-4 mt-1.5">
                        <span className="text-sm font-semibold text-slate-300">{formatCurrency(grant.amount_awarded)}</span>
                        {grant.date_awarded && (
                          <span className="text-xs text-slate-500">Awarded {formatDate(grant.date_awarded)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {grant.reporting_due_date && (
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Report due {formatDate(grant.reporting_due_date)}</p>
                          {days !== null && (
                            <p className={`text-xs font-medium mt-0.5 ${
                              deadlineStatus === 'overdue' ? 'text-accent-400' :
                              deadlineStatus === 'urgent' ? 'text-warning-400' : 'text-slate-400'
                            }`}>
                              {days < 0 ? `${Math.abs(days)} days overdue` : `${days} days left`}
                            </p>
                          )}
                        </div>
                      )}
                      <StatusBadge status={grant.status} />
                      {grant.status !== 'closed' && (
                        <button
                          onClick={() => updateStatus(grant.id, 'closed')}
                          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          Close
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Grant">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Funder Name</label>
            <input
              type="text"
              value={form.funder_name}
              onChange={(e) => setForm({ ...form, funder_name: e.target.value })}
              className="input-field"
              placeholder="e.g., Ford Foundation"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Grant Name / Description</label>
            <input
              type="text"
              value={form.grant_name}
              onChange={(e) => setForm({ ...form, grant_name: e.target.value })}
              className="input-field"
              placeholder="e.g., Community Development Grant"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Amount Awarded</label>
              <input
                type="number"
                step="0.01"
                value={form.amount_awarded}
                onChange={(e) => setForm({ ...form, amount_awarded: e.target.value })}
                className="input-field"
                placeholder="50000"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Date Awarded</label>
              <input
                type="date"
                value={form.date_awarded}
                onChange={(e) => setForm({ ...form, date_awarded: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Reporting Due Date</label>
            <input
              type="date"
              value={form.reporting_due_date}
              onChange={(e) => setForm({ ...form, reporting_due_date: e.target.value })}
              className="input-field"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.restricted}
              onChange={(e) => setForm({ ...form, restricted: e.target.checked })}
              className="w-4 h-4 rounded border-navy-700/50 bg-navy-900 text-navy-500 focus:ring-navy-500"
            />
            <label className="text-sm text-slate-400">This grant contains restricted funds</label>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input-field min-h-[80px] resize-none"
              placeholder="Optional notes about reporting requirements"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 text-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Grant
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
