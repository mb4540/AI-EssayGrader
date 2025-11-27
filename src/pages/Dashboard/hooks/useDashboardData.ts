/**
 * Dashboard Data Hook
 * Handles all data fetching, caching, and mutations
 */

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listSubmissions, deleteSubmission, listAssignments } from '@/lib/api';
import type { DashboardFilters } from '../types';
import type { UseBridgeReturn } from '@/hooks/useBridge';

const PAGE_SIZE = 20;

export function useDashboardData(filters: DashboardFilters, bridge: UseBridgeReturn) {
  const queryClient = useQueryClient();

  // Fetch submissions with filters
  const {
    data: submissionsData,
    isLoading: isLoadingSubmissions,
  } = useQuery({
    queryKey: ['submissions', filters.searchQuery, filters.classPeriodFilter, filters.page],
    queryFn: () => {
      // Resolve student names to IDs using local bridge
      let searchStudentIds: string | undefined = undefined;
      
      if (filters.searchQuery && !bridge.isLocked) {
        const matchingStudents = bridge.findByName(filters.searchQuery);
        if (matchingStudents.length > 0) {
          searchStudentIds = matchingStudents.map(s => s.uuid).join(',');
        }
      }

      return listSubmissions({
        search: filters.searchQuery || undefined,
        search_student_ids: searchStudentIds,
        class_period: filters.classPeriodFilter || undefined,
        page: filters.page + 1,
        limit: PAGE_SIZE,
      });
    },
  });

  // Client-side date filtering
  const filteredSubmissions = useMemo(() => {
    const submissions = submissionsData?.submissions || [];
    
    // If no date filter, return all
    if (!filters.startDate && !filters.endDate) {
      return submissions;
    }

    return submissions.filter((submission: any) => {
      const createdDate = new Date(submission.created_at);
      createdDate.setHours(0, 0, 0, 0); // Normalize to start of day

      // Check start date
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        startDate.setHours(0, 0, 0, 0);
        if (createdDate < startDate) return false;
      }

      // Check end date
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999); // End of day
        if (createdDate > endDate) return false;
      }

      return true;
    });
  }, [submissionsData, filters.startDate, filters.endDate]);

  // Fetch assignments list
  const { data: assignmentsData } = useQuery({
    queryKey: ['assignments'],
    queryFn: listAssignments,
  });

  // Delete submission mutation
  const deleteSubmissionMutation = useMutation({
    mutationFn: deleteSubmission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });

  // Delete assignment mutation (bulk delete submissions)
  const deleteAssignmentMutation = useMutation({
    mutationFn: async (assignmentTitle: string) => {
      const submissions = submissionsData?.submissions || [];
      const toDelete = submissions.filter(
        (s: any) => s.assignment_title === assignmentTitle
      );
      
      await Promise.all(
        toDelete.map((s: any) => deleteSubmission(s.submission_id))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });

  return {
    // Data
    submissions: filteredSubmissions,
    totalSubmissions: submissionsData?.pagination?.total || 0,
    assignments: assignmentsData?.assignments || [],
    
    // Loading states
    isLoading: isLoadingSubmissions,
    isDeleting: deleteSubmissionMutation.isPending || deleteAssignmentMutation.isPending,
    
    // Actions
    deleteSubmission: (id: string) => deleteSubmissionMutation.mutate(id),
    deleteAssignment: (title: string) => deleteAssignmentMutation.mutate(title),
  };
}
