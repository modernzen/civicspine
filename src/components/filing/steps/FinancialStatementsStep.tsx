import { useState, useEffect } from 'react';
import { BookOpen, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../../lib/utils';
import type { FilingDraftSection } from '../../../types';

interface FinancialStatementsStepProps {
  section: FilingDraftSection | null;
  onSave: (data: Record<string, unknown>) => void;
}

function num(val: unknown): number {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

export default function FinancialStatementsStep({ section, onSave }: FinancialStatementsStepProps) {
  const saved = (section?.data ?? {}) as Record<string, unknown>;

  const [assets, setAssets] = useState({
    cash: num(saved.cash),
    savings: num(saved.savings),
    pledges_receivable: num(saved.pledges_receivable),
    accounts_receivable: num(saved.accounts_receivable),
    prepaid_expenses: num(saved.prepaid_expenses),
    investments_securities: num(saved.investments_securities),
    investments_other: num(saved.investments_other),
    land_buildings_equipment: num(saved.land_buildings_equipment),
    other_assets: num(saved.other_assets),
  });

  const [liabilities, setLiabilities] = useState({
    accounts_payable: num(saved.accounts_payable),
    grants_payable: num(saved.grants_payable),
    deferred_revenue: num(saved.deferred_revenue),
    tax_exempt_bonds: num(saved.tax_exempt_bonds),
    mortgages: num(saved.mortgages),
    other_liabilities: num(saved.other_liabilities),
  });

  const [netAssets, setNetAssets] = useState({
    unrestricted: num(saved.unrestricted),
    temporarily_restricted: num(saved.temporarily_restricted),
    permanently_restricted: num(saved.permanently_restricted),
  });

  useEffect(() => {
    if (section?.ai_generated && Object.keys(section.ai_generated).length > 0) {
      const ai = section.ai_generated as Record<string, { value?: number }>;
      const assetUpdates: Record<string, number> = {};
      const liabUpdates: Record<string, number> = {};
      const netUpdates: Record<string, number> = {};

      for (const [key, val] of Object.entries(ai)) {
        if (val?.value !== undefined) {
          if (key in assets) assetUpdates[key] = val.value;
          else if (key in liabilities) liabUpdates[key] = val.value;
          else if (key in netAssets) netUpdates[key] = val.value;
        }
      }

      if (Object.keys(assetUpdates).length) setAssets(prev => ({ ...prev, ...assetUpdates }));
      if (Object.keys(liabUpdates).length) setLiabilities(prev => ({ ...prev, ...liabUpdates }));
      if (Object.keys(netUpdates).length) setNetAssets(prev => ({ ...prev, ...netUpdates }));
    }
  }, [section?.ai_generated]);

  const totalAssets = Object.values(assets).reduce((s, v) => s + v, 0);
  const totalLiabilities = Object.values(liabilities).reduce((s, v) => s + v, 0);
  const totalNetAssets = Object.values(netAssets).reduce((s, v) => s + v, 0);
  const balanceCheck = totalAssets - (totalLiabilities + totalNetAssets);
  const isBalanced = Math.abs(balanceCheck) < 1;

  function handleSave() {
    onSave({
      ...assets,
      ...liabilities,
      ...netAssets,
      total_assets: totalAssets,
      total_liabilities: totalLiabilities,
      total_net_assets: totalNetAssets,
      is_balanced: isBalanced,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-navy-800/60 border border-navy-700/40 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-navy-300" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">Financial Statements</h3>
          <p className="text-xs text-slate-500">Part X: Balance Sheet at end of year</p>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Assets</h4>
        <div className="space-y-2">
          <BalanceRow label="Cash - non-interest-bearing" value={assets.cash} onChange={v => setAssets(p => ({ ...p, cash: v }))} />
          <BalanceRow label="Savings and temporary investments" value={assets.savings} onChange={v => setAssets(p => ({ ...p, savings: v }))} />
          <BalanceRow label="Pledges and grants receivable" value={assets.pledges_receivable} onChange={v => setAssets(p => ({ ...p, pledges_receivable: v }))} />
          <BalanceRow label="Accounts receivable" value={assets.accounts_receivable} onChange={v => setAssets(p => ({ ...p, accounts_receivable: v }))} />
          <BalanceRow label="Prepaid expenses" value={assets.prepaid_expenses} onChange={v => setAssets(p => ({ ...p, prepaid_expenses: v }))} />
          <BalanceRow label="Investments - securities" value={assets.investments_securities} onChange={v => setAssets(p => ({ ...p, investments_securities: v }))} />
          <BalanceRow label="Investments - other" value={assets.investments_other} onChange={v => setAssets(p => ({ ...p, investments_other: v }))} />
          <BalanceRow label="Land, buildings, and equipment" value={assets.land_buildings_equipment} onChange={v => setAssets(p => ({ ...p, land_buildings_equipment: v }))} />
          <BalanceRow label="Other assets" value={assets.other_assets} onChange={v => setAssets(p => ({ ...p, other_assets: v }))} />
          <div className="flex items-center justify-between pt-2 border-t border-navy-800/30">
            <span className="text-sm font-semibold text-slate-300">Total Assets</span>
            <span className="text-sm font-bold text-white font-mono">{formatCurrency(totalAssets)}</span>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Liabilities</h4>
        <div className="space-y-2">
          <BalanceRow label="Accounts payable" value={liabilities.accounts_payable} onChange={v => setLiabilities(p => ({ ...p, accounts_payable: v }))} />
          <BalanceRow label="Grants payable" value={liabilities.grants_payable} onChange={v => setLiabilities(p => ({ ...p, grants_payable: v }))} />
          <BalanceRow label="Deferred revenue" value={liabilities.deferred_revenue} onChange={v => setLiabilities(p => ({ ...p, deferred_revenue: v }))} />
          <BalanceRow label="Tax-exempt bond liabilities" value={liabilities.tax_exempt_bonds} onChange={v => setLiabilities(p => ({ ...p, tax_exempt_bonds: v }))} />
          <BalanceRow label="Mortgages and notes payable" value={liabilities.mortgages} onChange={v => setLiabilities(p => ({ ...p, mortgages: v }))} />
          <BalanceRow label="Other liabilities" value={liabilities.other_liabilities} onChange={v => setLiabilities(p => ({ ...p, other_liabilities: v }))} />
          <div className="flex items-center justify-between pt-2 border-t border-navy-800/30">
            <span className="text-sm font-semibold text-slate-300">Total Liabilities</span>
            <span className="text-sm font-bold text-white font-mono">{formatCurrency(totalLiabilities)}</span>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Net Assets / Fund Balances</h4>
        <div className="space-y-2">
          <BalanceRow label="Unrestricted net assets" value={netAssets.unrestricted} onChange={v => setNetAssets(p => ({ ...p, unrestricted: v }))} />
          <BalanceRow label="Temporarily restricted net assets" value={netAssets.temporarily_restricted} onChange={v => setNetAssets(p => ({ ...p, temporarily_restricted: v }))} />
          <BalanceRow label="Permanently restricted net assets" value={netAssets.permanently_restricted} onChange={v => setNetAssets(p => ({ ...p, permanently_restricted: v }))} />
          <div className="flex items-center justify-between pt-2 border-t border-navy-800/30">
            <span className="text-sm font-semibold text-slate-300">Total Net Assets</span>
            <span className="text-sm font-bold text-white font-mono">{formatCurrency(totalNetAssets)}</span>
          </div>
        </div>
      </div>

      <div className={`p-4 rounded-lg border flex items-center gap-3 ${
        isBalanced
          ? 'bg-success-500/10 border-success-500/20'
          : 'bg-warning-500/10 border-warning-500/20'
      }`}>
        {isBalanced ? (
          <>
            <CheckCircle2 className="w-5 h-5 text-success-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-success-300">Balance Sheet Reconciled</p>
              <p className="text-xs text-success-400/80">Total Assets = Total Liabilities + Total Net Assets</p>
            </div>
          </>
        ) : (
          <>
            <AlertTriangle className="w-5 h-5 text-warning-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-warning-300">Balance Sheet Out of Balance</p>
              <p className="text-xs text-warning-400/80">
                Difference: {formatCurrency(Math.abs(balanceCheck))} — Assets must equal Liabilities + Net Assets
              </p>
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <button onClick={handleSave} className="btn-primary text-sm">Save & Continue</button>
      </div>
    </div>
  );
}

function BalanceRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-4">
      <span className="flex-1 text-sm text-slate-300">{label}</span>
      <div className="w-36">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
          <input
            type="number"
            value={value || ''}
            onChange={e => onChange(Number(e.target.value) || 0)}
            className="input-field pl-7 text-right font-mono text-sm"
            placeholder="0"
          />
        </div>
      </div>
    </div>
  );
}
