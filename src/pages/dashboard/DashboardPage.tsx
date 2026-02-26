import { motion } from 'framer-motion';
import {
  FileCheck2,
  MapPin,
  Landmark,
  Heart,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useComplianceData } from '../../hooks/useComplianceData';
import { useAuth } from '../../contexts/AuthContext';
import { getDeadlineStatus, formatDate, daysUntil, formatCurrency } from '../../lib/utils';
import StatusBadge from '../../components/ui/StatusBadge';
import DeadlineCountdown from '../../components/ui/DeadlineCountdown';

function StatCard({ icon: Icon, label, value, subtext, color }: {
  icon: typeof FileCheck2;
  label: string;
  value: string | number;
  subtext?: string;
  color: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-[18px] h-[18px]" />
        </div>
      </div>
      <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
      <p className="text-sm text-slate-400 mt-1">{label}</p>
      {subtext && <p className="text-xs text-slate-500 mt-0.5">{subtext}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { organization } = useAuth();
  const { tasks, states, boardMembers, grants, donations, loading } = useComplianceData();

  const overdueTasks = tasks.filter(t => t.status !== 'complete' && getDeadlineStatus(t.due_date) === 'overdue');
  const urgentTasks = tasks.filter(t => t.status !== 'complete' && getDeadlineStatus(t.due_date) === 'urgent');
  const irs990Task = tasks.find(t => t.type === 'IRS_990' && t.status !== 'complete');

  const unsignedCOI = boardMembers.filter(b => !b.conflict_of_interest_signed);
  const pendingAcknowledgments = donations.filter(d => !d.acknowledgment_sent);

  const upcomingGrantReports = grants
    .filter(g => g.status !== 'closed' && g.reporting_due_date)
    .sort((a, b) => (a.reporting_due_date ?? '').localeCompare(b.reporting_due_date ?? ''));

  const allDeadlines = [
    ...tasks.filter(t => t.status !== 'complete' && t.due_date).map(t => ({
      id: t.id,
      label: t.title || `${t.type} — ${t.jurisdiction}`,
      date: t.due_date!,
      type: 'compliance' as const,
      link: '/compliance',
    })),
    ...states.filter(s => s.renewal_due_date).map(s => ({
      id: s.id,
      label: `${s.state} Registration Renewal`,
      date: s.renewal_due_date!,
      type: 'state' as const,
      link: '/states',
    })),
    ...grants.filter(g => g.status !== 'closed' && g.reporting_due_date).map(g => ({
      id: g.id,
      label: `${g.funder_name} — Report Due`,
      date: g.reporting_due_date!,
      type: 'grant' as const,
      link: '/grants',
    })),
  ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-navy-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Compliance Dashboard</h1>
        <p className="text-sm text-slate-500">
          {organization?.name ?? 'Your Organization'} — Overview of compliance status
        </p>
      </div>

      {(overdueTasks.length > 0 || unsignedCOI.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card border-accent-700/30 bg-accent-500/5 p-5"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-accent-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-accent-300 mb-1">Attention Required</h3>
              <div className="space-y-1">
                {overdueTasks.length > 0 && (
                  <p className="text-sm text-slate-400">
                    {overdueTasks.length} compliance {overdueTasks.length === 1 ? 'task is' : 'tasks are'} overdue
                  </p>
                )}
                {unsignedCOI.length > 0 && (
                  <p className="text-sm text-slate-400">
                    {unsignedCOI.length} board {unsignedCOI.length === 1 ? 'member has' : 'members have'} unsigned conflict of interest forms
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {irs990Task && (
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">IRS Form {organization?.form_990_type ?? '990'} Filing</h3>
              <p className="text-xs text-slate-500">{irs990Task.title || 'Annual filing deadline'}</p>
            </div>
            <DeadlineCountdown date={irs990Task.due_date} label={`Form ${organization?.form_990_type ?? '990'}`} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FileCheck2}
          label="Open Compliance Tasks"
          value={tasks.filter(t => t.status !== 'complete').length}
          subtext={`${urgentTasks.length} due within 30 days`}
          color="bg-navy-800/60 text-navy-300"
        />
        <StatCard
          icon={MapPin}
          label="States Registered"
          value={states.filter(s => s.registration_status === 'active').length}
          subtext={`of ${states.length} tracked`}
          color="bg-navy-800/60 text-navy-300"
        />
        <StatCard
          icon={Landmark}
          label="Active Grants"
          value={grants.filter(g => g.status === 'active' || g.status === 'reporting_due').length}
          subtext={formatCurrency(grants.filter(g => g.status !== 'closed').reduce((s, g) => s + g.amount_awarded, 0))}
          color="bg-navy-800/60 text-navy-300"
        />
        <StatCard
          icon={Heart}
          label="Pending Acknowledgments"
          value={pendingAcknowledgments.length}
          subtext={`${donations.length} total donations`}
          color="bg-navy-800/60 text-navy-300"
        />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 card">
          <div className="px-5 py-4 border-b border-navy-800/40 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Upcoming Deadlines</h3>
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <div className="divide-y divide-navy-800/30">
            {allDeadlines.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <CheckCircle2 className="w-8 h-8 text-success-500/40 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No upcoming deadlines</p>
              </div>
            ) : (
              allDeadlines.map((d) => {
                const days = daysUntil(d.date);
                const status = getDeadlineStatus(d.date);
                return (
                  <Link
                    key={d.id}
                    to={d.link}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-navy-800/20 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {status === 'overdue' && <AlertCircle className="w-4 h-4 text-accent-400 shrink-0" />}
                      {status === 'urgent' && <AlertTriangle className="w-4 h-4 text-warning-400 shrink-0" />}
                      {status === 'upcoming' && <Clock className="w-4 h-4 text-slate-500 shrink-0" />}
                      {status === 'ok' && <CheckCircle2 className="w-4 h-4 text-success-500 shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-sm text-slate-300 truncate">{d.label}</p>
                        <p className="text-xs text-slate-500">{formatDate(d.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <StatusBadge
                        status={status}
                        label={days !== null ? (days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`) : undefined}
                      />
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="px-5 py-4 border-b border-navy-800/40">
              <h3 className="text-sm font-semibold text-white">Board Governance</h3>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Board Members</span>
                <span className="text-sm font-medium text-white">{boardMembers.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">COI Signed</span>
                <span className="text-sm font-medium text-white">
                  {boardMembers.filter(b => b.conflict_of_interest_signed).length} / {boardMembers.length}
                </span>
              </div>
              {unsignedCOI.length > 0 && (
                <Link to="/board" className="flex items-center gap-2 text-xs text-accent-400 hover:text-accent-300 transition-colors pt-1">
                  View unsigned <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>

          <div className="card">
            <div className="px-5 py-4 border-b border-navy-800/40">
              <h3 className="text-sm font-semibold text-white">Grant Reports Due</h3>
            </div>
            <div className="divide-y divide-navy-800/30">
              {upcomingGrantReports.length === 0 ? (
                <div className="px-5 py-6 text-center">
                  <p className="text-sm text-slate-500">No reports due</p>
                </div>
              ) : (
                upcomingGrantReports.slice(0, 4).map((g) => (
                  <div key={g.id} className="px-5 py-3">
                    <p className="text-sm text-slate-300">{g.funder_name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-slate-500">{formatCurrency(g.amount_awarded)}</p>
                      <StatusBadge status={getDeadlineStatus(g.reporting_due_date)} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="text-center py-4">
        <p className="text-[11px] text-slate-600 max-w-md mx-auto leading-relaxed">
          CivicSpine provides organizational tools only. This software does not constitute legal, tax, or accounting advice.
          Consult qualified professionals for all compliance matters.
        </p>
      </div>
    </div>
  );
}
