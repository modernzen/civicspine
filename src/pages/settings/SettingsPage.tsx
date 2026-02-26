import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, User, Save, X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const FORM_990_OPTIONS = [
  { value: '990-N', label: '990-N (e-Postcard)', description: 'Gross receipts normally <= $50,000' },
  { value: '990-EZ', label: '990-EZ (Short Form)', description: 'Gross receipts < $200,000 and assets < $500,000' },
  { value: '990', label: '990 (Full Form)', description: 'Gross receipts >= $200,000 or assets >= $500,000' },
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function SuccessToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 bg-success-500/10 border border-success-500/20 rounded-xl backdrop-blur-sm"
    >
      <CheckCircle2 className="w-4 h-4 text-success-400" />
      <span className="text-sm text-success-300">{message}</span>
      <button onClick={onDismiss} className="p-0.5 hover:bg-success-500/10 rounded text-success-400">
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

export default function SettingsPage() {
  const { organization, profile, refreshProfile } = useAuth();

  const [orgName, setOrgName] = useState(organization?.name ?? '');
  const [ein, setEin] = useState(organization?.ein ?? '');
  const [form990Type, setForm990Type] = useState(organization?.form_990_type ?? '990-N');
  const [fiscalYearEnd, setFiscalYearEnd] = useState(organization?.fiscal_year_end ?? 12);
  const [orgSaving, setOrgSaving] = useState(false);
  const [orgError, setOrgError] = useState('');

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function formatEin(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 9);
    if (digits.length > 2) {
      return digits.slice(0, 2) + '-' + digits.slice(2);
    }
    return digits;
  }

  async function saveOrgSettings() {
    if (!organization) return;
    setOrgSaving(true);
    setOrgError('');

    const { error } = await supabase
      .from('organizations')
      .update({
        name: orgName.trim(),
        ein: ein.trim(),
        form_990_type: form990Type,
        fiscal_year_end: fiscalYearEnd,
      })
      .eq('id', organization.id);

    if (error) {
      setOrgError(error.message);
    } else {
      await refreshProfile();
      showToast('Organization settings saved');
    }
    setOrgSaving(false);
  }

  async function saveProfile() {
    if (!profile) return;
    setProfileSaving(true);
    setProfileError('');

    const { error } = await supabase
      .from('user_profiles')
      .update({ full_name: fullName.trim() })
      .eq('id', profile.id);

    if (error) {
      setProfileError(error.message);
    } else {
      await refreshProfile();
      showToast('Profile updated');
    }
    setProfileSaving(false);
  }

  const orgDirty =
    orgName !== (organization?.name ?? '') ||
    ein !== (organization?.ein ?? '') ||
    form990Type !== (organization?.form_990_type ?? '990-N') ||
    fiscalYearEnd !== (organization?.fiscal_year_end ?? 12);

  const profileDirty = fullName !== (profile?.full_name ?? '');

  return (
    <div className="space-y-8 max-w-2xl">
      {toast && <SuccessToast message={toast} onDismiss={() => setToast(null)} />}

      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
        <p className="text-sm text-slate-500">Manage your organization and profile</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="card"
      >
        <div className="px-6 py-4 border-b border-navy-800/40 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-navy-800/60 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-navy-300" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Organization</h2>
            <p className="text-xs text-slate-500">Tax filing and registration details</p>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Organization Name</label>
            <input
              type="text"
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              className="input-field"
              placeholder="Your nonprofit name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">EIN (Employer Identification Number)</label>
            <input
              type="text"
              value={ein}
              onChange={e => setEin(formatEin(e.target.value))}
              className="input-field font-mono"
              placeholder="XX-XXXXXXX"
              maxLength={10}
            />
            <p className="text-xs text-slate-500 mt-1.5">Your 9-digit federal tax identification number</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">IRS Form 990 Type</label>
            <div className="space-y-2">
              {FORM_990_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    form990Type === opt.value
                      ? 'border-navy-500/50 bg-navy-800/40'
                      : 'border-navy-800/40 hover:border-navy-700/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="form990"
                    value={opt.value}
                    checked={form990Type === opt.value}
                    onChange={() => setForm990Type(opt.value as '990-N' | '990-EZ' | '990')}
                    className="mt-0.5 accent-navy-400"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-200">{opt.label}</span>
                    <p className="text-xs text-slate-500 mt-0.5">{opt.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Fiscal Year End</label>
            <select
              value={fiscalYearEnd}
              onChange={e => setFiscalYearEnd(Number(e.target.value))}
              className="input-field"
            >
              {MONTHS.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1.5">
              Your 990 is due on the 15th day of the 5th month after your fiscal year ends
            </p>
          </div>

          {orgError && (
            <p className="text-sm text-accent-400">{orgError}</p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            {orgDirty && (
              <button
                onClick={() => {
                  setOrgName(organization?.name ?? '');
                  setEin(organization?.ein ?? '');
                  setForm990Type(organization?.form_990_type ?? '990-N');
                  setFiscalYearEnd(organization?.fiscal_year_end ?? 12);
                }}
                className="btn-secondary text-sm"
              >
                Discard
              </button>
            )}
            <button
              onClick={saveOrgSettings}
              disabled={!orgDirty || orgSaving || !orgName.trim()}
              className="btn-primary text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {orgSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="card"
      >
        <div className="px-6 py-4 border-b border-navy-800/40 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-navy-800/60 flex items-center justify-center">
            <User className="w-4 h-4 text-navy-300" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Profile</h2>
            <p className="text-xs text-slate-500">Your account details</p>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="input-field"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
            <input
              type="email"
              value={profile?.email ?? ''}
              disabled
              className="input-field opacity-50 cursor-not-allowed"
            />
            <p className="text-xs text-slate-500 mt-1.5">Email is managed through your authentication provider</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Role</label>
              <input
                type="text"
                value={profile?.role ?? ''}
                disabled
                className="input-field opacity-50 cursor-not-allowed capitalize"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Member Since</label>
              <input
                type="text"
                value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : ''}
                disabled
                className="input-field opacity-50 cursor-not-allowed"
              />
            </div>
          </div>

          {profileError && (
            <p className="text-sm text-accent-400">{profileError}</p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            {profileDirty && (
              <button
                onClick={() => setFullName(profile?.full_name ?? '')}
                className="btn-secondary text-sm"
              >
                Discard
              </button>
            )}
            <button
              onClick={saveProfile}
              disabled={!profileDirty || profileSaving || !fullName.trim()}
              className="btn-primary text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {profileSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
