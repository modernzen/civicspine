import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  X,
  RotateCcw,
  Check,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { FormType, BoardMember, Grant, Donation } from '../../types';

interface AiAssistPanelProps {
  sectionKey: string;
  formType: FormType;
  existingData: Record<string, unknown>;
  boardMembers: BoardMember[];
  grants: Grant[];
  donations: Donation[];
  onAccept: (aiData: Record<string, unknown>) => void;
  onClose: () => void;
}

export default function AiAssistPanel({
  sectionKey,
  formType,
  existingData,
  boardMembers,
  grants,
  donations,
  onAccept,
  onClose,
}: AiAssistPanelProps) {
  const { organization, session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestionsOpen, setSuggestionsOpen] = useState(true);

  async function generate() {
    if (!session) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-990-section`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section_key: sectionKey,
          form_type: formType,
          organization: {
            name: organization?.name,
            ein: organization?.ein,
            form_990_type: organization?.form_990_type,
            fiscal_year_end: organization?.fiscal_year_end,
          },
          existing_data: existingData,
          board_members: boardMembers,
          grants,
          donations,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to generate AI suggestions');
        return;
      }

      setResult(data.ai_generated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }

  const suggestions = result?.suggestions as Array<{ type?: string; message?: string }> | undefined;
  const warnings = suggestions?.filter(s => s.type === 'warning') ?? [];
  const recommendations = suggestions?.filter(s => s.type !== 'warning') ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="bg-navy-900/80 border border-navy-700/50 rounded-xl overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-navy-800/50 bg-navy-800/30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <span className="text-sm font-semibold text-white">AI Assistant</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-navy-700/50 text-slate-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {!result && !loading && !error && (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-teal-400" />
            </div>
            <p className="text-sm text-slate-300 mb-1">AI-Powered Section Assist</p>
            <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
              Generate intelligent suggestions based on your organization's data and IRS 990 requirements
            </p>
            <button onClick={generate} className="btn-primary text-sm inline-flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              Generate Suggestions
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 text-teal-400 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-300">Analyzing your data...</p>
            <p className="text-xs text-slate-500 mt-1">This may take a few seconds</p>
          </div>
        )}

        {error && (
          <div className="py-4">
            <div className="flex items-start gap-3 p-3 bg-accent-500/10 border border-accent-500/20 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-accent-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-accent-300">{error}</p>
                <button onClick={generate} className="text-xs text-accent-400 hover:text-accent-300 mt-2 underline">
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {result && (
          <>
            {warnings.length > 0 && (
              <div className="space-y-2">
                {warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 bg-warning-500/10 border border-warning-500/20 rounded-lg">
                    <AlertTriangle className="w-3.5 h-3.5 text-warning-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-warning-300">{w.message}</p>
                  </div>
                ))}
              </div>
            )}

            {recommendations.length > 0 && (
              <div>
                <button
                  onClick={() => setSuggestionsOpen(!suggestionsOpen)}
                  className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-300 mb-2 w-full"
                >
                  {suggestionsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {recommendations.length} recommendation{recommendations.length !== 1 ? 's' : ''}
                </button>
                <AnimatePresence>
                  {suggestionsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-1.5 overflow-hidden"
                    >
                      {recommendations.map((r, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 bg-navy-800/40 rounded-lg">
                          <Check className="w-3 h-3 text-teal-400 mt-0.5 shrink-0" />
                          <p className="text-xs text-slate-400">{r.message}</p>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <div className="border-t border-navy-800/40 pt-3">
              <p className="text-xs text-slate-500 mb-3">
                Review the generated content above. Accept to apply it to the form, or regenerate for new suggestions.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => onAccept(result)}
                  className="btn-primary text-sm flex-1 flex items-center justify-center gap-2"
                >
                  <Check className="w-3.5 h-3.5" />
                  Accept
                </button>
                <button
                  onClick={generate}
                  className="btn-secondary text-sm flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Regenerate
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
