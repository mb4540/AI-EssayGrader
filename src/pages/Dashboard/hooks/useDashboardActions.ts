/**
 * Dashboard Actions Hook
 * Manages modal state, delete confirmations, and export functionality
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { exportToCSV } from '@/lib/csv';
import type { UseBridgeReturn } from '@/hooks/useBridge';

interface Assignment {
  id: string; // API returns 'id', not 'assignment_id'
  assignment_id?: string; // Optional for backwards compatibility
  title: string;
  [key: string]: any;
}

export function useDashboardActions() {
  const navigate = useNavigate();

  // Assignment modal state
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  // Delete confirmation state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteAssignmentTitle, setDeleteAssignmentTitle] = useState<string | null>(null);

  // Listen for assignment modal trigger from navigation
  useEffect(() => {
    const handleOpenModal = () => setIsAssignmentModalOpen(true);
    window.addEventListener('openAssignmentModal', handleOpenModal);
    return () => window.removeEventListener('openAssignmentModal', handleOpenModal);
  }, []);

  // Modal actions
  const openAssignmentModal = () => {
    setModalMode('create');
    setEditingAssignment(null);
    setIsAssignmentModalOpen(true);
  };

  const closeAssignmentModal = () => {
    setIsAssignmentModalOpen(false);
    setEditingAssignment(null);
  };

  const setEditMode = (assignment: Assignment) => {
    setModalMode('edit');
    setEditingAssignment(assignment);
    setIsAssignmentModalOpen(true);
  };

  // Delete actions
  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const handleDeleteAssignment = (title: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setDeleteAssignmentTitle(title);
  };

  const cancelDelete = () => {
    setDeleteId(null);
    setDeleteAssignmentTitle(null);
  };

  // Export action
  const handleExport = (submissions: any[], bridge: UseBridgeReturn) => {
    // Transform submissions to include resolved student names from bridge
    const exportData = submissions.map(s => {
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
    });
    
    exportToCSV(exportData, `submissions-${new Date().toISOString().split('T')[0]}.csv`);
  };

  // Navigation
  const handleViewSubmission = (id: string) => {
    navigate(`/submission/${id}`);
  };

  return {
    // Modal state
    isAssignmentModalOpen,
    modalMode,
    editingAssignment,
    openAssignmentModal,
    closeAssignmentModal,
    setEditMode,

    // Delete state
    deleteId,
    deleteAssignmentTitle,
    handleDelete,
    handleDeleteAssignment,
    cancelDelete,

    // Other actions
    handleExport,
    handleViewSubmission,
  };
}
