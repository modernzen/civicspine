import { useState, useEffect } from 'react';
import { Users, Plus, Trash2 } from 'lucide-react';
import type { FilingDraftSection, BoardMember } from '../../../types';

interface OfficerEntry {
  name: string;
  title: string;
  hours_per_week: number;
  is_officer: boolean;
  is_director: boolean;
  is_trustee: boolean;
  is_key_employee: boolean;
  reportable_compensation: number;
  other_compensation: number;
}

interface OfficersStepProps {
  section: FilingDraftSection | null;
  boardMembers: BoardMember[];
  onSave: (data: Record<string, unknown>) => void;
}

function buildFromBoard(members: BoardMember[]): OfficerEntry[] {
  return members.map(m => ({
    name: m.name,
    title: m.title || 'Board Member',
    hours_per_week: 2,
    is_officer: m.title?.toLowerCase().includes('officer') || m.title?.toLowerCase().includes('president') || m.title?.toLowerCase().includes('treasurer') || m.title?.toLowerCase().includes('secretary') || false,
    is_director: true,
    is_trustee: false,
    is_key_employee: false,
    reportable_compensation: 0,
    other_compensation: 0,
  }));
}

export default function OfficersStep({ section, boardMembers, onSave }: OfficersStepProps) {
  const savedOfficers = (section?.data?.officers ?? null) as OfficerEntry[] | null;

  const [officers, setOfficers] = useState<OfficerEntry[]>(
    savedOfficers ?? (boardMembers.length > 0 ? buildFromBoard(boardMembers) : [])
  );

  useEffect(() => {
    if (!savedOfficers && boardMembers.length > 0 && officers.length === 0) {
      setOfficers(buildFromBoard(boardMembers));
    }
  }, [boardMembers, savedOfficers, officers.length]);

  function updateOfficer(index: number, key: keyof OfficerEntry, value: unknown) {
    setOfficers(prev => prev.map((o, i) => i === index ? { ...o, [key]: value } : o));
  }

  function addOfficer() {
    setOfficers(prev => [...prev, {
      name: '',
      title: '',
      hours_per_week: 1,
      is_officer: false,
      is_director: false,
      is_trustee: false,
      is_key_employee: false,
      reportable_compensation: 0,
      other_compensation: 0,
    }]);
  }

  function removeOfficer(index: number) {
    setOfficers(prev => prev.filter((_, i) => i !== index));
  }

  const totalCompensation = officers.reduce((sum, o) => sum + o.reportable_compensation + o.other_compensation, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-navy-800/60 border border-navy-700/40 flex items-center justify-center">
          <Users className="w-5 h-5 text-navy-300" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">Officers, Directors & Key Employees</h3>
          <p className="text-xs text-slate-500">Part VII: Compensation of officers, directors, trustees, and key employees</p>
        </div>
      </div>

      {boardMembers.length > 0 && !savedOfficers && (
        <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-lg">
          <p className="text-xs text-teal-300">Pre-populated {boardMembers.length} board member{boardMembers.length !== 1 ? 's' : ''} from your records. Review and update compensation details below.</p>
        </div>
      )}

      <div className="space-y-4">
        {officers.map((officer, i) => (
          <div key={i} className="p-4 bg-navy-800/30 border border-navy-800/40 rounded-lg space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Name</label>
                  <input type="text" value={officer.name} onChange={e => updateOfficer(i, 'name', e.target.value)} className="input-field text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Title</label>
                  <input type="text" value={officer.title} onChange={e => updateOfficer(i, 'title', e.target.value)} className="input-field text-sm" />
                </div>
              </div>
              <button onClick={() => removeOfficer(i)} className="p-1.5 text-slate-500 hover:text-accent-400 transition-colors mt-5">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Hours/Week</label>
                <input type="number" value={officer.hours_per_week} onChange={e => updateOfficer(i, 'hours_per_week', Number(e.target.value))} className="input-field text-sm font-mono text-center" min={0} max={80} />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Reportable Comp.</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                  <input type="number" value={officer.reportable_compensation || ''} onChange={e => updateOfficer(i, 'reportable_compensation', Number(e.target.value))} className="input-field pl-6 text-sm font-mono text-right" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Other Comp.</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                  <input type="number" value={officer.other_compensation || ''} onChange={e => updateOfficer(i, 'other_compensation', Number(e.target.value))} className="input-field pl-6 text-sm font-mono text-right" placeholder="0" />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {(['is_officer', 'is_director', 'is_trustee', 'is_key_employee'] as const).map(key => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={officer[key]}
                    onChange={e => updateOfficer(i, key, e.target.checked)}
                    className="rounded border-navy-600 bg-navy-800 text-navy-400 focus:ring-navy-500"
                  />
                  <span className="text-xs text-slate-400 capitalize">{key.replace('is_', '').replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button onClick={addOfficer} className="btn-secondary text-sm flex items-center gap-2 w-full justify-center">
        <Plus className="w-4 h-4" /> Add Officer / Director
      </button>

      {officers.length > 0 && (
        <div className="p-3 bg-navy-800/40 border border-navy-700/40 rounded-lg flex items-center justify-between">
          <span className="text-sm text-slate-400">Total Compensation</span>
          <span className="text-sm font-semibold text-white font-mono">
            ${totalCompensation.toLocaleString()}
          </span>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button onClick={() => onSave({ officers, total_compensation: totalCompensation })} className="btn-primary text-sm">Save & Continue</button>
      </div>
    </div>
  );
}
