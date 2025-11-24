/**
 * Dashboard Filters Component
 * Search bar and class period filter
 */

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface DashboardFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  classPeriodFilter: string;
  onClassPeriodChange: (period: string) => void;
  classPeriods: string[];
  showClassFilter: boolean;
}

export default function DashboardFilters({
  searchQuery,
  onSearchChange,
  classPeriodFilter,
  onClassPeriodChange,
  classPeriods,
  showClassFilter,
}: DashboardFiltersProps) {
  return (
    <div className="mb-6 flex gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search by student name or ID..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 border-2 focus:border-indigo-500 bg-white"
        />
      </div>
      
      {/* Class Period Filter */}
      {showClassFilter && (
        <select
          value={classPeriodFilter}
          onChange={(e) => onClassPeriodChange(e.target.value)}
          className="px-4 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:border-indigo-500 bg-white min-w-[200px]"
        >
          <option value="">All Classes</option>
          {classPeriods.map((period) => (
            <option key={period} value={period}>
              {period}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
