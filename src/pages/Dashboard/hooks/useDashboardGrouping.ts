/**
 * Dashboard Grouping Hook
 * Handles grouping and sorting of submissions
 */

import { useMemo } from 'react';
import type { UseBridgeReturn } from '@/hooks/useBridge';
import type { GroupedByStudent, GroupedByAssignment, GroupedByClass, SortField, SortDirection } from '../types';

interface Submission {
  id: string; // API returns 'id', not 'submission_id'
  submission_id?: string; // Optional for backwards compatibility
  student_id?: string;
  student_name: string;
  assignment_title?: string;
  ai_grade?: number;
  teacher_grade?: number;
  created_at: string;
  class_period?: string;
  [key: string]: any;
}

export function useDashboardGrouping(
  submissions: Submission[],
  bridge: UseBridgeReturn,
  sortField: SortField = 'created_at',
  sortDirection: SortDirection = 'desc'
) {
  // Sort submissions based on selected field and direction
  const sortedSubmissions = useMemo(() => {
    const sorted = [...submissions].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'student_name':
          // Get student name from bridge
          const studentA = a.student_id ? bridge.findByUuid(a.student_id) : null;
          const studentB = b.student_id ? bridge.findByUuid(b.student_id) : null;
          aValue = studentA?.name || 'Unknown';
          bValue = studentB?.name || 'Unknown';
          break;

        case 'assignment_title':
          aValue = a.assignment_title || '';
          bValue = b.assignment_title || '';
          break;

        case 'ai_grade':
          // Handle null/undefined grades - put them at the end
          aValue = a.ai_grade ?? -1;
          bValue = b.ai_grade ?? -1;
          break;

        case 'teacher_grade':
          // Handle null/undefined grades - put them at the end
          aValue = a.teacher_grade ?? -1;
          bValue = b.teacher_grade ?? -1;
          break;

        case 'created_at':
        default:
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
      }

      // Compare values
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else {
        comparison = aValue - bValue;
      }

      // Apply sort direction
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [submissions, bridge, sortField, sortDirection]);

  // Group by assignment
  const groupedByAssignment = useMemo<GroupedByAssignment>(() => {
    return sortedSubmissions.reduce((acc, submission) => {
      const assignmentKey = submission.assignment_title || 'No Assignment';
      if (!acc[assignmentKey]) {
        acc[assignmentKey] = [];
      }
      acc[assignmentKey].push(submission);
      return acc;
    }, {} as GroupedByAssignment);
  }, [sortedSubmissions]);

  // Group by student
  const groupedByStudent = useMemo<GroupedByStudent>(() => {
    return sortedSubmissions.reduce((acc, submission) => {
      const student = submission.student_id ? bridge.findByUuid(submission.student_id) : null;
      const studentKey = student?.name || 'Unknown';
      
      if (!acc[studentKey]) {
        acc[studentKey] = {
          studentId: student?.localId || '',
          submissions: []
        };
      }
      acc[studentKey].submissions.push(submission);
      return acc;
    }, {} as GroupedByStudent);
  }, [sortedSubmissions, bridge]);

  // Group by class period → student → assignments
  const groupedByClass = useMemo<GroupedByClass>(() => {
    return sortedSubmissions.reduce((acc, submission) => {
      const student = submission.student_id ? bridge.findByUuid(submission.student_id) : null;
      // Use class_period from database (submission) instead of Bridge
      const classPeriod = submission.class_period || 'No Class Assigned';
      const studentName = student?.name || 'Unknown';
      
      if (!acc[classPeriod]) {
        acc[classPeriod] = {};
      }
      if (!acc[classPeriod][studentName]) {
        acc[classPeriod][studentName] = {
          studentId: student?.localId || '',
          submissions: []
        };
      }
      acc[classPeriod][studentName].submissions.push(submission);
      return acc;
    }, {} as GroupedByClass);
  }, [sortedSubmissions, bridge]);

  return {
    sortedSubmissions,
    groupedByAssignment,
    groupedByStudent,
    groupedByClass,
  };
}
