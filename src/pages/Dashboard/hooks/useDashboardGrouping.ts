/**
 * Dashboard Grouping Hook
 * Handles grouping and sorting of submissions
 */

import { useMemo } from 'react';
import type { UseBridgeReturn } from '@/hooks/useBridge';
import type { GroupedByStudent, GroupedByAssignment, GroupedByClass } from '../types';

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
  bridge: UseBridgeReturn
) {
  // Sort submissions by created_at (newest first)
  const sortedSubmissions = useMemo(() => {
    return [...submissions].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [submissions]);

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
