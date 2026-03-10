import { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import { formatCurrency } from '../../../lib/utils';
import type { FilingDraftSection } from '../../../types';

interface RevenueStepProps {
  section: FilingDraftSection | null;
  donationTotals: { total: number; restricted: number; unrestricted: number };
  grantTotals: { total: number; restricted: number; unrestricted: number };
  onSave: (data: Record<string, unknown>) => void;
}

function num(val: unknown): number {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

export default function RevenueStep({ section, donationTotals, grantTotals, onSave }: RevenueStepProps) {
  const saved = (section?.data ?? {}) as Record<string, unknown>;

  const [fields, setFields] = useState({
    contributions: num(saved.contributions) || donationTotals.total + grantTotals.total,
    program_service_revenue: num(saved.program_service_revenue),
    membership_dues: num(saved.membership_dues),
    investment_income: num(saved.investment_income),
    rental_income: num(saved.rental_income),
    royalties: num(saved.royalties),
    net_fundraising: num(saved.net_fundraising),
    net_gaming: num(saved.net_gaming),
    net_inventory_sales: num(saved.net_inventory_sales),
    other_revenue: num(saved.other_revenue),
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

  const totalRevenue =
    fields.contributions +
    fields.program_service_revenue +
    fields.membership_dues +
    fields.investment_income +
    fields.rental_income +
    fields.royalties +
    fields.net_fundraising +
    fields.net_gaming +
    fields.net_inventory_sales +
    fields.other_revenue;

  function handleSave() {
    onSave({ ...fields, total_revenue: totalRevenue });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-navy-800/60 border border-navy-700/40 flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-navy-300" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">Statement of Revenue</h3>
          <p className="text-xs text-slate-500">All revenue sources for the tax year</p>
        </div>
      </div>

      {(donationTotals.total > 0 || grantTotals.total > 0) && (
        <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-lg">
          <p className="text-xs text-teal-300 font-medium mb-2">Pre-populated from your records</p>
          <div className="grid grid-cols-2 gap-3 text-xs text-teal-400/80">
            <div>Donations: {formatCurrency(donationTotals.total)}</div>
            <div>Grants: {formatCurrency(grantTotals.total)}</div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <RevenueRow label="Contributions, gifts, grants" sublabel="Line 1" value={fields.contributions} onChange={v => update('contributions', v)} />
        <RevenueRow label="Program service revenue" sublabel="Line 2" value={fields.program_service_revenue} onChange={v => update('program_service_revenue', v)} />
        <RevenueRow label="Membership dues" sublabel="Line 3" value={fields.membership_dues} onChange={v => update('membership_dues', v)} />
        <RevenueRow label="Investment income" sublabel="Line 4" value={fields.investment_income} onChange={v => update('investment_income', v)} />
        <RevenueRow label="Rental income" sublabel="Line 6a" value={fields.rental_income} onChange={v => update('rental_income', v)} />
        <RevenueRow label="Royalties" sublabel="Line 5" value={fields.royalties} onChange={v => update('royalties', v)} />
        <RevenueRow label="Net fundraising events" sublabel="Line 8a" value={fields.net_fundraising} onChange={v => update('net_fundraising', v)} />
        <RevenueRow label="Net gaming revenue" sublabel="Line 9a" value={fields.net_gaming} onChange={v => update('net_gaming', v)} />
        <RevenueRow label="Net inventory sales" sublabel="Line 10a" value={fields.net_inventory_sales} onChange={v => update('net_inventory_sales', v)} />
        <RevenueRow label="Other revenue" sublabel="Line 11" value={fields.other_revenue} onChange={v => update('other_revenue', v)} />
      </div>

      <div className="flex items-center justify-between p-4 bg-navy-800/40 border border-navy-700/40 rounded-lg">
        <span className="text-sm font-semibold text-white">Total Revenue (Line 12)</span>
        <span className="text-lg font-bold text-white font-mono">{formatCurrency(totalRevenue)}</span>
      </div>

      <div className="flex justify-end pt-2">
        <button onClick={handleSave} className="btn-primary text-sm">Save & Continue</button>
      </div>
    </div>
  );
}

function RevenueRow({ label, sublabel, value, onChange }: { label: string; sublabel: string; value: number; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-300">{label}</p>
        <p className="text-xs text-slate-500">{sublabel}</p>
      </div>
      <div className="w-40">
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
