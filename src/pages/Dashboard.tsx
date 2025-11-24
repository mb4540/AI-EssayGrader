/**
 * Dashboard Page
 * 
 * Main dashboard for viewing and managing submissions.
 * Supports three view modes:
 * - By Student: Groups submissions by student
 * - By Assignment: Groups submissions by assignment
 * - By Class: Groups submissions by class period → student
 * 
 * Refactored into modular components and custom hooks for:
 * - Better maintainability
 * - Improved testability
 * - Easier extensibility
 */

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import CreateAssignmentModal from '@/components/CreateAssignmentModal';
import { useBridge } from '@/hooks/useBridge';
import { useDashboardData, useDashboardFilters, useDashboardGrouping, useDashboardActions, useDashboardStats } from './Dashboard/hooks';
import { DashboardHeader, DashboardFilters, DeleteConfirmModal, DashboardStats, DateRangeFilter } from './Dashboard/components';
import { ByStudentView, ByAssignmentView, ByClassView } from './Dashboard/components/views';
import type { ViewMode } from './Dashboard/types';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const bridge = useBridge();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  
  // Custom hooks for data, filters, grouping, and actions
  const filterHook = useDashboardFilters();
  const { filters, searchQuery, classPeriodFilter, sortField, sortDirection, startDate, endDate, setSearchQuery, setClassPeriodFilter, setPage, toggleSortDirection, setStartDate, setEndDate, setDatePreset, clearDateRange } = filterHook;
  
  const dataHook = useDashboardData(filters);
  const { submissions, assignments, isLoading, deleteSubmission: deleteSubmissionMutation, deleteAssignment: deleteAssignmentMutation, isDeleting } = dataHook;
  
  const groupingHook = useDashboardGrouping(submissions, bridge, sortField, sortDirection);
  const { groupedByStudent, groupedByAssignment, groupedByClass } = groupingHook;
  
  const stats = useDashboardStats(submissions);
  
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

        {/* Date Range Filter */}
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onPresetClick={setDatePreset}
          onClear={clearDateRange}
          sortDirection={sortDirection}
          onToggleSortDirection={toggleSortDirection}
        />

        {/* Statistics Summary */}
        <DashboardStats stats={stats} />

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
              <ByStudentView
                groupedByStudent={groupedByStudent}
                onView={handleViewSubmission}
                onDelete={handleDelete}
              />
            ) : viewMode === 'class' ? (
              <ByClassView
                groupedByClass={groupedByClass}
                onView={handleViewSubmission}
                onDelete={handleDelete}
              />
            ) : (
              <ByAssignmentView
                assignments={assignments}
                groupedByAssignment={groupedByAssignment}
                bridge={bridge}
                onView={handleViewSubmission}
                onDelete={handleDelete}
                onEditAssignment={setEditMode}
                onDeleteAssignment={handleDeleteAssignment}
              />
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
