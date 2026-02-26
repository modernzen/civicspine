import { daysUntil, getDeadlineStatus } from '../../lib/utils';

interface DeadlineCountdownProps {
  date: string | null;
  label?: string;
}

export default function DeadlineCountdown({ date, label }: DeadlineCountdownProps) {
  const days = daysUntil(date);
  const status = getDeadlineStatus(date);

  if (days === null) return <span className="text-slate-500 text-sm">No deadline set</span>;

  const colors = {
    overdue: 'text-accent-400',
    urgent: 'text-warning-400',
    upcoming: 'text-slate-300',
    ok: 'text-success-400',
    none: 'text-slate-500',
  };

  const bgColors = {
    overdue: 'bg-accent-500/10 border-accent-500/20',
    urgent: 'bg-warning-500/10 border-warning-500/20',
    upcoming: 'bg-navy-700/30 border-navy-700/40',
    ok: 'bg-success-500/10 border-success-500/20',
    none: 'bg-navy-700/30 border-navy-700/40',
  };

  return (
    <div className={`inline-flex items-center gap-3 px-4 py-2.5 rounded-xl border ${bgColors[status]}`}>
      <div>
        <span className={`text-2xl font-bold tabular-nums ${colors[status]}`}>
          {Math.abs(days)}
        </span>
        <span className={`text-xs ml-1 ${colors[status]} opacity-70`}>
          {days < 0 ? 'days overdue' : 'days left'}
        </span>
      </div>
      {label && <span className="text-xs text-slate-500 border-l border-navy-700/50 pl-3">{label}</span>}
    </div>
  );
}
