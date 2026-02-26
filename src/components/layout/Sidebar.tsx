import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  FileCheck2,
  MapPin,
  Users2,
  Landmark,
  Heart,
  LogOut,
  Shield,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/compliance', icon: FileCheck2, label: 'IRS 990 Filing' },
  { to: '/states', icon: MapPin, label: 'State Registrations' },
  { to: '/board', icon: Users2, label: 'Board Governance' },
  { to: '/grants', icon: Landmark, label: 'Grants' },
  { to: '/donors', icon: Heart, label: 'Donor Stewardship' },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { signOut, organization, profile } = useAuth();

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
      )}

      <motion.aside
        initial={false}
        className={`fixed top-0 left-0 h-full w-72 bg-navy-950 border-r border-navy-800/40 z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="px-6 py-6 border-b border-navy-800/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-navy-700/60 border border-navy-600/40 flex items-center justify-center">
                <Shield className="w-5 h-5 text-navy-300" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-white tracking-tight">CivicSpine</h1>
                <p className="text-[11px] text-slate-500 font-medium tracking-wider uppercase">Compliance Hub</p>
              </div>
            </div>
            <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-navy-800 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {organization && (
          <div className="px-6 py-4 border-b border-navy-800/40">
            <p className="text-sm font-medium text-slate-300 truncate">{organization.name}</p>
            {organization.ein && (
              <p className="text-xs text-slate-500 mt-0.5">EIN: {organization.ein}</p>
            )}
          </div>
        )}

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-navy-800/70 text-white border border-navy-700/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-navy-900/60'
                }`
              }
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-navy-800/40">
          {profile && (
            <div className="px-3 mb-3">
              <p className="text-sm text-slate-300 font-medium truncate">{profile.full_name}</p>
              <p className="text-xs text-slate-500 capitalize">{profile.role}</p>
            </div>
          )}
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-300 hover:bg-navy-900/60 transition-all w-full"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Sign Out
          </button>
        </div>
      </motion.aside>
    </>
  );
}
