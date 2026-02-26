import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useComplianceData } from './useComplianceData';
import { getDeadlineStatus, daysUntil } from '../lib/utils';
import type { Notification } from '../types';

export interface LiveAlert {
  id: string;
  type: Notification['type'];
  title: string;
  message: string;
  entityType: string;
  entityId: string | null;
  severity: 'critical' | 'warning' | 'info';
  link: string;
}

function generateAlerts(
  tasks: ReturnType<typeof useComplianceData>['tasks'],
  states: ReturnType<typeof useComplianceData>['states'],
  boardMembers: ReturnType<typeof useComplianceData>['boardMembers'],
  grants: ReturnType<typeof useComplianceData>['grants'],
  donations: ReturnType<typeof useComplianceData>['donations'],
): LiveAlert[] {
  const alerts: LiveAlert[] = [];

  for (const task of tasks) {
    if (task.status === 'complete') continue;
    const status = getDeadlineStatus(task.due_date);
    const days = daysUntil(task.due_date);
    if (status === 'overdue') {
      alerts.push({
        id: `task-overdue-${task.id}`,
        type: 'deadline_overdue',
        title: 'Task Overdue',
        message: `${task.title || task.type} is ${Math.abs(days!)} days overdue`,
        entityType: 'compliance_task',
        entityId: task.id,
        severity: 'critical',
        link: '/compliance',
      });
    } else if (status === 'urgent' && days !== null && days <= 14) {
      alerts.push({
        id: `task-approaching-${task.id}`,
        type: 'deadline_approaching',
        title: 'Deadline Approaching',
        message: `${task.title || task.type} is due in ${days} days`,
        entityType: 'compliance_task',
        entityId: task.id,
        severity: 'warning',
        link: '/compliance',
      });
    }
  }

  for (const state of states) {
    const status = getDeadlineStatus(state.renewal_due_date);
    const days = daysUntil(state.renewal_due_date);
    if (status === 'overdue') {
      alerts.push({
        id: `state-overdue-${state.id}`,
        type: 'deadline_overdue',
        title: 'Registration Expired',
        message: `${state.state} registration renewal is ${Math.abs(days!)} days overdue`,
        entityType: 'state_registration',
        entityId: state.id,
        severity: 'critical',
        link: '/states',
      });
    } else if (days !== null && days <= 30 && days >= 0) {
      alerts.push({
        id: `state-approaching-${state.id}`,
        type: 'deadline_approaching',
        title: 'Renewal Due Soon',
        message: `${state.state} registration renews in ${days} days`,
        entityType: 'state_registration',
        entityId: state.id,
        severity: 'warning',
        link: '/states',
      });
    }
  }

  const unsignedCoi = boardMembers.filter(b => !b.conflict_of_interest_signed);
  if (unsignedCoi.length > 0) {
    alerts.push({
      id: 'coi-unsigned',
      type: 'coi_unsigned',
      title: 'COI Forms Needed',
      message: `${unsignedCoi.length} board ${unsignedCoi.length === 1 ? 'member has' : 'members have'} unsigned conflict of interest forms`,
      entityType: 'board_member',
      entityId: null,
      severity: 'warning',
      link: '/board',
    });
  }

  for (const grant of grants) {
    if (grant.status === 'closed') continue;
    const days = daysUntil(grant.reporting_due_date);
    const status = getDeadlineStatus(grant.reporting_due_date);
    if (status === 'overdue') {
      alerts.push({
        id: `grant-overdue-${grant.id}`,
        type: 'grant_report_due',
        title: 'Grant Report Overdue',
        message: `${grant.funder_name} report is ${Math.abs(days!)} days overdue`,
        entityType: 'grant',
        entityId: grant.id,
        severity: 'critical',
        link: '/grants',
      });
    } else if (days !== null && days <= 14 && days >= 0) {
      alerts.push({
        id: `grant-approaching-${grant.id}`,
        type: 'grant_report_due',
        title: 'Grant Report Due Soon',
        message: `${grant.funder_name} report is due in ${days} days`,
        entityType: 'grant',
        entityId: grant.id,
        severity: 'warning',
        link: '/grants',
      });
    }
  }

  const pendingAcks = donations.filter(d => !d.acknowledgment_sent);
  const oldPending = pendingAcks.filter(d => {
    const days = daysUntil(d.date_received);
    return days !== null && days < -7;
  });
  if (oldPending.length > 0) {
    alerts.push({
      id: 'ack-pending',
      type: 'ack_pending',
      title: 'Acknowledgments Overdue',
      message: `${oldPending.length} ${oldPending.length === 1 ? 'donation has' : 'donations have'} been waiting over 7 days for acknowledgment`,
      entityType: 'donation',
      entityId: null,
      severity: 'warning',
      link: '/donors',
    });
  }

  alerts.sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });

  return alerts;
}

export function useNotifications() {
  const { organization } = useAuth();
  const { tasks, states, boardMembers, grants, donations, loading: dataLoading } = useComplianceData();
  const [storedNotifications, setStoredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const alerts = dataLoading ? [] : generateAlerts(tasks, states, boardMembers, grants, donations);
  const unreadCount = alerts.filter(a => a.severity === 'critical' || a.severity === 'warning').length;

  const fetchStored = useCallback(async () => {
    if (!organization) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setStoredNotifications(data ?? []);
    setLoading(false);
  }, [organization]);

  useEffect(() => {
    fetchStored();
  }, [fetchStored]);

  async function markAsRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setStoredNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  async function markAllAsRead() {
    if (!organization) return;
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('organization_id', organization.id)
      .eq('read', false);
    setStoredNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  return {
    alerts,
    storedNotifications,
    unreadCount,
    loading: loading || dataLoading,
    markAsRead,
    markAllAsRead,
    refetch: fetchStored,
  };
}
