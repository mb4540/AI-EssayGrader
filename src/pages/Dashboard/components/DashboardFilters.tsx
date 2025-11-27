/**
 * Dashboard Filters Component
 * Class period filter
 */

interface DashboardFiltersProps {
  classPeriodFilter: string;
  onClassPeriodChange: (period: string) => void;
  classPeriods: string[];
  showClassFilter: boolean;
}

export default function DashboardFilters({
  classPeriodFilter,
  onClassPeriodChange,
  classPeriods,
  showClassFilter,
}: DashboardFiltersProps) {
  return (
    <div className="mb-6 flex gap-4 justify-end">      
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
