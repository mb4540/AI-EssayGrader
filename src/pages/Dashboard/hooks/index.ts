/**
 * Dashboard custom hooks
 * 
 * Modular hooks that separate concerns:
 * - useDashboardData: Data fetching, caching, and mutations
 * - useDashboardFilters: Search, class filter, and pagination state
 * - useDashboardGrouping: Group submissions by student/assignment/class
 * - useDashboardActions: Modal state, delete confirmations, and actions
 * - useDashboardStats: Calculate statistics for dashboard display
 */

export * from './useDashboardData';
export * from './useDashboardFilters';
export * from './useDashboardGrouping';
export * from './useDashboardActions';
export * from './useDashboardStats';
