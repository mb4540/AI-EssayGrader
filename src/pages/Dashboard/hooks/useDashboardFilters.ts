/**
 * Dashboard Filters Hook
 * Manages search, class period filter, and pagination state
 */

import { useState } from 'react';
import type { DashboardFilters } from '../types';

export function useDashboardFilters() {
  const [searchQuery, setSearchQuery] = useState('');
  const [classPeriodFilter, setClassPeriodFilter] = useState('');
  const [page, setPage] = useState(0);

  const filters: DashboardFilters = {
    searchQuery,
    classPeriodFilter,
    page,
  };

  const resetFilters = () => {
    setSearchQuery('');
    setClassPeriodFilter('');
    setPage(0);
  };

  return {
    // Current filter values
    filters,
    searchQuery,
    classPeriodFilter,
    page,
    
    // Setters
    setSearchQuery,
    setClassPeriodFilter,
    setPage,
    
    // Actions
    resetFilters,
  };
}
