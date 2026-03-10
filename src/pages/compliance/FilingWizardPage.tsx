import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Check,
  ChevronLeft,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFilingDraft } from '../../hooks/useFilingData';
import { getFilingSections } from '../../types';
import type { FormType, SectionStatus } from '../../types';
import AiAssistPanel from '../../components/filing/AiAssistPanel';
import OrgInfoStep from '../../components/filing/steps/OrgInfoStep';
import RevenueStep from '../../components/filing/steps/RevenueStep';
import ExpensesStep from '../../components/filing/steps/ExpensesStep';
import OfficersStep from '../../components/filing/steps/OfficersStep';
import MissionStep from '../../components/filing/steps/MissionStep';
import GovernanceStep from '../../components/filing/steps/GovernanceStep';
import FinancialStatementsStep from '../../components/filing/steps/FinancialStatementsStep';
import ReviewStep from '../../components/filing/steps/ReviewStep';

export default function FilingWizardPage() {
  const { draftId } = useParams<{ draftId: string }>();
  const navigate = useNavigate();
  const { organization } = useAuth();

  const {
    draft,
    sections,
    boardMembers,
    grants,
    donations,
    loading,
    error,
    saveSection,
    updateDraftStep,
    updateDraftStatus,
    getSection,
    donationTotals,
    grantTotals,
  } = useFilingDraft(draftId);

  const [showAi, setShowAi] = useState(false);

  const formType = (draft?.form_type ?? organization?.form_990_type ?? '990-EZ') as FormType;
  const sectionDefs = getFilingSections(formType);
  const totalSteps = sectionDefs.length + 1;
  const [currentStep, setCurrentStep] = useState(draft?.current_step ?? 0);

  const isReviewStep = currentStep === sectionDefs.length;
  const currentDef = isReviewStep ? null : sectionDefs[currentStep];

  const goToStep = useCallback((step: number) => {
    setCurrentStep(step);
    setShowAi(false);
    updateDraftStep(step);
  }, [updateDraftStep]);

  const goNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      goToStep(currentStep + 1);
    }
  }, [currentStep, totalSteps, goToStep]);

  const goPrev = useCallback(() => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  }, [currentStep, goToStep]);

  const handleSectionSave = useCallback(async (data: Record<string, unknown>) => {
    if (!currentDef) return;
    await saveSection(currentDef.key, data, undefined, 'in_progress');
    goNext();
  }, [currentDef, saveSection, goNext]);

  const handleAiAccept = useCallback(async (aiData: Record<string, unknown>) => {
    if (!currentDef) return;
    const existing = getSection(currentDef.key);
    await saveSection(
      currentDef.key,
      existing?.data ?? {},
      aiData,
      'ai_drafted',
    );
    setShowAi(false);
  }, [currentDef, getSection, saveSection]);

  async function handleFinalize() {
    await updateDraftStatus('in_review');
    navigate('/compliance');
  }

  function getSectionStatus(key: string): SectionStatus {
    const sec = sections.find(s => s.section_key === key);
    return (sec?.status as SectionStatus) ?? 'not_started';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-navy-400 animate-spin" />
      </div>
    );
  }

  if (error || !draft) {
    return (
      <div className="text-center py-32">
        <p className="text-sm text-accent-400">{error || 'Filing draft not found'}</p>
        <button onClick={() => navigate('/compliance')} className="btn-secondary text-sm mt-4">
          Back to Compliance
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/compliance')} className="p-2 rounded-lg hover:bg-navy-800/60 text-slate-400 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Form {formType} Filing Wizard</h1>
          <p className="text-xs text-slate-500">FY {draft.fiscal_year} {draft.status === 'in_review' ? '(In Review)' : ''}</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {sectionDefs.map((def, i) => {
            const status = getSectionStatus(def.key);
            const isActive = i === currentStep;
            return (
              <button
                key={def.key}
                onClick={() => goToStep(i)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                  isActive
                    ? 'bg-navy-700/60 text-white border border-navy-600/50'
                    : status === 'reviewed'
                    ? 'text-success-400 hover:bg-navy-800/40'
                    : status === 'ai_drafted'
                    ? 'text-teal-400 hover:bg-navy-800/40'
                    : status === 'in_progress'
                    ? 'text-warning-400 hover:bg-navy-800/40'
                    : 'text-slate-500 hover:bg-navy-800/40 hover:text-slate-300'
                }`}
              >
                <StepIndicator status={status} index={i + 1} active={isActive} />
                <span className="hidden lg:inline">{def.label}</span>
              </button>
            );
          })}

          <button
            onClick={() => goToStep(sectionDefs.length)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
              isReviewStep
                ? 'bg-navy-700/60 text-white border border-navy-600/50'
                : 'text-slate-500 hover:bg-navy-800/40 hover:text-slate-300'
            }`}
          >
            <StepIndicator status="not_started" index={sectionDefs.length + 1} active={isReviewStep} />
            <span className="hidden lg:inline">Review</span>
          </button>
        </div>

        <div className="mt-3 h-1 rounded-full bg-navy-800/60 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-navy-500"
            initial={false}
            animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className={showAi ? 'xl:col-span-2' : 'xl:col-span-3'}>
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="card p-6"
          >
            {isReviewStep ? (
              <ReviewStep
                sections={sections}
                sectionDefs={[...sectionDefs]}
                formType={formType}
                onGoToStep={goToStep}
                onFinalize={handleFinalize}
              />
            ) : currentDef?.key === 'org_info' && organization ? (
              <OrgInfoStep
                organization={organization}
                section={getSection('org_info')}
                onSave={handleSectionSave}
              />
            ) : currentDef?.key === 'revenue' ? (
              <RevenueStep
                section={getSection('revenue')}
                donationTotals={donationTotals}
                grantTotals={grantTotals}
                onSave={handleSectionSave}
              />
            ) : currentDef?.key === 'expenses' ? (
              <ExpensesStep
                section={getSection('expenses')}
                onSave={handleSectionSave}
              />
            ) : currentDef?.key === 'officers' ? (
              <OfficersStep
                section={getSection('officers')}
                boardMembers={boardMembers}
                onSave={handleSectionSave}
              />
            ) : currentDef?.key === 'mission' ? (
              <MissionStep
                section={getSection('mission')}
                onSave={handleSectionSave}
              />
            ) : currentDef?.key === 'governance' ? (
              <GovernanceStep
                section={getSection('governance')}
                boardMembers={boardMembers}
                onSave={handleSectionSave}
              />
            ) : currentDef?.key === 'financial_statements' ? (
              <FinancialStatementsStep
                section={getSection('financial_statements')}
                onSave={handleSectionSave}
              />
            ) : null}
          </motion.div>

          {!isReviewStep && (
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={goPrev}
                disabled={currentStep === 0}
                className="btn-secondary text-sm flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>
              <div className="flex items-center gap-2">
                {!showAi && (
                  <button
                    onClick={() => setShowAi(true)}
                    className="text-sm flex items-center gap-2 px-4 py-2.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 font-medium rounded-lg border border-teal-500/20 transition-all"
                  >
                    <Sparkles className="w-4 h-4" /> AI Assist
                  </button>
                )}
                <button
                  onClick={goNext}
                  className="btn-primary text-sm flex items-center gap-2"
                >
                  {currentStep === sectionDefs.length - 1 ? 'Go to Review' : 'Next'} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        <AnimatePresence>
          {showAi && !isReviewStep && currentDef && (
            <div className="xl:col-span-1">
              <AiAssistPanel
                sectionKey={currentDef.key}
                formType={formType}
                existingData={getSection(currentDef.key)?.data ?? {}}
                boardMembers={boardMembers}
                grants={grants}
                donations={donations}
                onAccept={handleAiAccept}
                onClose={() => setShowAi(false)}
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StepIndicator({ status, index, active }: { status: SectionStatus; index: number; active: boolean }) {
  if (status === 'reviewed') {
    return (
      <div className="w-6 h-6 rounded-full bg-success-500/20 border border-success-500/40 flex items-center justify-center">
        <Check className="w-3 h-3 text-success-400" />
      </div>
    );
  }
  if (status === 'ai_drafted') {
    return (
      <div className="w-6 h-6 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center">
        <Sparkles className="w-3 h-3 text-teal-400" />
      </div>
    );
  }
  if (status === 'in_progress') {
    return (
      <div className="w-6 h-6 rounded-full bg-warning-500/20 border border-warning-500/40 flex items-center justify-center">
        <span className="text-[10px] font-bold text-warning-400">{index}</span>
      </div>
    );
  }
  return (
    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
      active ? 'bg-navy-600 border border-navy-500' : 'bg-navy-800/60 border border-navy-700/40'
    }`}>
      <span className={`text-[10px] font-bold ${active ? 'text-white' : 'text-slate-500'}`}>{index}</span>
    </div>
  );
}
