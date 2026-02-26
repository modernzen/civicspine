import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield,
  FileCheck2,
  MapPin,
  Users2,
  Landmark,
  Heart,
  ArrowRight,
  CheckCircle2,
  Lock,
} from 'lucide-react';

const features = [
  {
    icon: FileCheck2,
    title: 'IRS 990 Filing Assistant',
    description: 'Smart checklists mapped to common error areas. Never miss a filing deadline again.',
  },
  {
    icon: MapPin,
    title: 'Multi-State Registration',
    description: 'Track charitable registrations across every state where you solicit donations.',
  },
  {
    icon: Users2,
    title: 'Board Governance',
    description: 'Structured governance templates, policy tracking, and conflict of interest management.',
  },
  {
    icon: Landmark,
    title: 'Grant Management',
    description: 'Track restricted and unrestricted funds with automated reporting deadline reminders.',
  },
  {
    icon: Heart,
    title: 'Donor Stewardship',
    description: 'IRS-compliant tax acknowledgments, donor lifecycle tracking, and stewardship queues.',
  },
  {
    icon: Lock,
    title: 'Audit-Ready Security',
    description: 'Role-based access, complete audit trails, and data isolation by organization.',
  },
];

const principles = [
  'Compliance-first architecture',
  'Built for 501(c)(3) organizations',
  'Multi-tenant with full data isolation',
  'Open source under MIT license',
  'Google Workspace integration ready',
  'No vendor lock-in',
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-navy-950">
      <header className="border-b border-navy-800/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-navy-800/60 border border-navy-700/40 flex items-center justify-center">
              <Shield className="w-4.5 h-4.5 text-navy-300" />
            </div>
            <span className="text-base font-semibold text-white tracking-tight">CivicSpine</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="btn-primary text-sm">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-32 lg:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-navy-800/40 border border-navy-700/30 text-xs font-medium text-slate-400 mb-8">
            <Shield className="w-3.5 h-3.5" />
            Open Source Nonprofit Compliance
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight mb-6">
            The compliance backbone
            <br />
            <span className="text-slate-400">your nonprofit needs</span>
          </h1>

          <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mb-10">
            CivicSpine keeps small 501(c)(3) organizations compliant with IRS and state requirements
            while managing donor stewardship and grant reporting — all in one structured platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/register" className="btn-primary inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base">
              Start Free <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="btn-secondary inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base">
              View on GitHub
            </a>
          </div>
        </motion.div>
      </section>

      <section className="border-t border-navy-800/30 bg-navy-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold text-white mb-4">Six pillars of compliance</h2>
            <p className="text-slate-400 max-w-xl">
              Every feature is designed to solve the real compliance challenges that small nonprofits face daily.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="card-hover p-6"
              >
                <div className="w-10 h-10 rounded-xl bg-navy-800/60 border border-navy-700/40 flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-navy-300" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-navy-800/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold text-white mb-4">Built on principles, not trends</h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                CivicSpine is opinionated by design. It enforces structure and best practices
                so your organization stays compliant without depending on any single person's institutional knowledge.
              </p>
              <div className="space-y-3">
                {principles.map((p) => (
                  <div key={p} className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-success-500 shrink-0" />
                    <span className="text-sm text-slate-300">{p}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="card p-8"
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-navy-800/40">
                  <span className="text-sm text-slate-400">IRS Form 990</span>
                  <span className="badge-success"><CheckCircle2 className="w-3 h-3" /> Filed</span>
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-navy-800/40">
                  <span className="text-sm text-slate-400">California Registration</span>
                  <span className="badge-warning">Renewal in 28 days</span>
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-navy-800/40">
                  <span className="text-sm text-slate-400">Board COI Signatures</span>
                  <span className="badge-danger">2 unsigned</span>
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-navy-800/40">
                  <span className="text-sm text-slate-400">Grant Report: Ford Foundation</span>
                  <span className="badge-warning">Due in 14 days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Donor Acknowledgments</span>
                  <span className="badge-success"><CheckCircle2 className="w-3 h-3" /> All sent</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="border-t border-navy-800/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to get compliant?</h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            Join hundreds of small nonprofits using CivicSpine to stay on top of their compliance obligations.
          </p>
          <Link to="/register" className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 text-base">
            Create Free Account <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-navy-800/30 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-navy-500" />
            <span className="text-sm text-slate-500">CivicSpine — Open Source, MIT License</span>
          </div>
          <p className="text-xs text-slate-600">
            This software does not constitute legal advice. Consult qualified professionals for compliance matters.
          </p>
        </div>
      </footer>
    </div>
  );
}
