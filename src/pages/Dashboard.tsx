import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Download, Search, FolderPlus, ChevronUp, ChevronDown, Trash2, Info, List, FolderOpen, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { listSubmissions, deleteSubmission } from '@/lib/api';
import { exportToCSV } from '@/lib/csv';
import CreateAssignmentModal from '@/components/CreateAssignmentModal';
import SettingsModal from '@/components/SettingsModal';

type SortField = 'student_name' | 'assignment_title' | 'ai_grade' | 'teacher_grade' | 'created_at';
type SortDirection = 'asc' | 'desc';

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteAssignmentTitle, setDeleteAssignmentTitle] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list');
  const pageSize = 20;
  
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['submissions', searchQuery, page],
    queryFn: () => listSubmissions({
      search: searchQuery || undefined,
      page: page + 1, // API uses 1-based pagination
      limit: pageSize,
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSubmission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      setDeleteId(null);
    },
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const handleDeleteAssignment = (assignmentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent accordion from toggling
    setDeleteAssignmentTitle(assignmentTitle);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  const confirmDeleteAssignment = async () => {
    if (deleteAssignmentTitle && data?.submissions) {
      // Find all submissions for this assignment
      const submissionsToDelete = data.submissions.filter(
        s => (s.assignment_title || 'No Assignment') === deleteAssignmentTitle
      );
      
      // Delete all submissions for this assignment
      for (const submission of submissionsToDelete) {
        await deleteMutation.mutateAsync(submission.id);
      }
      
      setDeleteAssignmentTitle(null);
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    }
  };

  const handleHeaderScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (bodyScrollRef.current) {
      bodyScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const handleBodyScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const handleExport = () => {
    if (data?.submissions) {
      exportToCSV(
        data.submissions.map(s => ({
          student_name: s.student_name,
          student_id: s.student_id,
          assignment_title: s.assignment_title,
          teacher_grade: s.teacher_grade,
          ai_grade: s.ai_grade,
          created_at: s.created_at,
          updated_at: s.updated_at,
        })),
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">FastAI Grader</h1>
              <p className="text-blue-100 text-sm mt-1">6th Grade Essay Grading Assistant</p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setIsSettingsOpen(true)}
                variant="ghost"
                className="text-white hover:bg-white/20"
                title="AI Settings"
              >
                <Settings className="w-5 h-5" />
              </Button>
              <Button 
                onClick={() => navigate('/help')}
                className="bg-white/20 hover:bg-white/30 text-white border-2 border-white/40 font-bold text-lg px-6"
                title="Need Help? Click here for guide"
              >
                <Info className="w-6 h-6 mr-2" />
                HELP
              </Button>
              <Button 
                onClick={handleExport} 
                variant="ghost"
                disabled={!data?.submissions?.length}
                className="text-white hover:bg-white/20"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button 
                onClick={() => setIsAssignmentModalOpen(true)} 
                variant="ghost"
                className="text-white hover:bg-white/20 border border-white/30"
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                New Assignment
              </Button>
              <Button 
                onClick={() => navigate('/submission')}
                className="bg-white text-indigo-600 hover:bg-blue-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Submission
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Card className="shadow-xl border-t-4 border-t-indigo-500 bg-white dark:bg-slate-800">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                  <span className="text-2xl">📚</span>
                </div>
                <CardTitle className="text-2xl text-gray-900 dark:text-white">Submissions</CardTitle>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-indigo-600' : ''}
                >
                  <List className="w-4 h-4 mr-2" />
                  List View
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
              </div>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by student name or ID..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(0);
                  }}
                  className="pl-10 border-2 focus:border-indigo-500"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : !data?.submissions?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                No submissions found. Create your first submission to get started.
              </div>
            ) : viewMode === 'list' ? (
              <>
                {/* List View - Header Table - Fixed */}
                <div 
                  ref={headerScrollRef}
                  onScroll={handleHeaderScroll}
                  className="overflow-x-auto"
                >
                  <table className="w-full table-fixed">
                    <thead>
                      <tr className="border-b-2 bg-gradient-to-r from-slate-100 to-blue-100 dark:from-slate-700 dark:to-slate-600">
                        <th 
                          className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900 select-none transition-colors w-[200px]"
                          onClick={() => handleSort('student_name')}
                        >
                          <div className="flex items-center gap-2">
                            Student
                            <div className="flex flex-col -space-y-1">
                              <ChevronUp className={`w-4 h-4 ${sortField === 'student_name' && sortDirection === 'asc' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} strokeWidth={3} />
                              <ChevronDown className={`w-4 h-4 ${sortField === 'student_name' && sortDirection === 'desc' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} strokeWidth={3} />
                            </div>
                          </div>
                        </th>
                        <th 
                          className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900 select-none transition-colors w-[200px]"
                          onClick={() => handleSort('assignment_title')}
                        >
                          <div className="flex items-center gap-2">
                            Assignment
                            <div className="flex flex-col -space-y-1">
                              <ChevronUp className={`w-4 h-4 ${sortField === 'assignment_title' && sortDirection === 'asc' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} strokeWidth={3} />
                              <ChevronDown className={`w-4 h-4 ${sortField === 'assignment_title' && sortDirection === 'desc' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} strokeWidth={3} />
                            </div>
                          </div>
                        </th>
                        <th 
                          className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900 select-none transition-colors w-[130px]"
                          onClick={() => handleSort('ai_grade')}
                        >
                          <div className="flex items-center gap-2">
                            AI Grade
                            <div className="flex flex-col -space-y-1">
                              <ChevronUp className={`w-4 h-4 ${sortField === 'ai_grade' && sortDirection === 'asc' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} strokeWidth={3} />
                              <ChevronDown className={`w-4 h-4 ${sortField === 'ai_grade' && sortDirection === 'desc' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} strokeWidth={3} />
                            </div>
                          </div>
                        </th>
                        <th 
                          className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900 select-none transition-colors w-[150px]"
                          onClick={() => handleSort('teacher_grade')}
                        >
                          <div className="flex items-center gap-2">
                            Teacher Grade
                            <div className="flex flex-col -space-y-1">
                              <ChevronUp className={`w-4 h-4 ${sortField === 'teacher_grade' && sortDirection === 'asc' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} strokeWidth={3} />
                              <ChevronDown className={`w-4 h-4 ${sortField === 'teacher_grade' && sortDirection === 'desc' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} strokeWidth={3} />
                            </div>
                          </div>
                        </th>
                        <th 
                          className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900 select-none transition-colors w-[130px]"
                          onClick={() => handleSort('created_at')}
                        >
                          <div className="flex items-center gap-2">
                            Date
                            <div className="flex flex-col -space-y-1">
                              <ChevronUp className={`w-4 h-4 ${sortField === 'created_at' && sortDirection === 'asc' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} strokeWidth={3} />
                              <ChevronDown className={`w-4 h-4 ${sortField === 'created_at' && sortDirection === 'desc' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} strokeWidth={3} />
                            </div>
                          </div>
                        </th>
                        <th className="text-left py-3 px-4 font-semibold w-[140px]">Actions</th>
                      </tr>
                    </thead>
                  </table>
                </div>

                {/* Body Table - Scrollable */}
                <div 
                  ref={bodyScrollRef}
                  onScroll={handleBodyScroll}
                  className="overflow-x-auto max-h-[500px] overflow-y-auto border-t"
                >
                  <table className="w-full table-fixed">
                    <tbody>
                      {sortedSubmissions.map((submission) => (
                        <tr key={submission.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 w-[200px]">
                            <div>
                              <div className="font-medium truncate">{submission.student_name}</div>
                              {submission.student_id && (
                                <div className="text-sm text-muted-foreground truncate">
                                  ID: {submission.student_id}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 w-[200px] truncate">
                            {submission.assignment_title || '-'}
                          </td>
                          <td className="py-3 px-4 w-[130px]">
                            {submission.ai_grade !== null && submission.ai_grade !== undefined ? (
                              <span className="font-medium">{submission.ai_grade}/100</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 w-[150px]">
                            {submission.teacher_grade !== null && submission.teacher_grade !== undefined ? (
                              <span className="font-medium text-primary">
                                {submission.teacher_grade}/100
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground w-[130px]">
                            {new Date(submission.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 w-[140px]">
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
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {data.total > pageSize && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, data.total)} of {data.total} submissions
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => p + 1)}
                        disabled={(page + 1) * pageSize >= data.total}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Grouped View - Accordion by Assignment */
              <Accordion type="multiple" className="w-full">
                {Object.entries(groupedSubmissions).map(([assignmentTitle, submissions]) => (
                  <AccordionItem key={assignmentTitle} value={assignmentTitle} className="border-b">
                    <AccordionTrigger className="hover:no-underline px-4 py-4 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 hover:from-slate-100 hover:to-blue-100 dark:hover:from-slate-700 dark:hover:to-slate-600">
                      <div className="flex items-center justify-between gap-3 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                            <FolderOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-lg text-gray-900 dark:text-white">
                              {assignmentTitle}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeleteAssignment(assignmentTitle, e)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 mr-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-slate-100 dark:bg-slate-700">
                              <th className="text-left py-2 px-4 font-medium text-sm">Student</th>
                              <th className="text-left py-2 px-4 font-medium text-sm">AI Grade</th>
                              <th className="text-left py-2 px-4 font-medium text-sm">Teacher Grade</th>
                              <th className="text-left py-2 px-4 font-medium text-sm">Date</th>
                              <th className="text-left py-2 px-4 font-medium text-sm">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {submissions.map((submission) => (
                              <tr key={submission.id} className="border-b hover:bg-muted/50">
                                <td className="py-3 px-4">
                                  <div>
                                    <div className="font-medium">{submission.student_name}</div>
                                    {submission.student_id && (
                                      <div className="text-sm text-muted-foreground">
                                        ID: {submission.student_id}
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
                            ))}
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

      <CreateAssignmentModal 
        isOpen={isAssignmentModalOpen} 
        onClose={() => setIsAssignmentModalOpen(false)} 
      />

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      {/* Delete Assignment Confirmation Modal */}
      {deleteAssignmentTitle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md mx-4 border-2 border-red-200 dark:border-red-800">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-t-xl">
              <h2 className="text-2xl font-bold text-white">Delete Assignment?</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-300 mb-2 font-semibold">
                Assignment: <span className="text-red-600 dark:text-red-400">{deleteAssignmentTitle}</span>
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
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
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md mx-4 border-2 border-red-200 dark:border-red-800">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-t-xl">
              <h2 className="text-2xl font-bold text-white">Delete Submission?</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-300 mb-6">
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
