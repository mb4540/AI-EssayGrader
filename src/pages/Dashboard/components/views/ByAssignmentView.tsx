/**
 * By Assignment View Component
 * Displays submissions grouped by assignment with edit/delete controls
 */

import { FolderOpen, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { UseBridgeReturn } from '@/hooks/useBridge';
import type { GroupedByAssignment } from '../../types';

interface Assignment {
  id: string;
  title: string;
  [key: string]: any;
}

interface ByAssignmentViewProps {
  assignments: Assignment[];
  groupedByAssignment: GroupedByAssignment;
  bridge: UseBridgeReturn;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  onEditAssignment: (assignment: Assignment) => void;
  onDeleteAssignment: (assignmentId: string, title: string, e: React.MouseEvent) => void;
}

export default function ByAssignmentView({
  assignments,
  groupedByAssignment,
  bridge,
  onView,
  onDelete,
  onEditAssignment,
  onDeleteAssignment,
}: ByAssignmentViewProps) {
  return (
    <Accordion type="multiple" className="w-full">
      {assignments && assignments.length > 0 ? (
        assignments.map((assignment) => {
          const assignmentSubmissions = groupedByAssignment[assignment.title] || [];
          return (
            <AccordionItem key={assignment.id} value={assignment.id} className="border-b">
              <AccordionTrigger className="hover:no-underline px-4 py-4 bg-gradient-to-r from-slate-50 to-blue-50 hover:from-slate-100 hover:to-blue-100">
                <div className="flex items-center justify-between gap-3 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <FolderOpen className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-lg text-gray-900">
                        {assignment.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {assignmentSubmissions.length} submission{assignmentSubmissions.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditAssignment(assignment);
                      }}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      title="Edit assignment"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => onDeleteAssignment(assignment.id, assignment.title, e)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-slate-100">
                        <th className="text-left py-2 px-4 font-medium text-sm">Student</th>
                        <th className="text-left py-2 px-4 font-medium text-sm">AI Grade</th>
                        <th className="text-left py-2 px-4 font-medium text-sm">Teacher Grade</th>
                        <th className="text-left py-2 px-4 font-medium text-sm">Date</th>
                        <th className="text-left py-2 px-4 font-medium text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignmentSubmissions.map((submission) => {
                        const student = submission.student_id ? bridge.findByUuid(submission.student_id) : null;
                        return (
                          <tr key={submission.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4">
                              <div>
                                <div className="font-medium">{student?.name || 'Unknown'}</div>
                                {student?.localId && (
                                  <div className="text-sm text-muted-foreground">
                                    ID: {student.localId}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {submission.ai_grade !== null && submission.ai_grade !== undefined ? (
                                <span className="font-medium">{submission.ai_grade}/100</span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {submission.teacher_grade !== null && submission.teacher_grade !== undefined ? (
                                <span className="font-medium text-primary">
                                  {submission.teacher_grade}/100
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {new Date(submission.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onView(submission.id)}
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })
      ) : (
        <div className="text-center py-12 text-gray-500">
          No assignments found. Click "Add Assignment" to create one.
        </div>
      )}
    </Accordion>
  );
}
