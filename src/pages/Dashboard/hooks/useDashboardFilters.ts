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
  
  const [startDate, setStartDateState] = useState<string | null>(null);
  const [endDate, setEndDateState] = useState<string | null>(null);

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
    startDate,
    endDate,
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

  const setStartDate = (date: string | null) => {
    setStartDateState(date);
    setPage(0); // Reset to first page when date changes
  };

  const setEndDate = (date: string | null) => {
    setEndDateState(date);
    setPage(0); // Reset to first page when date changes
  };

  const setDatePreset = (preset: 'last7' | 'last30' | 'all') => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    switch (preset) {
      case 'last7':
        const last7 = new Date(today);
        last7.setDate(last7.getDate() - 7);
        last7.setHours(0, 0, 0, 0);
        setStartDate(last7.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'last30':
        const last30 = new Date(today);
        last30.setDate(last30.getDate() - 30);
        last30.setHours(0, 0, 0, 0);
        setStartDate(last30.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'all':
        setStartDate(null);
        setEndDate(null);
        break;
    }
  };

  const clearDateRange = () => {
    setStartDate(null);
    setEndDate(null);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setClassPeriodFilter('');
    setPage(0);
    setStartDate(null);
    setEndDate(null);
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
    startDate,
    endDate,
    
    // Setters
    setSearchQuery,
    setClassPeriodFilter,
    setPage,
    setSortField,
    setSortDirection,
    toggleSortDirection,
    setStartDate,
    setEndDate,
    setDatePreset,
    clearDateRange,
    
    // Actions
    resetFilters,
  };
}
