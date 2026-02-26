import { CheckCircle2, AlertTriangle, AlertCircle, Clock, Minus } from 'lucide-react';

interface StatusBadgeProps {
  status: 'overdue' | 'urgent' | 'upcoming' | 'ok' | 'none' | 'complete' | 'pending' | 'filed' | 'extended' | 'active' | 'closed' | 'reporting_due';
  label?: string;
}

const configs: Record<string, { className: string; icon: typeof CheckCircle2; defaultLabel: string }> = {
  overdue: { className: 'badge-danger', icon: AlertCircle, defaultLabel: 'Overdue' },
  urgent: { className: 'badge-warning', icon: AlertTriangle, defaultLabel: 'Due Soon' },
  upcoming: { className: 'badge-neutral', icon: Clock, defaultLabel: 'Upcoming' },
  ok: { className: 'badge-success', icon: CheckCircle2, defaultLabel: 'On Track' },
  complete: { className: 'badge-success', icon: CheckCircle2, defaultLabel: 'Complete' },
  filed: { className: 'badge-success', icon: CheckCircle2, defaultLabel: 'Filed' },
  extended: { className: 'badge-warning', icon: Clock, defaultLabel: 'Extended' },
  pending: { className: 'badge-neutral', icon: Clock, defaultLabel: 'Pending' },
  active: { className: 'badge-success', icon: CheckCircle2, defaultLabel: 'Active' },
  closed: { className: 'badge-neutral', icon: Minus, defaultLabel: 'Closed' },
  reporting_due: { className: 'badge-warning', icon: AlertTriangle, defaultLabel: 'Report Due' },
  none: { className: 'badge-neutral', icon: Minus, defaultLabel: 'No Date' },
};

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = configs[status] ?? configs.none;
  const Icon = config.icon;
  return (
    <span className={config.className}>
      <Icon className="w-3 h-3" />
      {label ?? config.defaultLabel}
    </span>
  );
}
