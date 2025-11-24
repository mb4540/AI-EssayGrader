/**
 * Shared TypeScript types for Dashboard
 */

export type SortField = 'student_name' | 'assignment_title' | 'ai_grade' | 'teacher_grade' | 'created_at';
export type SortDirection = 'asc' | 'desc';
export type ViewMode = 'list' | 'grouped' | 'class';

export interface DashboardFilters {
  searchQuery: string;
  classPeriodFilter: string;
  page: number;
  sortField: SortField;
  sortDirection: SortDirection;
  startDate: string | null;
  endDate: string | null;
}

export interface StudentGroup {
  studentId: string;
  submissions: any[];
}

export interface GroupedByStudent {
  [studentName: string]: StudentGroup;
}

export interface GroupedByAssignment {
  [assignmentTitle: string]: any[];
}

export interface GroupedByClass {
  [classPeriod: string]: {
    [studentName: string]: StudentGroup;
  };
}
