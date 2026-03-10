import { useState, useEffect } from 'react';
import { Receipt } from 'lucide-react';
import { formatCurrency } from '../../../lib/utils';
import type { FilingDraftSection } from '../../../types';

interface ExpensesStepProps {
  section: FilingDraftSection | null;
  onSave: (data: Record<string, unknown>) => void;
}

function num(val: unknown): number {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

export default function ExpensesStep({ section, onSave }: ExpensesStepProps) {
  const saved = (section?.data ?? {}) as Record<string, unknown>;

  const [fields, setFields] = useState({
    grants_paid: num(saved.grants_paid),
    benefits_paid: num(saved.benefits_paid),
    salaries: num(saved.salaries),
    employee_benefits: num(saved.employee_benefits),
    payroll_taxes: num(saved.payroll_taxes),
    professional_fees: num(saved.professional_fees),
    accounting_fees: num(saved.accounting_fees),
    legal_fees: num(saved.legal_fees),
    office_expenses: num(saved.office_expenses),
    information_technology: num(saved.information_technology),
    occupancy: num(saved.occupancy),
    travel: num(saved.travel),
    conferences: num(saved.conferences),
    interest: num(saved.interest),
    depreciation: num(saved.depreciation),
    insurance: num(saved.insurance),
    other_expenses: num(saved.other_expenses),
    program_pct: num(saved.program_pct) || 70,
    management_pct: num(saved.management_pct) || 20,
    fundraising_pct: num(saved.fundraising_pct) || 10,
  });

  useEffect(() => {
    if (section?.ai_generated && Object.keys(section.ai_generated).length > 0) {
      const ai = section.ai_generated as Record<string, { value?: number }>;
      setFields(prev => {
        const updated = { ...prev };
        for (const [key, val] of Object.entries(ai)) {
          if (val?.value !== undefined && key in updated && !(updated as Record<string, number>)[key]) {
            (updated as Record<string, number>)[key] = val.value;
          }
        }
        return updated;
      });
    }
  }, [section?.ai_generated]);

  function update(key: string, value: string) {
    setFields(prev => ({ ...prev, [key]: Number(value) || 0 }));
  }

  const totalExpenses =
    fields.grants_paid + fields.benefits_paid + fields.salaries +
    fields.employee_benefits + fields.payroll_taxes + fields.professional_fees +
    fields.accounting_fees + fields.legal_fees + fields.office_expenses +
    fields.information_technology + fields.occupancy + fields.travel +
    fields.conferences + fields.interest + fields.depreciation +
    fields.insurance + fields.other_expenses;

  const programExpenses = Math.round(totalExpenses * (fields.program_pct / 100));
  const managementExpenses = Math.round(totalExpenses * (fields.management_pct / 100));
  const fundraisingExpenses = totalExpenses - programExpenses - managementExpenses;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-navy-800/60 border border-navy-700/40 flex items-center justify-center">
          <Receipt className="w-5 h-5 text-navy-300" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">Statement of Functional Expenses</h3>
          <p className="text-xs text-slate-500">Report expenses by natural classification and allocate across functions</p>
        </div>
      </div>

      <div className="space-y-3">
        <ExpenseRow label="Grants and similar amounts paid" value={fields.grants_paid} onChange={v => update('grants_paid', v)} />
        <ExpenseRow label="Benefits paid to or for members" value={fields.benefits_paid} onChange={v => update('benefits_paid', v)} />
        <ExpenseRow label="Salaries, other compensation" value={fields.salaries} onChange={v => update('salaries', v)} />
        <ExpenseRow label="Employee benefits (non-pension)" value={fields.employee_benefits} onChange={v => update('employee_benefits', v)} />
        <ExpenseRow label="Payroll taxes" value={fields.payroll_taxes} onChange={v => update('payroll_taxes', v)} />
        <ExpenseRow label="Professional fundraising fees" value={fields.professional_fees} onChange={v => update('professional_fees', v)} />
        <ExpenseRow label="Accounting fees" value={fields.accounting_fees} onChange={v => update('accounting_fees', v)} />
        <ExpenseRow label="Legal fees" value={fields.legal_fees} onChange={v => update('legal_fees', v)} />
        <ExpenseRow label="Office expenses" value={fields.office_expenses} onChange={v => update('office_expenses', v)} />
        <ExpenseRow label="Information technology" value={fields.information_technology} onChange={v => update('information_technology', v)} />
        <ExpenseRow label="Occupancy" value={fields.occupancy} onChange={v => update('occupancy', v)} />
        <ExpenseRow label="Travel" value={fields.travel} onChange={v => update('travel', v)} />
        <ExpenseRow label="Conferences and meetings" value={fields.conferences} onChange={v => update('conferences', v)} />
        <ExpenseRow label="Interest" value={fields.interest} onChange={v => update('interest', v)} />
        <ExpenseRow label="Depreciation and depletion" value={fields.depreciation} onChange={v => update('depreciation', v)} />
        <ExpenseRow label="Insurance" value={fields.insurance} onChange={v => update('insurance', v)} />
        <ExpenseRow label="Other expenses" value={fields.other_expenses} onChange={v => update('other_expenses', v)} />
      </div>

      <div className="p-4 bg-navy-800/40 border border-navy-700/40 rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white">Total Expenses</span>
          <span className="text-lg font-bold text-white font-mono">{formatCurrency(totalExpenses)}</span>
        </div>

        <div className="border-t border-navy-700/40 pt-3">
          <p className="text-xs text-slate-400 mb-3">Functional Expense Allocation (%)</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Program Services</label>
              <input type="number" value={fields.program_pct} onChange={e => update('program_pct', e.target.value)} className="input-field text-sm text-center font-mono" min={0} max={100} />
              <p className="text-xs text-slate-500 mt-1 text-center">{formatCurrency(programExpenses)}</p>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Management</label>
              <input type="number" value={fields.management_pct} onChange={e => update('management_pct', e.target.value)} className="input-field text-sm text-center font-mono" min={0} max={100} />
              <p className="text-xs text-slate-500 mt-1 text-center">{formatCurrency(managementExpenses)}</p>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Fundraising</label>
              <input type="number" value={fields.fundraising_pct} onChange={e => update('fundraising_pct', e.target.value)} className="input-field text-sm text-center font-mono" min={0} max={100} />
              <p className="text-xs text-slate-500 mt-1 text-center">{formatCurrency(fundraisingExpenses)}</p>
            </div>
          </div>
          {fields.program_pct + fields.management_pct + fields.fundraising_pct !== 100 && (
            <p className="text-xs text-warning-400 mt-2">Allocation percentages should total 100%</p>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button onClick={() => onSave({
          ...fields,
          total_expenses: totalExpenses,
          program_expenses: programExpenses,
          management_expenses: managementExpenses,
          fundraising_expenses: fundraisingExpenses,
        })} className="btn-primary text-sm">Save & Continue</button>
      </div>
    </div>
  );
}

function ExpenseRow({ label, value, onChange }: { label: string; value: number; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-4">
      <span className="flex-1 text-sm text-slate-300">{label}</span>
      <div className="w-36">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
          <input
            type="number"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            className="input-field pl-7 text-right font-mono text-sm"
            placeholder="0"
          />
        </div>
      </div>
    </div>
  );
}
