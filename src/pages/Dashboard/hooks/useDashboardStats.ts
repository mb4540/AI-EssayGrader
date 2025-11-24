/**
 * Dashboard Statistics Hook
 * Calculates statistics for dashboard display
 */

import { useMemo } from 'react';

interface Submission {
  id: string;
  ai_grade?: number;
  teacher_grade?: number;
  created_at: string;
  updated_at?: string;
  [key: string]: any;
}

export interface DashboardStats {
  totalSubmissions: number;
  averageAiGrade: number | null;
  averageTeacherGrade: number | null;
  pendingReview: number;
  gradedToday: number;
}

export function useDashboardStats(submissions: Submission[]): DashboardStats {
  return useMemo(() => {
    const total = submissions.length;

    // Calculate average AI grade (exclude nulls)
    const aiGrades = submissions
      .map(s => s.ai_grade)
      .filter((grade): grade is number => grade !== null && grade !== undefined);
    const avgAiGrade = aiGrades.length > 0
      ? aiGrades.reduce((sum, grade) => sum + grade, 0) / aiGrades.length
      : null;

    // Calculate average teacher grade (exclude nulls)
    const teacherGrades = submissions
      .map(s => s.teacher_grade)
      .filter((grade): grade is number => grade !== null && grade !== undefined);
    const avgTeacherGrade = teacherGrades.length > 0
      ? teacherGrades.reduce((sum, grade) => sum + grade, 0) / teacherGrades.length
      : null;

    // Count pending review (no teacher grade)
    const pending = submissions.filter(s => 
      s.teacher_grade === null || s.teacher_grade === undefined
    ).length;

    // Count graded today (teacher grade updated today)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const gradedToday = submissions.filter(s => {
      if (!s.updated_at || !s.teacher_grade) return false;
      const updatedDate = new Date(s.updated_at);
      updatedDate.setHours(0, 0, 0, 0);
      return updatedDate.getTime() === today.getTime();
    }).length;

    return {
      totalSubmissions: total,
      averageAiGrade: avgAiGrade !== null ? Math.round(avgAiGrade * 10) / 10 : null,
      averageTeacherGrade: avgTeacherGrade !== null ? Math.round(avgTeacherGrade * 10) / 10 : null,
      pendingReview: pending,
      gradedToday,
    };
  }, [submissions]);
}
