/**
 * Dashboard Filters Hook
 * Manages search, class period filter, pagination, and sorting state
 */

import { useState, useEffect } from 'react';
import type { DashboardFilters, SortField, SortDirection } from '../types';

const SORT_STORAGE_KEY = 'dashboard-sort-preferences';

export function useDashboardFilters() {
  // Load sort preferences from localStorage
  const loadSortPreferences = (): { field: SortField; direction: SortDirection } => {
    try {
      const stored = localStorage.getItem(SORT_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load sort preferences:', error);
    }
    return { field: 'created_at', direction: 'desc' }; // Default: newest first
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [classPeriodFilter, setClassPeriodFilter] = useState('');
  const [page, setPage] = useState(0);
  
  const initialSort = loadSortPreferences();
  const [sortField, setSortFieldState] = useState<SortField>(initialSort.field);
  const [sortDirection, setSortDirectionState] = useState<SortDirection>(initialSort.direction);

  // Save sort preferences to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(
        SORT_STORAGE_KEY,
        JSON.stringify({ field: sortField, direction: sortDirection })
      );
    } catch (error) {
      console.error('Failed to save sort preferences:', error);
    }
  }, [sortField, sortDirection]);

  const filters: DashboardFilters = {
    searchQuery,
    classPeriodFilter,
    page,
    sortField,
    sortDirection,
  };

  const setSortField = (field: SortField) => {
    setSortFieldState(field);
    setPage(0); // Reset to first page when sorting changes
  };

  const setSortDirection = (direction: SortDirection) => {
    setSortDirectionState(direction);
    setPage(0); // Reset to first page when sorting changes
  };

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  const resetFilters = () => {
    setSearchQuery('');
    setClassPeriodFilter('');
    setPage(0);
    // Note: We don't reset sort preferences as they're user preferences
  };

  return {
    // Current filter values
    filters,
    searchQuery,
    classPeriodFilter,
    page,
    sortField,
    sortDirection,
    
    // Setters
    setSearchQuery,
    setClassPeriodFilter,
    setPage,
    setSortField,
    setSortDirection,
    toggleSortDirection,
    
    // Actions
    resetFilters,
  };
}
