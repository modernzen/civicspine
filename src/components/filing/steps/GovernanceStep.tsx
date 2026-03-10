import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { FilingDraftSection, BoardMember } from '../../../types';

interface GovernanceStepProps {
  section: FilingDraftSection | null;
  boardMembers: BoardMember[];
  onSave: (data: Record<string, unknown>) => void;
}

const GOVERNANCE_QUESTIONS = [
  { key: 'voting_members', label: 'Number of voting members of the governing body', type: 'number' as const },
  { key: 'independent_members', label: 'Number of independent voting members', type: 'number' as const },
  { key: 'material_diversion', label: 'Did the organization become aware of a material diversion of its assets?', type: 'boolean' as const },
  { key: 'delegated_management', label: 'Did the organization delegate control over management duties?', type: 'boolean' as const },
  { key: 'significant_changes', label: 'Did the organization make any significant changes to its governing documents?', type: 'boolean' as const },
  { key: 'coi_policy', label: 'Does the organization have a written conflict of interest policy?', type: 'boolean' as const },
  { key: 'whistleblower_policy', label: 'Does the organization have a written whistleblower policy?', type: 'boolean' as const },
  { key: 'document_retention', label: 'Does the organization have a written document retention and destruction policy?', type: 'boolean' as const },
  { key: 'form_990_review', label: 'Did the organization provide a copy of the Form 990 to all governing body members before filing?', type: 'boolean' as const },
  { key: 'form_990_review_process', label: 'Describe the process used to review the Form 990', type: 'text' as const },
  { key: 'compensation_process', label: 'Does the organization have a process for determining compensation of the CEO/Executive Director?', type: 'boolean' as const },
  { key: 'joint_ventures', label: 'Did the organization invest in, contribute to, or participate in any joint venture or similar arrangement?', type: 'boolean' as const },
];

export default function GovernanceStep({ section, boardMembers, onSave }: GovernanceStepProps) {
  const saved = (section?.data ?? {}) as Record<string, unknown>;

  const coiSigned = boardMembers.filter(m => m.conflict_of_interest_signed).length;
  const coiTotal = boardMembers.length;

  const [answers, setAnswers] = useState<Record<string, unknown>>(() => {
    const defaults: Record<string, unknown> = {};
    GOVERNANCE_QUESTIONS.forEach(q => {
      if (q.type === 'number') {
        defaults[q.key] = saved[q.key] ?? (q.key === 'voting_members' ? boardMembers.length : q.key === 'independent_members' ? boardMembers.length : 0);
      } else if (q.type === 'boolean') {
        defaults[q.key] = saved[q.key] ?? (q.key === 'coi_policy' ? coiTotal > 0 : false);
      } else {
        defaults[q.key] = saved[q.key] ?? '';
      }
    });
    return defaults;
  });

  useEffect(() => {
    if (section?.ai_generated && Object.keys(section.ai_generated).length > 0) {
      const ai = section.ai_generated as Record<string, { value?: unknown }>;
      setAnswers(prev => {
        const updated = { ...prev };
        for (const [key, val] of Object.entries(ai)) {
          if (val?.value !== undefined && key in updated) {
            updated[key] = val.value;
          }
        }
        return updated;
      });
    }
  }, [section?.ai_generated]);

  function update(key: string, value: unknown) {
    setAnswers(prev => ({ ...prev, [key]: value }));
  }

  const hasCOIGap = coiTotal > 0 && coiSigned < coiTotal;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-navy-800/60 border border-navy-700/40 flex items-center justify-center">
          <Shield className="w-5 h-5 text-navy-300" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">Governance, Management & Disclosure</h3>
          <p className="text-xs text-slate-500">Part VI: Governance policies and organizational practices</p>
        </div>
      </div>

      {hasCOIGap && (
        <div className="flex items-start gap-3 p-3 bg-warning-500/10 border border-warning-500/20 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-warning-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-warning-300">COI Signature Gap Detected</p>
            <p className="text-xs text-warning-400/80 mt-0.5">
              {coiSigned} of {coiTotal} board members have signed the Conflict of Interest form.
              Consider obtaining signatures before filing.
            </p>
          </div>
        </div>
      )}

      {coiTotal > 0 && !hasCOIGap && (
        <div className="flex items-start gap-3 p-3 bg-success-500/10 border border-success-500/20 rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-success-400 mt-0.5 shrink-0" />
          <p className="text-sm text-success-300">All {coiTotal} board members have signed the Conflict of Interest form.</p>
        </div>
      )}

      <div className="space-y-4">
        {GOVERNANCE_QUESTIONS.map(q => (
          <div key={q.key} className="flex items-start gap-4 py-3 border-b border-navy-800/20 last:border-0">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-300">{q.label}</p>
            </div>
            <div className="shrink-0">
              {q.type === 'boolean' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => update(q.key, true)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                      answers[q.key] === true
                        ? 'bg-success-500/20 border-success-500/40 text-success-300'
                        : 'bg-navy-800/40 border-navy-700/40 text-slate-400 hover:border-navy-600'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => update(q.key, false)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                      answers[q.key] === false
                        ? 'bg-accent-500/20 border-accent-500/40 text-accent-300'
                        : 'bg-navy-800/40 border-navy-700/40 text-slate-400 hover:border-navy-600'
                    }`}
                  >
                    No
                  </button>
                </div>
              )}
              {q.type === 'number' && (
                <input
                  type="number"
                  value={answers[q.key] as number || ''}
                  onChange={e => update(q.key, Number(e.target.value))}
                  className="input-field w-20 text-sm text-center font-mono"
                  min={0}
                />
              )}
              {q.type === 'text' && (
                <textarea
                  value={answers[q.key] as string || ''}
                  onChange={e => update(q.key, e.target.value)}
                  className="input-field w-64 text-sm min-h-[60px] resize-y"
                  placeholder="Describe..."
                />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-2">
        <button onClick={() => onSave(answers)} className="btn-primary text-sm">Save & Continue</button>
      </div>
    </div>
  );
}
