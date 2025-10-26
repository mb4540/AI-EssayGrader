import Papa from 'papaparse';

export interface SubmissionExport {
  student_name: string;
  student_id?: string;
  assignment_title?: string;
  teacher_grade?: number;
  ai_grade?: number;
  teacher_feedback?: string;
  created_at: string;
  updated_at: string;
}

export function exportToCSV(submissions: SubmissionExport[], filename: string = 'submissions.csv') {
  const csv = Papa.unparse(submissions);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
