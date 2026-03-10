import { CheckCircle2, AlertTriangle, AlertCircle, FileText, ExternalLink } from 'lucide-react';
import { formatCurrency } from '../../../lib/utils';
import type { FilingDraftSection, FilingSectionDef } from '../../../types';

interface ReviewStepProps {
  sections: FilingDraftSection[];
  sectionDefs: FilingSectionDef[];
  formType: string;
  onGoToStep: (step: number) => void;
  onFinalize: () => void;
}

interface ValidationItem {
  severity: 'error' | 'warning' | 'info';
  message: string;
  section?: string;
  stepIndex?: number;
}

function validate(sections: FilingDraftSection[], sectionDefs: FilingSectionDef[]): ValidationItem[] {
  const items: ValidationItem[] = [];
  const getSection = (key: string) => sections.find(s => s.section_key === key);

  const orgInfo = getSection('org_info');
  if (!orgInfo || !orgInfo.data.legal_name) {
    items.push({ severity: 'error', message: 'Legal name is required', section: 'org_info', stepIndex: 0 });
  }
  if (!orgInfo || !orgInfo.data.ein) {
    items.push({ severity: 'error', message: 'EIN is required', section: 'org_info', stepIndex: 0 });
  }
  if (!orgInfo?.data.address_line1) {
    items.push({ severity: 'warning', message: 'Mailing address is missing', section: 'org_info', stepIndex: 0 });
  }
  if (!orgInfo?.data.principal_officer_name) {
    items.push({ severity: 'warning', message: 'Principal officer not specified', section: 'org_info', stepIndex: 0 });
  }

  const revenue = getSection('revenue');
  if (revenue) {
    const total = Number(revenue.data.total_revenue) || 0;
    if (total === 0) {
      items.push({ severity: 'warning', message: 'Total revenue is $0 — verify this is correct', section: 'revenue', stepIndex: 1 });
    }
  } else {
    const idx = sectionDefs.findIndex(s => s.key === 'revenue');
    if (idx >= 0) items.push({ severity: 'error', message: 'Revenue section not completed', section: 'revenue', stepIndex: idx });
  }

  const expenses = getSection('expenses');
  if (expenses) {
    const pct = Number(expenses.data.program_pct || 0) + Number(expenses.data.management_pct || 0) + Number(expenses.data.fundraising_pct || 0);
    if (pct !== 100) {
      items.push({ severity: 'error', message: `Expense allocation totals ${pct}% instead of 100%`, section: 'expenses', stepIndex: sectionDefs.findIndex(s => s.key === 'expenses') });
    }
  }

  const officers = getSection('officers');
  if (officers) {
    const list = (officers.data.officers as Array<{ name: string }>) || [];
    if (list.length === 0) {
      items.push({ severity: 'error', message: 'At least one officer or director must be listed', section: 'officers', stepIndex: sectionDefs.findIndex(s => s.key === 'officers') });
    }
    list.forEach((o, i) => {
      if (!o.name) items.push({ severity: 'warning', message: `Officer ${i + 1} is missing a name`, section: 'officers', stepIndex: sectionDefs.findIndex(s => s.key === 'officers') });
    });
  }

  const mission = getSection('mission');
  if (mission) {
    if (!mission.data.mission_statement) {
      items.push({ severity: 'error', message: 'Mission statement is required', section: 'mission', stepIndex: sectionDefs.findIndex(s => s.key === 'mission') });
    }
  }

  const financial = getSection('financial_statements');
  if (financial && financial.data.is_balanced === false) {
    items.push({ severity: 'error', message: 'Balance sheet is not balanced', section: 'financial_statements', stepIndex: sectionDefs.findIndex(s => s.key === 'financial_statements') });
  }

  for (const def of sectionDefs) {
    const sec = getSection(def.key);
    if (!sec || sec.status === 'not_started') {
      items.push({ severity: 'info', message: `"${def.label}" has not been started`, section: def.key, stepIndex: sectionDefs.indexOf(def) });
    }
  }

  return items;
}

export default function ReviewStep({ sections, sectionDefs, formType, onGoToStep, onFinalize }: ReviewStepProps) {
  const validationItems = validate(sections, sectionDefs);
  const errors = validationItems.filter(i => i.severity === 'error');
  const warnings = validationItems.filter(i => i.severity === 'warning');
  const info = validationItems.filter(i => i.severity === 'info');

  const getSection = (key: string) => sections.find(s => s.section_key === key);

  const revenue = getSection('revenue');
  const expenses = getSection('expenses');
  const officers = getSection('officers');
  const orgInfo = getSection('org_info');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-navy-800/60 border border-navy-700/40 flex items-center justify-center">
          <FileText className="w-5 h-5 text-navy-300" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">Review & Finalize</h3>
          <p className="text-xs text-slate-500">Review your Form {formType} before marking it ready for filing</p>
        </div>
      </div>

      {errors.length === 0 && warnings.length === 0 && (
        <div className="flex items-center gap-3 p-4 bg-success-500/10 border border-success-500/20 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-success-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-success-300">All validations passed</p>
            <p className="text-xs text-success-400/80">Your filing data looks complete and consistent.</p>
          </div>
        </div>
      )}

      {errors.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-accent-400 uppercase tracking-wider">{errors.length} Error{errors.length !== 1 ? 's' : ''} - Must Fix</p>
          {errors.map((item, i) => (
            <button
              key={i}
              onClick={() => item.stepIndex !== undefined && onGoToStep(item.stepIndex)}
              className="w-full flex items-center gap-3 p-3 bg-accent-500/10 border border-accent-500/20 rounded-lg hover:bg-accent-500/15 transition-colors text-left"
            >
              <AlertCircle className="w-4 h-4 text-accent-400 shrink-0" />
              <span className="text-sm text-accent-300 flex-1">{item.message}</span>
              <ExternalLink className="w-3.5 h-3.5 text-accent-500 shrink-0" />
            </button>
          ))}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-warning-400 uppercase tracking-wider">{warnings.length} Warning{warnings.length !== 1 ? 's' : ''}</p>
          {warnings.map((item, i) => (
            <button
              key={i}
              onClick={() => item.stepIndex !== undefined && onGoToStep(item.stepIndex)}
              className="w-full flex items-center gap-3 p-3 bg-warning-500/10 border border-warning-500/20 rounded-lg hover:bg-warning-500/15 transition-colors text-left"
            >
              <AlertTriangle className="w-4 h-4 text-warning-400 shrink-0" />
              <span className="text-sm text-warning-300 flex-1">{item.message}</span>
              <ExternalLink className="w-3.5 h-3.5 text-warning-500 shrink-0" />
            </button>
          ))}
        </div>
      )}

      {info.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Incomplete Sections</p>
          {info.map((item, i) => (
            <button
              key={i}
              onClick={() => item.stepIndex !== undefined && onGoToStep(item.stepIndex)}
              className="w-full flex items-center gap-3 p-2.5 bg-navy-800/30 border border-navy-800/40 rounded-lg hover:bg-navy-800/50 transition-colors text-left"
            >
              <div className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />
              <span className="text-sm text-slate-400 flex-1">{item.message}</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            </button>
          ))}
        </div>
      )}

      <div className="border-t border-navy-800/40 pt-5">
        <h4 className="text-sm font-semibold text-white mb-4">Filing Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SummaryCard
            label="Organization"
            items={[
              { key: 'Name', value: (orgInfo?.data.legal_name as string) || '—' },
              { key: 'EIN', value: (orgInfo?.data.ein as string) || '—' },
              { key: 'Form Type', value: formType },
            ]}
          />
          <SummaryCard
            label="Financials"
            items={[
              { key: 'Total Revenue', value: revenue ? formatCurrency(Number(revenue.data.total_revenue) || 0) : '—' },
              { key: 'Total Expenses', value: expenses ? formatCurrency(Number(expenses.data.total_expenses) || 0) : '—' },
              { key: 'Net', value: revenue && expenses ? formatCurrency((Number(revenue.data.total_revenue) || 0) - (Number(expenses.data.total_expenses) || 0)) : '—' },
            ]}
          />
          <SummaryCard
            label="Governance"
            items={[
              { key: 'Officers Listed', value: officers ? String((officers.data.officers as unknown[])?.length || 0) : '0' },
              { key: 'Total Compensation', value: officers ? formatCurrency(Number(officers.data.total_compensation) || 0) : '$0' },
            ]}
          />
          <SummaryCard
            label="Sections Completed"
            items={sectionDefs.map(def => {
              const sec = getSection(def.key);
              return { key: def.label, value: sec ? (sec.status === 'reviewed' ? 'Reviewed' : sec.status === 'ai_drafted' ? 'AI Drafted' : 'In Progress') : 'Not Started' };
            })}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-navy-800/40">
        <button
          onClick={onFinalize}
          disabled={errors.length > 0}
          className="btn-primary text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <CheckCircle2 className="w-4 h-4" />
          {errors.length > 0 ? 'Fix Errors to Continue' : 'Mark Ready for Filing'}
        </button>
      </div>
    </div>
  );
}

function SummaryCard({ label, items }: { label: string; items: { key: string; value: string }[] }) {
  return (
    <div className="p-4 bg-navy-800/30 border border-navy-800/40 rounded-lg">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">{label}</p>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-xs text-slate-500">{item.key}</span>
            <span className="text-xs font-medium text-slate-300">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
