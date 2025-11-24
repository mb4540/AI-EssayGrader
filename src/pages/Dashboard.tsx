import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Download, Search, Trash2, User, FolderOpen, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import CreateAssignmentModal from '@/components/CreateAssignmentModal';
import { useBridge } from '@/hooks/useBridge';
import PageHeader from '@/components/PageHeader';
import { useDashboardData, useDashboardFilters, useDashboardGrouping, useDashboardActions } from './Dashboard/hooks';
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
        <PageHeader
          icon={<span className="text-2xl">📚</span>}
          title="Dashboard"
          subtitle="View and manage all submissions"
          showAddAssignment={true}
          showBridgeLock={true}
          actions={
            <>
              <Button 
                onClick={handleExportClick} 
                variant="outline"
                size="sm"
                disabled={!submissions.length}
                className="text-gray-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <div className="w-px h-8 bg-gray-300 mx-2" />
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-indigo-600' : ''}
              >
                <User className="w-4 h-4 mr-2" />
                By Student
              </Button>
              <Button
                variant={viewMode === 'grouped' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grouped')}
                className={viewMode === 'grouped' ? 'bg-indigo-600' : ''}
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Assignments
              </Button>
              {!bridge.isLocked && bridge.getClassPeriods().length > 0 && (
                <Button
                  variant={viewMode === 'class' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('class')}
                  className={viewMode === 'class' ? 'bg-indigo-600' : ''}
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  By Class
                </Button>
              )}
            </>
          }
        />

        {/* Search and Filter Bar */}
        <div className="mb-6 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by student name or ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              className="pl-10 border-2 focus:border-indigo-500 bg-white"
            />
          </div>
          
          {/* Class Period Filter */}
          {!bridge.isLocked && bridge.getClassPeriods().length > 0 && (
            <select
              value={classPeriodFilter}
              onChange={(e) => {
                setClassPeriodFilter(e.target.value);
                setPage(0);
              }}
              className="px-4 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:border-indigo-500 bg-white min-w-[200px]"
            >
              <option value="">All Classes</option>
              {bridge.getClassPeriods().map((period) => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
            </select>
          )}
        </div>

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

      {/* Delete Assignment Confirmation Modal */}
      {deleteAssignmentTitle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 border-2 border-red-200">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-t-xl">
              <h2 className="text-2xl font-bold text-white">Delete Assignment?</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-2 font-semibold">
                Assignment: <span className="text-red-600">{deleteAssignmentTitle}</span>
              </p>
              <p className="text-gray-700 mb-6">
                This will permanently delete this assignment and <strong>ALL {groupedByAssignment[deleteAssignmentTitle]?.length || 0} submission(s)</strong> associated with it. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={cancelDelete}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDeleteAssignment}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {isDeleting ? 'Deleting...' : 'Delete All'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Submission Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 border-2 border-red-200">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-t-xl">
              <h2 className="text-2xl font-bold text-white">Delete Submission?</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete this submission? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={cancelDelete}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
