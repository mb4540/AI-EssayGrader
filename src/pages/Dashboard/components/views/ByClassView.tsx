/**
 * By Class View Component
 * Displays submissions grouped by class period → student → assignments
 */

import { User, FolderOpen, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { GroupedByClass } from '../../types';

interface ByClassViewProps {
  groupedByClass: GroupedByClass;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function ByClassView({
  groupedByClass,
  onView,
  onDelete,
}: ByClassViewProps) {
  return (
    <Accordion type="multiple" className="w-full">
      {Object.entries(groupedByClass).map(([classPeriod, students]) => {
        const totalSubmissions = Object.values(students).reduce(
          (sum, student) => sum + student.submissions.length,
          0
        );
        return (
          <AccordionItem key={classPeriod} value={classPeriod} className="border-b">
            <AccordionTrigger className="hover:no-underline px-4 py-4 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100">
              <div className="flex items-center justify-between gap-3 flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <FolderOpen className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-lg text-gray-900">
                      {classPeriod}
                    </div>
                    <div className="text-sm text-gray-500">
                      {Object.keys(students).length} student{Object.keys(students).length !== 1 ? 's' : ''} • {totalSubmissions} submission{totalSubmissions !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {/* Nested Accordion for Students */}
              <Accordion type="multiple" className="w-full pl-4">
                {Object.entries(students).map(([studentName, studentData]) => (
                  <AccordionItem key={studentName} value={studentName} className="border-b">
                    <AccordionTrigger className="hover:no-underline px-4 py-3 bg-gradient-to-r from-slate-50 to-blue-50 hover:from-slate-100 hover:to-blue-100">
                      <div className="flex items-center justify-between gap-3 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-indigo-600" />
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-base text-gray-900">
                              {studentName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {studentData.submissions.length} submission{studentData.submissions.length !== 1 ? 's' : ''}
                              {studentData.studentId && ` • ID: ${studentData.studentId}`}
                            </div>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-slate-100">
                            <tr>
                              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Assignment</th>
                              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">AI Grade</th>
                              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Teacher Grade</th>
                              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Date</th>
                              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {studentData.submissions.map((submission) => (
                              <tr key={submission.id} className="border-b hover:bg-slate-50">
                                <td className="py-3 px-4">
                                  <div className="font-medium text-gray-900">
                                    {submission.assignment_title || '-'}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="font-semibold text-gray-900">
                                    {submission.ai_grade ? `${submission.ai_grade}/100` : '-'}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  {submission.teacher_grade ? (
                                    <span className="font-semibold text-blue-600">
                                      {submission.teacher_grade}/100
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-gray-600 text-sm">
                                  {new Date(submission.created_at).toLocaleDateString()}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onView(submission.id)}
                                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    >
                                      View
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onDelete(submission.id)}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
