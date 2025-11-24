/**
 * DateRangeFilter Component
 * 
 * Date range picker with preset buttons and sort toggle
 */

import { Calendar, X, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SortDirection } from '../types';

interface DateRangeFilterProps {
  startDate: string | null;
  endDate: string | null;
  onStartDateChange: (date: string | null) => void;
  onEndDateChange: (date: string | null) => void;
  onPresetClick: (preset: 'last7' | 'last30' | 'all') => void;
  onClear: () => void;
  sortDirection: SortDirection;
  onToggleSortDirection: () => void;
}

export default function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onPresetClick,
  onClear,
  sortDirection,
  onToggleSortDirection,
}: DateRangeFilterProps) {
  const hasDateFilter = startDate !== null || endDate !== null;
  const DirectionIcon = sortDirection === 'asc' ? ArrowUp : ArrowDown;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Calendar className="w-4 h-4" />
        <span>Date Range:</span>
      </div>

      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPresetClick('last7')}
          className="text-xs"
        >
          Last 7 Days
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPresetClick('last30')}
          className="text-xs"
        >
          Last 30 Days
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPresetClick('all')}
          className="text-xs"
        >
          All Time
        </Button>
      </div>

      {/* Custom Date Inputs */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <label htmlFor="start-date" className="text-xs text-gray-600">
            From:
          </label>
          <input
            id="start-date"
            type="date"
            value={startDate || ''}
            onChange={(e) => onStartDateChange(e.target.value || null)}
            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1">
          <label htmlFor="end-date" className="text-xs text-gray-600">
            To:
          </label>
          <input
            id="end-date"
            type="date"
            value={endDate || ''}
            onChange={(e) => onEndDateChange(e.target.value || null)}
            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Clear Button */}
      {hasDateFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="gap-1 text-xs text-gray-600 hover:text-gray-900"
        >
          <X className="w-3 h-3" />
          Clear
        </Button>
      )}

      {/* Divider */}
      <div className="hidden sm:block w-px h-8 bg-gray-300" />

      {/* Sort by Student */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Sort by Student:</span>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleSortDirection}
          className="gap-2"
          title={sortDirection === 'asc' ? 'A to Z' : 'Z to A'}
        >
          <DirectionIcon className="w-4 h-4" />
          <span className="text-xs">
            {sortDirection === 'asc' ? 'A-Z' : 'Z-A'}
          </span>
        </Button>
      </div>
    </div>
  );
}
