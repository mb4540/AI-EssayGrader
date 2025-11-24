/**
 * SortDropdown Component
 * 
 * Dropdown for selecting sort field and direction
 */

import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SortField, SortDirection } from '../types';

interface SortDropdownProps {
  sortField: SortField;
  sortDirection: SortDirection;
  onSortFieldChange: (field: SortField) => void;
  onToggleDirection: () => void;
}

const sortOptions: { value: SortField; label: string }[] = [
  { value: 'created_at', label: 'Date Created' },
  { value: 'student_name', label: 'Student Name' },
  { value: 'assignment_title', label: 'Assignment' },
  { value: 'ai_grade', label: 'AI Grade' },
  { value: 'teacher_grade', label: 'Teacher Grade' },
];

export default function SortDropdown({
  sortField,
  sortDirection,
  onSortFieldChange,
  onToggleDirection,
}: SortDropdownProps) {
  const DirectionIcon = sortDirection === 'asc' ? ArrowUp : ArrowDown;

  return (
    <div className="flex items-center gap-2">
      {/* Sort Field Selector */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground">
        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
        <select
          value={sortField}
          onChange={(e) => onSortFieldChange(e.target.value as SortField)}
          className="bg-transparent border-none outline-none text-sm cursor-pointer pr-1"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Sort Direction Toggle */}
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleDirection}
        className="gap-2"
        title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
      >
        <DirectionIcon className="h-4 w-4" />
        <span className="hidden sm:inline">
          {sortDirection === 'asc' ? 'A-Z' : 'Z-A'}
        </span>
      </Button>
    </div>
  );
}
