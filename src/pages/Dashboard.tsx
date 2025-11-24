import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2, User, FolderOpen, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import CreateAssignmentModal from '@/components/CreateAssignmentModal';
import { useBridge } from '@/hooks/useBridge';
import { useDashboardData, useDashboardFilters, useDashboardGrouping, useDashboardActions } from './Dashboard/hooks';
import { DashboardHeader, DashboardFilters, DeleteConfirmModal } from './Dashboard/components';
import type { ViewMode } from './Dashboard/types';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const bridge = useBridge();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  
  // Custom hooks for data, filters, grouping, and actions
  const filterHook = useDashboardFilters();
  const { filters, searchQuery, classPeriodFilter, setSearchQuery, setClassPeriodFilter, setPage } = filterHook;
  
  const dataHook = useDashboardData(filters);
  const { submissions, assignments, isLoading, deleteSubmission: deleteSubmissionMutation, deleteAssignment: deleteAssignmentMutation, isDeleting } = dataHook;
  
  const groupingHook = useDashboardGrouping(submissions, bridge);
  const { groupedByStudent, groupedByAssignment, groupedByClass } = groupingHook;
  
  const actionsHook = useDashboardActions();
  const {
    isAssignmentModalOpen,
    modalMode,
    editingAssignment,
    closeAssignmentModal,
    setEditMode,
    deleteId,
    deleteAssignmentTitle,
    handleDelete,
    handleDeleteAssignment,
    cancelDelete,
    handleExport: exportCSV,
    handleViewSubmission,
  } = actionsHook;
  
  // Confirm delete handlers
  const confirmDelete = () => {
    if (deleteId) {
      deleteSubmissionMutation(deleteId);
      cancelDelete();
    }
  };

  const confirmDeleteAssignment = () => {
    if (deleteAssignmentTitle) {
      deleteAssignmentMutation(deleteAssignmentTitle);
      cancelDelete();
    }
  };

  // Export handler
  const handleExportClick = () => {
    exportCSV(submissions, bridge);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-6">
        {/* Dashboard Header */}
        <DashboardHeader
          viewMode={viewMode}
          setViewMode={setViewMode}
          onExport={handleExportClick}
          hasClassPeriods={!bridge.isLocked && bridge.getClassPeriods().length > 0}
          submissionCount={submissions.length}
        />

        {/* Search and Filter Bar */}
        <DashboardFilters
          searchQuery={searchQuery}
          onSearchChange={(query) => {
            setSearchQuery(query);
            setPage(0);
          }}
          classPeriodFilter={classPeriodFilter}
          onClassPeriodChange={(period) => {
            setClassPeriodFilter(period);
            setPage(0);
          }}
          classPeriods={bridge.getClassPeriods()}
          showClassFilter={!bridge.isLocked && bridge.getClassPeriods().length > 0}
        />

        {/* Submissions Content Card */}
        <Card className="shadow-xl bg-white">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : !submissions.length ? (
              <div className="text-center py-8 text-muted-foreground">
                No submissions found. Create your first submission to get started.
              </div>
            ) : viewMode === 'list' ? (
              /* By Student View - Accordion by Student */
              <Accordion type="multiple" className="w-full">
                {Object.entries(groupedByStudent).map(([studentName, data]) => (
                  <AccordionItem key={studentName} value={studentName} className="border-b">
                    <AccordionTrigger className="hover:no-underline px-4 py-4 bg-gradient-to-r from-slate-50 to-blue-50 hover:from-slate-100 hover:to-blue-100">
                      <div className="flex items-center justify-between gap-3 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            <User className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-lg text-gray-900">
                              {studentName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {data.submissions.length} submission{data.submissions.length !== 1 ? 's' : ''}
                              {data.studentId && ` • ID: ${data.studentId}`}
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
                            {data.submissions.map((submission) => (
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
                                      onClick={() => handleViewSubmission(submission.id)}
                                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    >
                                      View
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDelete(submission.id)}
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
            ) : viewMode === 'class' ? (
              /* By Class View - Accordion by Class Period → Student → Assignments */
              <Accordion type="multiple" className="w-full">
                {Object.entries(groupedByClass).map(([classPeriod, students]) => {
                  const totalSubmissions = Object.values(students).reduce((sum, student) => sum + student.submissions.length, 0);
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
                                                onClick={() => handleViewSubmission(submission.id)}
                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                              >
                                                View
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(submission.id)}
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
            ) : (
              /* Assignments View - Shows all assignments with submission counts */
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
                              setEditMode(assignment);
                            }}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Edit assignment"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDeleteAssignment(assignment.title, e)}
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
                                      onClick={() => handleViewSubmission(submission.id)}
                                    >
                                      View
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDelete(submission.id)}
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <CreateAssignmentModal 
        isOpen={isAssignmentModalOpen} 
        onClose={closeAssignmentModal}
        mode={modalMode}
        existingAssignment={editingAssignment}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['submissions'] });
        }}
      />

      {/* Delete Modals */}
      <DeleteConfirmModal
        isOpen={!!deleteAssignmentTitle}
        type="assignment"
        onConfirm={confirmDeleteAssignment}
        onCancel={cancelDelete}
        isDeleting={isDeleting}
        itemName={deleteAssignmentTitle || undefined}
        submissionCount={deleteAssignmentTitle ? (groupedByAssignment[deleteAssignmentTitle]?.length || 0) : 0}
      />

      <DeleteConfirmModal
        isOpen={!!deleteId}
        type="submission"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
