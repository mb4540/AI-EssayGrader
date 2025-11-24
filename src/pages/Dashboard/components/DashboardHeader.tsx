/**
 * Dashboard Header Component
 * Displays page header with view mode switcher, sort controls, and export button
 */

import { Download, User, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';
import type { ViewMode } from '../types';

interface DashboardHeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onExport: () => void;
  hasClassPeriods: boolean;
  submissionCount: number;
}

export default function DashboardHeader({
  viewMode,
  setViewMode,
  onExport,
  hasClassPeriods,
  submissionCount,
}: DashboardHeaderProps) {
  return (
    <PageHeader
      icon={<span className="text-2xl">📚</span>}
      title="Dashboard"
      subtitle="View and manage all submissions"
      showAddAssignment={true}
      showBridgeLock={true}
      actions={
        <>
          <Button 
            onClick={onExport} 
            variant="outline"
            size="sm"
            disabled={submissionCount === 0}
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
          {hasClassPeriods && (
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
  );
}
