import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FileCheck2,
  MapPin,
  Landmark,
  Users2,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
} from 'lucide-react';
import { getDeadlineStatus, formatDate, daysUntil } from '../../lib/utils';
import type { ComplianceTask, StateRegistration, Grant, BoardMember } from '../../types';
import { format, parseISO, isValid, startOfMonth, endOfMonth, isWithinInterval, addMonths } from 'date-fns';

interface TimelineEvent {
  id: string;
  label: string;
  date: string;
  category: 'compliance' | 'state' | 'grant' | 'board';
  link: string;
  status: ReturnType<typeof getDeadlineStatus>;
  days: number | null;
}

interface ComplianceTimelineProps {
  tasks: ComplianceTask[];
  states: StateRegistration[];
  grants: Grant[];
  boardMembers: BoardMember[];
}

const categoryConfig = {
  compliance: { icon: FileCheck2, label: 'Compliance', color: 'bg-navy-600/30 text-navy-300 border-navy-600/40' },
  state: { icon: MapPin, label: 'State', color: 'bg-warning-500/10 text-warning-400 border-warning-500/20' },
  grant: { icon: Landmark, label: 'Grant', color: 'bg-success-500/10 text-success-400 border-success-500/20' },
  board: { icon: Users2, label: 'Board', color: 'bg-accent-500/10 text-accent-400 border-accent-500/20' },
};

const statusIcon = {
  overdue: AlertCircle,
  urgent: AlertTriangle,
  upcoming: Clock,
  ok: CheckCircle2,
  none: Clock,
};

const statusColor = {
  overdue: 'text-accent-400',
  urgent: 'text-warning-400',
  upcoming: 'text-slate-400',
  ok: 'text-success-400',
  none: 'text-slate-500',
};

const statusBg = {
  overdue: 'border-l-accent-500',
  urgent: 'border-l-warning-500',
  upcoming: 'border-l-navy-500',
  ok: 'border-l-success-500',
  none: 'border-l-navy-700',
};

type FilterRange = 'week' | 'month' | '3months' | 'all';

export default function ComplianceTimeline({ tasks, states, grants, boardMembers }: ComplianceTimelineProps) {
  const [filter, setFilter] = useState<FilterRange>('3months');
  const scrollRef = useRef<HTMLDivElement>(null);

  const events: TimelineEvent[] = [
    ...tasks.filter(t => t.status !== 'complete' && t.due_date).map(t => ({
      id: t.id,
      label: t.title || `${t.type} - ${t.jurisdiction}`,
      date: t.due_date!,
      category: 'compliance' as const,
      link: '/compliance',
      status: getDeadlineStatus(t.due_date),
      days: daysUntil(t.due_date),
    })),
    ...states.filter(s => s.renewal_due_date).map(s => ({
      id: s.id,
      label: `${s.state} Registration Renewal`,
      date: s.renewal_due_date!,
      category: 'state' as const,
      link: '/states',
      status: getDeadlineStatus(s.renewal_due_date),
      days: daysUntil(s.renewal_due_date),
    })),
    ...grants.filter(g => g.status !== 'closed' && g.reporting_due_date).map(g => ({
      id: g.id,
      label: `${g.funder_name} - Report Due`,
      date: g.reporting_due_date!,
      category: 'grant' as const,
      link: '/grants',
      status: getDeadlineStatus(g.reporting_due_date),
      days: daysUntil(g.reporting_due_date),
    })),
    ...boardMembers.filter(b => b.term_end).map(b => ({
      id: b.id,
      label: `${b.name} - Term Expiration`,
      date: b.term_end!,
      category: 'board' as const,
      link: '/board',
      status: getDeadlineStatus(b.term_end),
      days: daysUntil(b.term_end),
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const now = new Date();
  const filteredEvents = events.filter(e => {
    if (filter === 'all') return true;
    const d = daysUntil(e.date);
    if (d === null) return false;
    if (filter === 'week') return d >= -7 && d <= 7;
    if (filter === 'month') return d >= -7 && d <= 30;
    return d >= -14 && d <= 90;
  });

  const months: { label: string; start: Date; end: Date; events: TimelineEvent[] }[] = [];
  if (filteredEvents.length > 0) {
    const baseMonth = now;
    for (let i = -1; i <= 4; i++) {
      const m = addMonths(baseMonth, i);
      const start = startOfMonth(m);
      const end = endOfMonth(m);
      const monthEvents = filteredEvents.filter(e => {
        const d = parseISO(e.date);
        return isValid(d) && isWithinInterval(d, { start, end });
      });
      months.push({
        label: format(m, 'MMMM yyyy'),
        start,
        end,
        events: monthEvents,
      });
    }
  }

  useEffect(() => {
    if (scrollRef.current) {
      const todayMarker = scrollRef.current.querySelector('[data-current-month]');
      if (todayMarker) {
        todayMarker.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [filter]);

  const criticalCount = filteredEvents.filter(e => e.status === 'overdue').length;
  const urgentCount = filteredEvents.filter(e => e.status === 'urgent').length;

  return (
    <div className="card">
      <div className="px-5 py-4 border-b border-navy-800/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-white">Compliance Timeline</h3>
            {(criticalCount > 0 || urgentCount > 0) && (
              <div className="flex items-center gap-2">
                {criticalCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-accent-500/10 text-accent-400 border border-accent-500/20">
                    {criticalCount} overdue
                  </span>
                )}
                {urgentCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-warning-500/10 text-warning-400 border border-warning-500/20">
                    {urgentCount} due soon
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 bg-navy-800/40 rounded-lg p-0.5">
            {([['week', '7 Days'], ['month', '30 Days'], ['3months', '90 Days'], ['all', 'All']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  filter === key
                    ? 'bg-navy-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="max-h-[480px] overflow-y-auto">
        {filteredEvents.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <CheckCircle2 className="w-10 h-10 text-success-500/30 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No deadlines in this time range</p>
            <p className="text-xs text-slate-600 mt-1">All clear for now</p>
          </div>
        ) : (
          <div className="relative">
            {months.filter(m => m.events.length > 0).map((month) => {
              const isCurrentMonth = isWithinInterval(now, { start: month.start, end: month.end });
              return (
                <div key={month.label} data-current-month={isCurrentMonth || undefined}>
                  <div className="sticky top-0 z-10 px-5 py-2 bg-navy-950/90 backdrop-blur-sm border-b border-navy-800/30">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{month.label}</span>
                      {isCurrentMonth && (
                        <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-navy-600/40 text-navy-300">
                          Current
                        </span>
                      )}
                      <span className="text-[11px] text-slate-600">{month.events.length} {month.events.length === 1 ? 'event' : 'events'}</span>
                    </div>
                  </div>

                  <div className="divide-y divide-navy-800/20">
                    {month.events.map((event, i) => {
                      const Icon = statusIcon[event.status];
                      const CatIcon = categoryConfig[event.category].icon;
                      return (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03, duration: 0.2 }}
                        >
                          <Link
                            to={event.link}
                            className={`flex items-center gap-4 px-5 py-3.5 hover:bg-navy-800/20 transition-colors border-l-2 ${statusBg[event.status]}`}
                          >
                            <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border ${categoryConfig[event.category].color}`}>
                              <CatIcon className="w-3.5 h-3.5" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-slate-300 truncate">{event.label}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{formatDate(event.date)}</p>
                            </div>

                            <div className="shrink-0 flex items-center gap-2">
                              <Icon className={`w-3.5 h-3.5 ${statusColor[event.status]}`} />
                              <span className={`text-xs font-medium tabular-nums ${statusColor[event.status]}`}>
                                {event.days !== null
                                  ? event.days < 0
                                    ? `${Math.abs(event.days)}d overdue`
                                    : event.days === 0
                                      ? 'Today'
                                      : `${event.days}d`
                                  : '--'}
                              </span>
                            </div>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {filteredEvents.length > 0 && (
        <div className="px-5 py-3 border-t border-navy-800/40 flex items-center justify-between">
          <span className="text-xs text-slate-500">{filteredEvents.length} {filteredEvents.length === 1 ? 'deadline' : 'deadlines'} total</span>
          <div className="flex items-center gap-4">
            {Object.entries(categoryConfig).map(([key, config]) => {
              const count = filteredEvents.filter(e => e.category === key).length;
              if (count === 0) return null;
              const CatIcon = config.icon;
              return (
                <span key={key} className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                  <CatIcon className="w-3 h-3" />
                  {count}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
