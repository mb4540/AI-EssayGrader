/**
 * Dashboard Data Hook
 * Handles all data fetching, caching, and mutations
 */

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listSubmissions, deleteSubmission, listAssignments, deleteAssignment } from '@/lib/api';
import type { DashboardFilters } from '../types';

const PAGE_SIZE = 20;

export function useDashboardData(filters: DashboardFilters) {
  const queryClient = useQueryClient();

  // Fetch submissions with filters
  const {
    data: submissionsData,
    isLoading: isLoadingSubmissions,
  } = useQuery({
    queryKey: ['submissions', filters.classPeriodFilter, filters.page],
    queryFn: () => listSubmissions({
      class_period: filters.classPeriodFilter || undefined,
      page: filters.page + 1,
      limit: PAGE_SIZE,
    }),
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

  // Delete assignment mutation (calls backend API to delete assignment + all submissions)
  const deleteAssignmentMutation = useMutation({
    mutationFn: (assignmentId: string) => deleteAssignment(assignmentId),
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
    deleteAssignment: (assignmentId: string) => deleteAssignmentMutation.mutate(assignmentId),
  };
}
