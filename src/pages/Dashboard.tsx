import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Download, Search, Trash2, User, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { listSubmissions, deleteSubmission } from '@/lib/api';
import { exportToCSV } from '@/lib/csv';
import CreateAssignmentModal from '@/components/CreateAssignmentModal';
import { useBridge } from '@/hooks/useBridge';
import PageHeader from '@/components/PageHeader';

type SortField = 'student_name' | 'assignment_title' | 'ai_grade' | 'teacher_grade' | 'created_at';
type SortDirection = 'asc' | 'desc';

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const bridge = useBridge();
  
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [sortField] = useState<SortField>('created_at'); // setSortField unused - for future sorting
  const [sortDirection] = useState<SortDirection>('desc'); // setSortDirection unused - for future sorting
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteAssignmentTitle, setDeleteAssignmentTitle] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list');
  const pageSize = 20;
  
  // Refs for scroll synchronization (unused - was for flat table view)
  // const headerScrollRef = useRef<HTMLDivElement>(null);
  // const bodyScrollRef = useRef<HTMLDivElement>(null);

  // Listen for assignment modal trigger from navigation
  useEffect(() => {
    const handleOpenModal = () => setIsAssignmentModalOpen(true);
    window.addEventListener('openAssignmentModal', handleOpenModal);
    return () => window.removeEventListener('openAssignmentModal', handleOpenModal);
  }, []);

  // Fetch submissions data
  const { data, isLoading } = useQuery({
    queryKey: ['submissions', searchQuery, page],
    queryFn: () => listSubmissions({
      search: searchQuery || undefined,
      page: page + 1,
      limit: pageSize,
    }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteSubmission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      setDeleteId(null);
    },
  });

  // Handle sorting (currently unused - can be re-enabled for future sorting features)
  // const handleSort = (field: SortField) => {
  //   if (sortField === field) {
  //     setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  //   } else {
  //     setSortField(field);
  //     setSortDirection('asc');
  //   }
  // };

  // Handle delete operations
  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const handleDeleteAssignment = (assignmentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteAssignmentTitle(assignmentTitle);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  const confirmDeleteAssignment = async () => {
    if (deleteAssignmentTitle && data?.submissions) {
      const submissionsToDelete = data.submissions.filter(
        s => (s.assignment_title || 'No Assignment') === deleteAssignmentTitle
      );
      
      for (const submission of submissionsToDelete) {
        await deleteMutation.mutateAsync(submission.id);
      }
      
      setDeleteAssignmentTitle(null);
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    }
  };

  // Handle scrolling synchronization (currently unused - was for flat table view)
  // const handleHeaderScroll = (e: React.UIEvent<HTMLDivElement>) => {
  //   if (bodyScrollRef.current) {
  //     bodyScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
  //   }
  // };

  // const handleBodyScroll = (e: React.UIEvent<HTMLDivElement>) => {
  //   if (headerScrollRef.current) {
  //     headerScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
  //   }
  // };

  // Handle CSV export - resolve student names from bridge
  const handleExport = () => {
    if (data?.submissions) {
      exportToCSV(
        data.submissions.map(s => {
          const student = s.student_id ? bridge.findByUuid(s.student_id) : null;
          return {
            student_name: student?.name || 'Unknown',
            student_id: student?.localId || s.student_id || 'N/A',
            assignment_title: s.assignment_title,
            teacher_grade: s.teacher_grade,
            ai_grade: s.ai_grade,
            created_at: s.created_at,
            updated_at: s.updated_at,
          };
        }),
        `submissions-${new Date().toISOString().split('T')[0]}.csv`
      );
    }
  };

  // Sort submissions
  const sortedSubmissions = data?.submissions ? [...data.submissions].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    
    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  }) : [];

  // Group submissions by assignment
  const groupedSubmissions = sortedSubmissions.reduce((acc, submission) => {
    const assignmentKey = submission.assignment_title || 'No Assignment';
    if (!acc[assignmentKey]) {
      acc[assignmentKey] = [];
    }
    acc[assignmentKey].push(submission);
    return acc;
  }, {} as Record<string, typeof sortedSubmissions>);

  // Group submissions by student
  const groupedByStudent = sortedSubmissions.reduce((acc, submission) => {
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
  }, {} as Record<string, { studentId: string; submissions: typeof sortedSubmissions }>);

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
                onClick={handleExport} 
                variant="outline"
                size="sm"
                disabled={!data?.submissions?.length}
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
                By Assignment
              </Button>
            </>
          }
        />

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
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
        </div>

        {/* Submissions Content Card */}
        <Card className="shadow-xl bg-white">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : !data?.submissions?.length ? (
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
                                      onClick={() => navigate(`/submission/${submission.id}`)}
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
            ) : (
              /* Grouped View - Accordion by Assignment */
              <Accordion type="multiple" className="w-full">
                {Object.entries(groupedSubmissions).map(([assignmentTitle, submissions]) => (
                  <AccordionItem key={assignmentTitle} value={assignmentTitle} className="border-b">
                    <AccordionTrigger className="hover:no-underline px-4 py-4 bg-gradient-to-r from-slate-50 to-blue-50 hover:from-slate-100 hover:to-blue-100">
                      <div className="flex items-center justify-between gap-3 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            <FolderOpen className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-lg text-gray-900">
                              {assignmentTitle}
                            </div>
                            <div className="text-sm text-gray-500">
                              {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeleteAssignment(assignmentTitle, e)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 mr-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
                            {submissions.map((submission) => {
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
                                      onClick={() => navigate(`/submission/${submission.id}`)}
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
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <CreateAssignmentModal 
        isOpen={isAssignmentModalOpen} 
        onClose={() => setIsAssignmentModalOpen(false)} 
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
                This will permanently delete this assignment and <strong>ALL {groupedSubmissions[deleteAssignmentTitle]?.length || 0} submission(s)</strong> associated with it. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteAssignmentTitle(null)}
                  disabled={deleteMutation.isPending}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDeleteAssignment}
                  disabled={deleteMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete All'}
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
                  onClick={() => setDeleteId(null)}
                  disabled={deleteMutation.isPending}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDelete}
                  disabled={deleteMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
