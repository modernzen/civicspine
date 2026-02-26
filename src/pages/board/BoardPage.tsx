import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users2,
  Plus,
  CheckCircle2,
  AlertCircle,
  UserCircle,
  Loader2,
  FileText,
  Clock,
} from 'lucide-react';
import { useComplianceData } from '../../hooks/useComplianceData';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatDate } from '../../lib/utils';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';

const POLICIES = [
  'Conflict of Interest Policy',
  'Document Retention Policy',
  'Whistleblower Policy',
  'Gift Acceptance Policy',
  'Executive Compensation Policy',
];

export default function BoardPage() {
  const { organization } = useAuth();
  const { boardMembers, loading, refetch } = useComplianceData();
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    title: '',
    term_start: '',
    term_end: '',
  });

  const signedCount = boardMembers.filter(b => b.conflict_of_interest_signed).length;
  const unsigned = boardMembers.filter(b => !b.conflict_of_interest_signed);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!organization) return;
    setSaving(true);
    await supabase.from('board_members').insert({
      organization_id: organization.id,
      name: form.name,
      email: form.email,
      title: form.title,
      term_start: form.term_start || null,
      term_end: form.term_end || null,
    });
    setForm({ name: '', email: '', title: '', term_start: '', term_end: '' });
    setShowAdd(false);
    setSaving(false);
    await refetch();
  }

  async function toggleCOI(id: string, current: boolean) {
    await supabase.from('board_members').update({
      conflict_of_interest_signed: !current,
      last_policy_acknowledged_at: !current ? new Date().toISOString() : null,
    }).eq('id', id);
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
          <h1 className="text-2xl font-bold text-white mb-1">Board Governance</h1>
          <p className="text-sm text-slate-500">
            Manage board members, policies, and compliance requirements
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Add Member
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <p className="text-2xl font-bold text-white">{boardMembers.length}</p>
          <p className="text-sm text-slate-400 mt-1">Board Members</p>
        </div>
        <div className="card p-5">
          <p className="text-2xl font-bold text-success-400">{signedCount}</p>
          <p className="text-sm text-slate-400 mt-1">COI Signed</p>
        </div>
        <div className="card p-5">
          <p className="text-2xl font-bold text-accent-400">{unsigned.length}</p>
          <p className="text-sm text-slate-400 mt-1">COI Unsigned</p>
        </div>
        <div className="card p-5">
          <p className="text-2xl font-bold text-white">
            {boardMembers.length > 0 ? Math.round((signedCount / boardMembers.length) * 100) : 0}%
          </p>
          <p className="text-sm text-slate-400 mt-1">Compliance Rate</p>
        </div>
      </div>

      {unsigned.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card border-accent-700/30 bg-accent-500/5 p-5"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-accent-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-accent-300 mb-1">Unsigned Conflict of Interest Forms</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {unsigned.map(m => (
                  <span key={m.id} className="badge-danger">{m.name}</span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="card">
        <div className="px-5 py-4 border-b border-navy-800/40">
          <h3 className="text-sm font-semibold text-white">Board Members</h3>
        </div>
        {boardMembers.length === 0 ? (
          <EmptyState
            icon={Users2}
            title="No board members"
            description="Add your board of directors to track governance compliance and policy acknowledgments."
            action={{ label: 'Add Member', onClick: () => setShowAdd(true) }}
          />
        ) : (
          <div className="divide-y divide-navy-800/20">
            {boardMembers.map((member, i) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-navy-800/60 border border-navy-700/40 flex items-center justify-center">
                    <UserCircle className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{member.name}</p>
                    <p className="text-xs text-slate-500">{member.title || 'Board Member'}{member.email ? ` — ${member.email}` : ''}</p>
                    {member.term_start && (
                      <p className="text-xs text-slate-600 mt-0.5">
                        Term: {formatDate(member.term_start)} — {formatDate(member.term_end)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:shrink-0">
                  <button
                    onClick={() => toggleCOI(member.id, member.conflict_of_interest_signed)}
                    className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg transition-all border ${
                      member.conflict_of_interest_signed
                        ? 'bg-success-500/10 text-success-400 border-success-500/20 hover:bg-success-500/15'
                        : 'bg-accent-500/10 text-accent-400 border-accent-500/20 hover:bg-accent-500/15'
                    }`}
                  >
                    {member.conflict_of_interest_signed ? (
                      <><CheckCircle2 className="w-3.5 h-3.5" /> COI Signed</>
                    ) : (
                      <><AlertCircle className="w-3.5 h-3.5" /> COI Unsigned</>
                    )}
                  </button>
                  {member.last_policy_acknowledged_at && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(member.last_policy_acknowledged_at)}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-navy-800/40">
          <h3 className="text-sm font-semibold text-white">Required Policies</h3>
          <p className="text-xs text-slate-500 mt-1">Standard governance policies recommended for 501(c)(3) organizations</p>
        </div>
        <div className="divide-y divide-navy-800/20">
          {POLICIES.map((policy) => (
            <div key={policy} className="px-5 py-3.5 flex items-center gap-4">
              <FileText className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-300">{policy}</span>
            </div>
          ))}
        </div>
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Board Member">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field"
              placeholder="Jane Smith"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input-field"
              placeholder="jane@example.org"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Title / Role</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input-field"
              placeholder="e.g., Chair, Treasurer, Secretary"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Term Start</label>
              <input
                type="date"
                value={form.term_start}
                onChange={(e) => setForm({ ...form, term_start: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Term End</label>
              <input
                type="date"
                value={form.term_end}
                onChange={(e) => setForm({ ...form, term_end: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 text-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Member
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
