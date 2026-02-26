import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  Plus,
  CheckCircle2,
  Mail,
  Loader2,
  DollarSign,
  Users,
  UserPlus,
  UserMinus,
  Send,
} from 'lucide-react';
import { useComplianceData } from '../../hooks/useComplianceData';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatDate, formatCurrency } from '../../lib/utils';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';

function classifyDonor(donations: { donor_email: string; date_received: string }[], email: string): 'first-time' | 'repeat' | 'lapsed' {
  const donorDonations = donations.filter(d => d.donor_email === email);
  if (donorDonations.length <= 1) return 'first-time';
  const latest = new Date(Math.max(...donorDonations.map(d => new Date(d.date_received).getTime())));
  const daysSince = (Date.now() - latest.getTime()) / (1000 * 60 * 60 * 24);
  return daysSince > 365 ? 'lapsed' : 'repeat';
}

export default function DonorsPage() {
  const { organization } = useAuth();
  const { donations, loading, refetch } = useComplianceData();
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'sent'>('all');

  const [form, setForm] = useState({
    donor_name: '',
    donor_email: '',
    amount: '',
    date_received: new Date().toISOString().split('T')[0],
    restricted: false,
    designation: '',
  });

  const filtered = useMemo(() => {
    if (filter === 'pending') return donations.filter(d => !d.acknowledgment_sent);
    if (filter === 'sent') return donations.filter(d => d.acknowledgment_sent);
    return donations;
  }, [donations, filter]);

  const totalDonations = donations.reduce((s, d) => s + d.amount, 0);
  const pendingAck = donations.filter(d => !d.acknowledgment_sent);
  const uniqueDonors = new Set(donations.map(d => d.donor_email || d.donor_name)).size;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!organization) return;
    setSaving(true);
    await supabase.from('donations').insert({
      organization_id: organization.id,
      donor_name: form.donor_name,
      donor_email: form.donor_email,
      amount: parseFloat(form.amount) || 0,
      date_received: form.date_received,
      restricted: form.restricted,
      designation: form.designation,
    });
    setForm({ donor_name: '', donor_email: '', amount: '', date_received: new Date().toISOString().split('T')[0], restricted: false, designation: '' });
    setShowAdd(false);
    setSaving(false);
    await refetch();
  }

  async function markAcknowledged(id: string) {
    await supabase.from('donations').update({
      acknowledgment_sent: true,
      acknowledgment_sent_at: new Date().toISOString(),
    }).eq('id', id);
    await refetch();
  }

  async function markAllAcknowledged() {
    if (!organization) return;
    const ids = pendingAck.map(d => d.id);
    for (const id of ids) {
      await supabase.from('donations').update({
        acknowledgment_sent: true,
        acknowledgment_sent_at: new Date().toISOString(),
      }).eq('id', id);
    }
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
          <h1 className="text-2xl font-bold text-white mb-1">Donor Stewardship</h1>
          <p className="text-sm text-slate-500">
            Track donations, send acknowledgments, and nurture donor relationships
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Add Donation
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalDonations)}</p>
          <p className="text-sm text-slate-400 mt-1">Total Donations</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-bold text-white">{uniqueDonors}</p>
          <p className="text-sm text-slate-400 mt-1">Unique Donors</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-warning-400" />
          </div>
          <p className="text-2xl font-bold text-warning-400">{pendingAck.length}</p>
          <p className="text-sm text-slate-400 mt-1">Pending Acknowledgments</p>
        </div>
        <div className="card p-5">
          <p className="text-2xl font-bold text-white">{donations.length}</p>
          <p className="text-sm text-slate-400 mt-1">Total Gifts</p>
        </div>
      </div>

      {pendingAck.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card border-warning-500/20 bg-warning-500/5 p-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-warning-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-warning-300 mb-1">Stewardship Queue</h3>
                <p className="text-sm text-slate-400">
                  {pendingAck.length} {pendingAck.length === 1 ? 'donation requires' : 'donations require'} IRS-compliant tax acknowledgment
                </p>
              </div>
            </div>
            <button onClick={markAllAcknowledged} className="btn-primary text-sm flex items-center gap-2 shrink-0">
              <Send className="w-3.5 h-3.5" /> Mark All Sent
            </button>
          </div>
        </motion.div>
      )}

      <div className="card">
        <div className="px-5 py-4 border-b border-navy-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-white">Donations</h3>
          <div className="flex items-center gap-1 bg-navy-900/60 rounded-lg p-0.5 border border-navy-800/40">
            {(['all', 'pending', 'sent'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  filter === f
                    ? 'bg-navy-700/60 text-white'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {f === 'all' ? 'All' : f === 'pending' ? 'Needs Ack' : 'Acknowledged'}
              </button>
            ))}
          </div>
        </div>
        {filtered.length === 0 ? (
          <EmptyState
            icon={Heart}
            title={filter === 'all' ? 'No donations recorded' : `No ${filter} donations`}
            description={filter === 'all' ? 'Record donations to track acknowledgments and donor stewardship.' : 'No donations match this filter.'}
            action={filter === 'all' ? { label: 'Add Donation', onClick: () => setShowAdd(true) } : undefined}
          />
        ) : (
          <div className="divide-y divide-navy-800/20">
            {filtered.map((donation, i) => {
              const lifecycle = classifyDonor(donations, donation.donor_email);
              return (
                <motion.div
                  key={donation.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-white truncate">{donation.donor_name}</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full border ${
                        lifecycle === 'first-time'
                          ? 'bg-navy-700/30 text-slate-400 border-navy-700/40'
                          : lifecycle === 'repeat'
                          ? 'bg-success-500/10 text-success-400 border-success-500/20'
                          : 'bg-accent-500/10 text-accent-400 border-accent-500/20'
                      }`}>
                        {lifecycle === 'first-time' && <><UserPlus className="w-2.5 h-2.5" /> New</>}
                        {lifecycle === 'repeat' && <><Users className="w-2.5 h-2.5" /> Repeat</>}
                        {lifecycle === 'lapsed' && <><UserMinus className="w-2.5 h-2.5" /> Lapsed</>}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="font-semibold text-slate-300">{formatCurrency(donation.amount)}</span>
                      <span>{formatDate(donation.date_received)}</span>
                      {donation.donor_email && <span>{donation.donor_email}</span>}
                      {donation.restricted && <span className="text-warning-400">Restricted</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {donation.acknowledgment_sent ? (
                      <span className="badge-success"><CheckCircle2 className="w-3 h-3" /> Acknowledged</span>
                    ) : (
                      <button
                        onClick={() => markAcknowledged(donation.id)}
                        className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg bg-warning-500/10 text-warning-400 border border-warning-500/20 hover:bg-warning-500/15 transition-all"
                      >
                        <Mail className="w-3.5 h-3.5" /> Mark Sent
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-center py-2">
        <p className="text-[11px] text-slate-600 max-w-md mx-auto leading-relaxed">
          Donation acknowledgments must comply with IRS requirements under IRC 170(f)(8).
          Consult a tax professional for specific acknowledgment language requirements.
        </p>
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Record Donation">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Donor Name</label>
            <input
              type="text"
              value={form.donor_name}
              onChange={(e) => setForm({ ...form, donor_name: e.target.value })}
              className="input-field"
              placeholder="John Doe"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Donor Email</label>
            <input
              type="email"
              value={form.donor_email}
              onChange={(e) => setForm({ ...form, donor_email: e.target.value })}
              className="input-field"
              placeholder="john@example.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Amount</label>
              <input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="input-field"
                placeholder="100.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Date Received</label>
              <input
                type="date"
                value={form.date_received}
                onChange={(e) => setForm({ ...form, date_received: e.target.value })}
                className="input-field"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Designation</label>
            <input
              type="text"
              value={form.designation}
              onChange={(e) => setForm({ ...form, designation: e.target.value })}
              className="input-field"
              placeholder="e.g., General Fund, Youth Programs"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.restricted}
              onChange={(e) => setForm({ ...form, restricted: e.target.checked })}
              className="w-4 h-4 rounded border-navy-700/50 bg-navy-900 text-navy-500 focus:ring-navy-500"
            />
            <label className="text-sm text-slate-400">This donation is restricted / donor-designated</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 text-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Record Donation
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
