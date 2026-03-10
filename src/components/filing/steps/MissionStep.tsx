import { useState, useEffect } from 'react';
import { Target } from 'lucide-react';
import type { FilingDraftSection } from '../../../types';

interface ProgramAccomplishment {
  description: string;
  achievements: string;
  revenue: number;
  expenses: number;
}

interface MissionStepProps {
  section: FilingDraftSection | null;
  onSave: (data: Record<string, unknown>) => void;
}

export default function MissionStep({ section, onSave }: MissionStepProps) {
  const saved = (section?.data ?? {}) as Record<string, unknown>;

  const [missionStatement, setMissionStatement] = useState<string>(
    (saved.mission_statement as string) ?? ''
  );
  const [programs, setPrograms] = useState<ProgramAccomplishment[]>(
    (saved.programs as ProgramAccomplishment[]) ?? [
      { description: '', achievements: '', revenue: 0, expenses: 0 },
    ]
  );

  useEffect(() => {
    if (section?.ai_generated && Object.keys(section.ai_generated).length > 0) {
      const ai = section.ai_generated as Record<string, unknown>;
      if (ai.mission_statement && !missionStatement) {
        setMissionStatement(ai.mission_statement as string);
      }
      if (ai.program_accomplishments && programs.length === 1 && !programs[0].description) {
        setPrograms((ai.program_accomplishments as ProgramAccomplishment[]).map(p => ({
          description: p.description || '',
          achievements: p.achievements || '',
          revenue: Number(p.revenue) || 0,
          expenses: Number(p.expenses) || 0,
        })));
      }
    }
  }, [section?.ai_generated, missionStatement, programs]);

  function updateProgram(index: number, key: keyof ProgramAccomplishment, value: unknown) {
    setPrograms(prev => prev.map((p, i) => i === index ? { ...p, [key]: value } : p));
  }

  function addProgram() {
    setPrograms(prev => [...prev, { description: '', achievements: '', revenue: 0, expenses: 0 }]);
  }

  function removeProgram(index: number) {
    if (programs.length <= 1) return;
    setPrograms(prev => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-navy-800/60 border border-navy-700/40 flex items-center justify-center">
          <Target className="w-5 h-5 text-navy-300" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">Mission & Program Accomplishments</h3>
          <p className="text-xs text-slate-500">Part III: Describe your mission and up to 3 largest program services</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Mission Statement / Exempt Purpose
        </label>
        <p className="text-xs text-slate-500 mb-2">
          Briefly describe the organization's mission or most significant activities. This should match your organizing documents.
        </p>
        <textarea
          value={missionStatement}
          onChange={e => setMissionStatement(e.target.value)}
          className="input-field min-h-[120px] resize-y text-sm"
          placeholder="Describe your organization's mission..."
        />
        <p className="text-xs text-slate-500 mt-1">{missionStatement.length} characters</p>
      </div>

      <div className="border-t border-navy-800/40 pt-5">
        <p className="text-sm font-medium text-slate-300 mb-1">Program Service Accomplishments</p>
        <p className="text-xs text-slate-500 mb-4">
          Describe the organization's three largest program services, as measured by expenses.
          Include achievements, target populations, and impact where possible.
        </p>

        <div className="space-y-4">
          {programs.map((program, i) => (
            <div key={i} className="p-4 bg-navy-800/30 border border-navy-800/40 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Program {i + 1}</span>
                {programs.length > 1 && (
                  <button onClick={() => removeProgram(i)} className="text-xs text-slate-500 hover:text-accent-400 transition-colors">
                    Remove
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Description</label>
                <textarea
                  value={program.description}
                  onChange={e => updateProgram(i, 'description', e.target.value)}
                  className="input-field min-h-[80px] resize-y text-sm"
                  placeholder="Describe this program service..."
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Achievements & Impact</label>
                <textarea
                  value={program.achievements}
                  onChange={e => updateProgram(i, 'achievements', e.target.value)}
                  className="input-field min-h-[60px] resize-y text-sm"
                  placeholder="Number of people served, outcomes achieved..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Program Revenue</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                    <input
                      type="number"
                      value={program.revenue || ''}
                      onChange={e => updateProgram(i, 'revenue', Number(e.target.value))}
                      className="input-field pl-6 text-sm font-mono text-right"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Program Expenses</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                    <input
                      type="number"
                      value={program.expenses || ''}
                      onChange={e => updateProgram(i, 'expenses', Number(e.target.value))}
                      className="input-field pl-6 text-sm font-mono text-right"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {programs.length < 3 && (
          <button onClick={addProgram} className="btn-secondary text-sm mt-3 w-full flex items-center justify-center gap-2">
            Add Program Service
          </button>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <button onClick={() => onSave({ mission_statement: missionStatement, programs })} className="btn-primary text-sm">Save & Continue</button>
      </div>
    </div>
  );
}
