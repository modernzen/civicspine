import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Bell,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  ChevronRight,
  CheckCheck,
} from 'lucide-react';
import type { LiveAlert } from '../../hooks/useNotifications';

interface NotificationCenterProps {
  alerts: LiveAlert[];
  unreadCount: number;
}

const severityConfig = {
  critical: {
    icon: AlertCircle,
    bg: 'bg-accent-500/8',
    border: 'border-accent-500/15',
    iconColor: 'text-accent-400',
    dot: 'bg-accent-400',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-warning-500/8',
    border: 'border-warning-500/15',
    iconColor: 'text-warning-400',
    dot: 'bg-warning-400',
  },
  info: {
    icon: Info,
    bg: 'bg-navy-600/10',
    border: 'border-navy-600/20',
    iconColor: 'text-navy-300',
    dot: 'bg-navy-400',
  },
};

export default function NotificationCenter({ alerts, unreadCount }: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const warningAlerts = alerts.filter(a => a.severity === 'warning');
  const infoAlerts = alerts.filter(a => a.severity === 'info');

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-navy-800/60 text-slate-400 hover:text-slate-200 transition-all"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold rounded-full bg-accent-500 text-white"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-96 max-h-[520px] bg-navy-900 border border-navy-700/50 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            <div className="px-5 py-4 border-b border-navy-800/50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Notifications</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {alerts.length === 0 ? 'All clear' : `${alerts.length} active ${alerts.length === 1 ? 'alert' : 'alerts'}`}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg hover:bg-navy-800 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[420px]">
              {alerts.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-success-500/10 border border-success-500/20 flex items-center justify-center mx-auto mb-3">
                    <CheckCheck className="w-5 h-5 text-success-400" />
                  </div>
                  <p className="text-sm text-slate-400">No alerts right now</p>
                  <p className="text-xs text-slate-600 mt-1">All compliance items are on track</p>
                </div>
              ) : (
                <div>
                  {criticalAlerts.length > 0 && (
                    <div>
                      <div className="px-5 py-2 bg-navy-950/50">
                        <span className="text-[11px] font-semibold text-accent-400 uppercase tracking-wider">Needs Immediate Attention</span>
                      </div>
                      {criticalAlerts.map((alert) => (
                        <AlertRow key={alert.id} alert={alert} onClose={() => setOpen(false)} />
                      ))}
                    </div>
                  )}

                  {warningAlerts.length > 0 && (
                    <div>
                      <div className="px-5 py-2 bg-navy-950/50">
                        <span className="text-[11px] font-semibold text-warning-400 uppercase tracking-wider">Upcoming</span>
                      </div>
                      {warningAlerts.map((alert) => (
                        <AlertRow key={alert.id} alert={alert} onClose={() => setOpen(false)} />
                      ))}
                    </div>
                  )}

                  {infoAlerts.length > 0 && (
                    <div>
                      <div className="px-5 py-2 bg-navy-950/50">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Informational</span>
                      </div>
                      {infoAlerts.map((alert) => (
                        <AlertRow key={alert.id} alert={alert} onClose={() => setOpen(false)} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AlertRow({ alert, onClose }: { alert: LiveAlert; onClose: () => void }) {
  const config = severityConfig[alert.severity];
  const Icon = config.icon;

  return (
    <Link
      to={alert.link}
      onClick={onClose}
      className="flex items-start gap-3 px-5 py-3.5 hover:bg-navy-800/20 transition-colors border-b border-navy-800/20 last:border-b-0"
    >
      <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${config.bg} border ${config.border}`}>
        <Icon className={`w-4 h-4 ${config.iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-300">{alert.title}</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{alert.message}</p>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-1" />
    </Link>
  );
}
