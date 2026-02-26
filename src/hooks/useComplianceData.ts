import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { ComplianceTask, StateRegistration, BoardMember, Grant, Donation } from '../types';

export function useComplianceData() {
  const { organization } = useAuth();
  const [tasks, setTasks] = useState<ComplianceTask[]>([]);
  const [states, setStates] = useState<StateRegistration[]>([]);
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!organization) return;
    setLoading(true);

    const [tasksRes, statesRes, boardRes, grantsRes, donationsRes] = await Promise.all([
      supabase.from('compliance_tasks').select('*').eq('organization_id', organization.id).order('due_date', { ascending: true }),
      supabase.from('states_registered').select('*').eq('organization_id', organization.id).order('state'),
      supabase.from('board_members').select('*').eq('organization_id', organization.id).order('name'),
      supabase.from('grants').select('*').eq('organization_id', organization.id).order('reporting_due_date', { ascending: true }),
      supabase.from('donations').select('*').eq('organization_id', organization.id).order('date_received', { ascending: false }),
    ]);

    setTasks(tasksRes.data ?? []);
    setStates(statesRes.data ?? []);
    setBoardMembers(boardRes.data ?? []);
    setGrants(grantsRes.data ?? []);
    setDonations(donationsRes.data ?? []);
    setLoading(false);
  }, [organization]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { tasks, states, boardMembers, grants, donations, loading, refetch: fetchAll };
}
