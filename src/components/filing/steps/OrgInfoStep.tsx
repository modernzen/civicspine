import { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import type { Organization, FilingDraftSection } from '../../../types';

interface OrgInfoStepProps {
  organization: Organization;
  section: FilingDraftSection | null;
  onSave: (data: Record<string, unknown>) => void;
}

export default function OrgInfoStep({ organization, section, onSave }: OrgInfoStepProps) {
  const saved = (section?.data ?? {}) as Record<string, string>;

  const [fields, setFields] = useState({
    legal_name: saved.legal_name ?? organization.name ?? '',
    ein: saved.ein ?? organization.ein ?? '',
    address_line1: saved.address_line1 ?? '',
    address_line2: saved.address_line2 ?? '',
    city: saved.city ?? '',
    state: saved.state ?? '',
    zip: saved.zip ?? '',
    phone: saved.phone ?? '',
    website: saved.website ?? '',
    formation_year: saved.formation_year ?? '',
    state_of_domicile: saved.state_of_domicile ?? '',
    principal_officer_name: saved.principal_officer_name ?? '',
    principal_officer_title: saved.principal_officer_title ?? '',
    group_exemption_number: saved.group_exemption_number ?? '',
    tax_exempt_status: saved.tax_exempt_status ?? '501(c)(3)',
    activity_codes: saved.activity_codes ?? '',
  });

  useEffect(() => {
    if (section?.ai_generated && Object.keys(section.ai_generated).length > 0) {
      const ai = section.ai_generated as Record<string, { value?: string }>;
      setFields(prev => {
        const updated = { ...prev };
        for (const [key, val] of Object.entries(ai)) {
          if (val?.value && key in updated && !updated[key as keyof typeof updated]) {
            (updated as Record<string, string>)[key] = val.value;
          }
        }
        return updated;
      });
    }
  }, [section?.ai_generated]);

  function update(key: string, value: string) {
    setFields(prev => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    onSave(fields);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-navy-800/60 border border-navy-700/40 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-navy-300" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">Organization Information</h3>
          <p className="text-xs text-slate-500">Header information that appears on every page of the form</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Legal Name (as shown on IRS records)</label>
          <input type="text" value={fields.legal_name} onChange={e => update('legal_name', e.target.value)} className="input-field" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">EIN</label>
          <input type="text" value={fields.ein} onChange={e => update('ein', e.target.value)} className="input-field font-mono" placeholder="XX-XXXXXXX" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Phone</label>
          <input type="tel" value={fields.phone} onChange={e => update('phone', e.target.value)} className="input-field" placeholder="(555) 123-4567" />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Address Line 1</label>
          <input type="text" value={fields.address_line1} onChange={e => update('address_line1', e.target.value)} className="input-field" placeholder="Street address or P.O. Box" />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Address Line 2</label>
          <input type="text" value={fields.address_line2} onChange={e => update('address_line2', e.target.value)} className="input-field" placeholder="Suite, floor, etc. (optional)" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">City</label>
          <input type="text" value={fields.city} onChange={e => update('city', e.target.value)} className="input-field" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">State</label>
            <input type="text" value={fields.state} onChange={e => update('state', e.target.value)} className="input-field" placeholder="CA" maxLength={2} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">ZIP</label>
            <input type="text" value={fields.zip} onChange={e => update('zip', e.target.value)} className="input-field" placeholder="90210" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Website</label>
          <input type="url" value={fields.website} onChange={e => update('website', e.target.value)} className="input-field" placeholder="https://..." />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Year of Formation</label>
          <input type="text" value={fields.formation_year} onChange={e => update('formation_year', e.target.value)} className="input-field" placeholder="2010" maxLength={4} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">State of Legal Domicile</label>
          <input type="text" value={fields.state_of_domicile} onChange={e => update('state_of_domicile', e.target.value)} className="input-field" placeholder="CA" maxLength={2} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Tax-Exempt Status</label>
          <input type="text" value={fields.tax_exempt_status} onChange={e => update('tax_exempt_status', e.target.value)} className="input-field" />
        </div>

        <div className="md:col-span-2 border-t border-navy-800/40 pt-4 mt-2">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Principal Officer</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Name</label>
              <input type="text" value={fields.principal_officer_name} onChange={e => update('principal_officer_name', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Title</label>
              <input type="text" value={fields.principal_officer_title} onChange={e => update('principal_officer_title', e.target.value)} className="input-field" placeholder="Executive Director" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button onClick={handleSave} className="btn-primary text-sm">Save & Continue</button>
      </div>
    </div>
  );
}
