import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type {
  FilingDraft,
  FilingDraftSection,
  BoardMember,
  Grant,
  Donation,
} from '../types';

interface FilingDataState {
  draft: FilingDraft | null;
  sections: FilingDraftSection[];
  boardMembers: BoardMember[];
  grants: Grant[];
  donations: Donation[];
  loading: boolean;
  error: string | null;
}

export function useFilingDraft(draftId: string | undefined) {
  const { organization } = useAuth();
  const [state, setState] = useState<FilingDataState>({
    draft: null,
    sections: [],
    boardMembers: [],
    grants: [],
    donations: [],
    loading: true,
    error: null,
  });

  const fetchAll = useCallback(async () => {
    if (!organization || !draftId) return;
    setState(prev => ({ ...prev, loading: true, error: null }));

    const [draftRes, sectionsRes, boardRes, grantsRes, donationsRes] = await Promise.all([
      supabase
        .from('filing_drafts')
        .select('*')
        .eq('id', draftId)
        .eq('organization_id', organization.id)
        .maybeSingle(),
      supabase
        .from('filing_draft_sections')
        .select('*')
        .eq('draft_id', draftId)
        .order('created_at', { ascending: true }),
      supabase
        .from('board_members')
        .select('*')
        .eq('organization_id', organization.id)
        .order('name'),
      supabase
        .from('grants')
        .select('*')
        .eq('organization_id', organization.id)
        .order('date_awarded', { ascending: false }),
      supabase
        .from('donations')
        .select('*')
        .eq('organization_id', organization.id)
        .order('date_received', { ascending: false }),
    ]);

    if (draftRes.error) {
      setState(prev => ({ ...prev, loading: false, error: draftRes.error.message }));
      return;
    }

    setState({
      draft: draftRes.data,
      sections: sectionsRes.data ?? [],
      boardMembers: boardRes.data ?? [],
      grants: grantsRes.data ?? [],
      donations: donationsRes.data ?? [],
      loading: false,
      error: null,
    });
  }, [organization, draftId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const saveSection = useCallback(async (
    sectionKey: string,
    data: Record<string, unknown>,
    aiGenerated?: Record<string, unknown>,
    status?: string,
  ) => {
    if (!draftId) return { error: 'No draft ID' };

    const existing = state.sections.find(s => s.section_key === sectionKey);

    if (existing) {
      const updatePayload: Record<string, unknown> = {
        data,
        updated_at: new Date().toISOString(),
      };
      if (aiGenerated !== undefined) updatePayload.ai_generated = aiGenerated;
      if (status) updatePayload.status = status;

      const { error } = await supabase
        .from('filing_draft_sections')
        .update(updatePayload)
        .eq('id', existing.id);

      if (!error) await fetchAll();
      return { error: error?.message ?? null };
    }

    const { error } = await supabase
      .from('filing_draft_sections')
      .insert({
        draft_id: draftId,
        section_key: sectionKey,
        data,
        ai_generated: aiGenerated ?? {},
        status: status ?? 'in_progress',
      });

    if (!error) await fetchAll();
    return { error: error?.message ?? null };
  }, [draftId, state.sections, fetchAll]);

  const updateDraftStep = useCallback(async (step: number) => {
    if (!draftId) return;
    await supabase
      .from('filing_drafts')
      .update({ current_step: step, updated_at: new Date().toISOString() })
      .eq('id', draftId);
  }, [draftId]);

  const updateDraftStatus = useCallback(async (status: string) => {
    if (!draftId) return;
    await supabase
      .from('filing_drafts')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', draftId);
    await fetchAll();
  }, [draftId, fetchAll]);

  const getSection = useCallback((key: string) => {
    return state.sections.find(s => s.section_key === key) ?? null;
  }, [state.sections]);

  const donationTotals = {
    total: state.donations.reduce((sum, d) => sum + Number(d.amount), 0),
    restricted: state.donations.filter(d => d.restricted).reduce((sum, d) => sum + Number(d.amount), 0),
    unrestricted: state.donations.filter(d => !d.restricted).reduce((sum, d) => sum + Number(d.amount), 0),
  };

  const grantTotals = {
    total: state.grants.reduce((sum, g) => sum + Number(g.amount_awarded), 0),
    restricted: state.grants.filter(g => g.restricted).reduce((sum, g) => sum + Number(g.amount_awarded), 0),
    unrestricted: state.grants.filter(g => !g.restricted).reduce((sum, g) => sum + Number(g.amount_awarded), 0),
  };

  return {
    ...state,
    saveSection,
    updateDraftStep,
    updateDraftStatus,
    getSection,
    refetch: fetchAll,
    donationTotals,
    grantTotals,
  };
}

export function useFilingDrafts() {
  const { organization } = useAuth();
  const [drafts, setDrafts] = useState<FilingDraft[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDrafts = useCallback(async () => {
    if (!organization) return;
    setLoading(true);
    const { data } = await supabase
      .from('filing_drafts')
      .select('*')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false });
    setDrafts(data ?? []);
    setLoading(false);
  }, [organization]);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const createDraft = useCallback(async (fiscalYear: number, formType: string) => {
    if (!organization) return null;
    const { data, error } = await supabase
      .from('filing_drafts')
      .insert({
        organization_id: organization.id,
        fiscal_year: fiscalYear,
        form_type: formType,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .maybeSingle();

    if (error || !data) return null;
    await fetchDrafts();
    return data as FilingDraft;
  }, [organization, fetchDrafts]);

  return { drafts, loading, createDraft, refetch: fetchDrafts };
}
