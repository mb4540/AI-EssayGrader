// Bridge Manager - Main UI for student identity management
// Handles bridge creation, unlock, roster management, and import/export

import { useState, useMemo } from 'react';
import { useBridge } from '../../hooks/useBridge';
import { Lock, Plus, Upload, Download, FileText, Users, Edit, Search, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import AddStudentModal from './AddStudentModal';
import ImportCsvModal from './ImportCsvModal';
import EditStudentModal from './EditStudentModal';
import ImportResultsModal, { ImportResults } from './ImportResultsModal';
import ContextHelp from '../help/ContextHelp';
import { BridgeEntry } from '../../bridge/bridgeTypes';
import { updateStudent, updateStudentsBulk } from '../../lib/api';

export default function BridgeManager() {
  const bridge = useBridge();
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [mode, setMode] = useState<'unlock' | 'create'>('unlock');
  
  // Create mode metadata
  const [district, setDistrict] = useState('');
  const [school, setSchool] = useState('');
  const [teacherName, setTeacherName] = useState('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<BridgeEntry | null>(null);
  const [showImportResultsModal, setShowImportResultsModal] = useState(false);
  const [importResults, setImportResults] = useState<ImportResults | null>(null);
  const [isRetryingSave, setIsRetryingSave] = useState(false);

  // Class period management
  const [newClassPeriod, setNewClassPeriod] = useState('');
  const [classError, setClassError] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ success: number; failed: number; total: number } | null>(null);

  // Bulk selection state
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [bulkClassPeriod, setBulkClassPeriod] = useState('');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Filter, sort, and search state
  const [filterClassPeriod, setFilterClassPeriod] = useState<string>('all');
  const [sortColumn, setSortColumn] = useState<'localId' | 'name' | 'classPeriod'>('classPeriod');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');

  // Compute unique class periods from students (fixes bug where imported periods don't show)
  const uniqueClassPeriods = useMemo(() => {
    const periods = new Set<string>();
    bridge.students.forEach(s => {
      if (s.classPeriod) periods.add(s.classPeriod);
    });
    // Also include manually added class periods
    bridge.getClassPeriods().forEach(p => periods.add(p));
    return Array.from(periods).sort();
  }, [bridge.students, bridge.getClassPeriods]);

  // Filter and sort students
  const filteredAndSortedStudents = useMemo(() => {
    let result = [...bridge.students];

    // Apply search filter (semantic: matches partial name, case-insensitive)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(s => s.name.toLowerCase().includes(term));
    }

    // Apply class period filter
    if (filterClassPeriod !== 'all') {
      if (filterClassPeriod === 'unassigned') {
        result = result.filter(s => !s.classPeriod);
      } else {
        result = result.filter(s => s.classPeriod === filterClassPeriod);
      }
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortColumn === 'localId') {
        comparison = a.localId.localeCompare(b.localId);
      } else if (sortColumn === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortColumn === 'classPeriod') {
        const aPeriod = a.classPeriod || '';
        const bPeriod = b.classPeriod || '';
        comparison = aPeriod.localeCompare(bPeriod);
        // Secondary sort by name when class periods are equal
        if (comparison === 0) {
          comparison = a.name.localeCompare(b.name);
        }
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [bridge.students, searchTerm, filterClassPeriod, sortColumn, sortDirection]);

  // Handle column sort click
  const handleSortClick = (column: 'localId' | 'name' | 'classPeriod') => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Check if any filters are active
  const hasActiveFilters = filterClassPeriod !== 'all' || searchTerm.trim() !== '';

  // Clear all filters
  const clearFilters = () => {
    setFilterClassPeriod('all');
    setSearchTerm('');
  };

  // Handle unlock
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await bridge.unlock(passphrase);
      setPassphrase('');
    } catch (err) {
      console.error('Unlock failed:', err);
    }
  };

  // Handle create new
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await bridge.createNew(passphrase, {
        district: district || undefined,
        school: school || undefined,
        teacherName: teacherName || undefined,
      });
      setPassphrase('');
      setDistrict('');
      setSchool('');
      setTeacherName('');
    } catch (err) {
      console.error('Create failed:', err);
    }
  };

  // Handle lock
  const handleLock = () => {
    if (confirm('Lock bridge? You will need your passphrase to unlock it again.')) {
      bridge.lock();
    }
  };

  // Handle add class period
  const handleAddClassPeriod = (e: React.FormEvent) => {
    e.preventDefault();
    setClassError('');
    
    if (!newClassPeriod.trim()) {
      setClassError('Class period name is required');
      return;
    }

    try {
      bridge.addClassPeriod(newClassPeriod.trim());
      setNewClassPeriod('');
      bridge.save().catch(console.error); // Auto-save after adding
    } catch (err) {
      setClassError(err instanceof Error ? err.message : 'Failed to add class period');
    }
  };

  // Handle remove class period
  const handleRemoveClassPeriod = (name: string) => {
    if (confirm(`Remove class period "${name}"? Students assigned to this class will not be affected.`)) {
      try {
        bridge.removeClassPeriod(name);
        bridge.save().catch(console.error); // Auto-save after removing
      } catch (err) {
        console.error('Failed to remove class period:', err);
      }
    }
  };

  // Handle sync all students to database
  const handleSyncAll = async () => {
    if (!confirm('Sync all students\' class periods to the database? This will update the database with current Bridge data.')) {
      return;
    }

    setIsSyncing(true);
    setSyncStatus(null);
    
    let success = 0;
    let failed = 0;
    const total = bridge.students.length;

    for (const student of bridge.students) {
      try {
        await updateStudent(student.uuid, { 
          class_period: student.classPeriod || null 
        });
        success++;
      } catch (err) {
        console.error(`Failed to sync student ${student.uuid}:`, err);
        failed++;
      }
    }

    setSyncStatus({ success, failed, total });
    setIsSyncing(false);

    // Clear status after 5 seconds
    setTimeout(() => setSyncStatus(null), 5000);
  };

  // Handle bulk class period update
  const handleBulkClassPeriodUpdate = async () => {
    if (selectedStudents.size === 0) return;
    
    setIsBulkUpdating(true);
    try {
      const uuids = Array.from(selectedStudents);
      const classPeriodValue = bulkClassPeriod || null;
      
      // Update local bridge entries
      for (const uuid of uuids) {
        bridge.updateStudent(uuid, { classPeriod: bulkClassPeriod || undefined });
      }
      await bridge.save();
      
      // Sync to Neon
      await updateStudentsBulk(uuids, classPeriodValue);
      
      // Clear selection
      setSelectedStudents(new Set());
      setBulkClassPeriod('');
    } catch (err) {
      console.error('Bulk update failed:', err);
      alert('Failed to update class periods. Please try again.');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Toggle student selection
  const toggleStudentSelection = (uuid: string) => {
    setSelectedStudents(prev => {
      const next = new Set(prev);
      if (next.has(uuid)) {
        next.delete(uuid);
      } else {
        next.add(uuid);
      }
      return next;
    });
  };

  // Toggle all students (works with filtered list)
  const toggleAllStudents = () => {
    const currentFiltered = filteredAndSortedStudents;
    const allFilteredSelected = currentFiltered.every(s => selectedStudents.has(s.uuid));
    
    if (allFilteredSelected && currentFiltered.length > 0) {
      // Deselect all filtered students
      setSelectedStudents(prev => {
        const next = new Set(prev);
        currentFiltered.forEach(s => next.delete(s.uuid));
        return next;
      });
    } else {
      // Select all filtered students
      setSelectedStudents(prev => {
        const next = new Set(prev);
        currentFiltered.forEach(s => next.add(s.uuid));
        return next;
      });
    }
  };

  // If locked, show unlock/create interface
  if (bridge.isLocked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="flex items-center justify-center mb-6">
            <Lock className="w-12 h-12 text-blue-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-center mb-2">Student Identity Bridge</h1>
          <p className="text-gray-600 text-center mb-6">
            Secure, local-only student roster management
          </p>

          {/* Mode selector */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode('unlock')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                mode === 'unlock'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Unlock Existing
            </button>
            <button
              onClick={() => setMode('create')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                mode === 'create'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Create New
            </button>
          </div>

          {mode === 'unlock' ? (
            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Passphrase
                </label>
                <div className="relative">
                  <input
                    type={showPassphrase ? 'text' : 'password'}
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your passphrase"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassphrase(!showPassphrase)}
                    className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassphrase ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {bridge.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  {bridge.error}
                </div>
              )}

              <button
                type="submit"
                disabled={bridge.loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {bridge.loading ? 'Unlocking...' : 'Unlock Bridge'}
              </button>

              {!bridge.supportsFileSystem && (
                <button
                  type="button"
                  onClick={bridge.importFile}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 font-medium flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Import Bridge File
                </button>
              )}
            </form>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Passphrase *
                </label>
                <div className="relative">
                  <input
                    type={showPassphrase ? 'text' : 'password'}
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Choose a strong passphrase"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassphrase(!showPassphrase)}
                    className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassphrase ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  District (optional)
                </label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Mansfield ISD"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  School (optional)
                </label>
                <input
                  type="text"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Asa Low Intermediate"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name (optional)
                </label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Teacher name"
                />
              </div>

              {bridge.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  {bridge.error}
                </div>
              )}

              <button
                type="submit"
                disabled={bridge.loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {bridge.loading ? 'Creating...' : 'Create Bridge'}
              </button>
            </form>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Privacy First:</strong> Your bridge file is encrypted and stored locally. 
              Student names never leave your device.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If unlocked, show roster management interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-6">
        {/* Student Roster Header Card */}
        <Card className="shadow-xl border-t-4 border-t-indigo-500 bg-white mb-6">
          <CardHeader className="py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-gray-900">Student Roster</CardTitle>
                  <p className="text-sm text-gray-600">
                    {bridge.students.length} student{bridge.students.length !== 1 ? 's' : ''} • Bridge unlocked
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={bridge.save}
                  disabled={bridge.loading}
                  variant="default"
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button
                  onClick={bridge.exportFile}
                  variant="outline"
                  size="sm"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <div className="w-px h-8 bg-gray-300 mx-2" />
                <Button
                  onClick={() => setShowAddModal(true)}
                  variant="default"
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Student
                </Button>
                <Button
                  onClick={() => setShowImportModal(true)}
                  variant="outline"
                  size="sm"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import CSV
                </Button>
                <div className="w-px h-8 bg-gray-300 mx-2" />
                <Button
                  onClick={handleLock}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Lock
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Manage Classes Card */}
        <Card className="shadow-xl bg-white mb-6">
          <CardHeader className="py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div>
                  <CardTitle className="text-lg text-gray-900">Manage Class Periods</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Create class periods to organize your students
                  </p>
                </div>
                <ContextHelp helpId="students.classPeriods" />
              </div>
              <Button
                onClick={handleSyncAll}
                disabled={isSyncing || bridge.students.length === 0}
                variant="outline"
                size="sm"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                {isSyncing ? 'Syncing...' : 'Sync All to Database'}
              </Button>
            </div>
          </CardHeader>
          <div className="p-6">
            {/* Add Class Period Form */}
            <form onSubmit={handleAddClassPeriod} className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newClassPeriod}
                  onChange={(e) => setNewClassPeriod(e.target.value)}
                  placeholder="e.g., Period 1, Block A, 3rd Hour"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Class
                </Button>
              </div>
              {classError && (
                <p className="text-sm text-red-600 mt-2">{classError}</p>
              )}
            </form>

            {/* Sync Status */}
            {syncStatus && (
              <div className={`p-3 rounded-md mb-4 ${
                syncStatus.failed === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <p className={`text-sm font-medium ${
                  syncStatus.failed === 0 ? 'text-green-800' : 'text-yellow-800'
                }`}>
                  ✓ Synced {syncStatus.success} of {syncStatus.total} students to database
                  {syncStatus.failed > 0 && ` (${syncStatus.failed} failed)`}
                </p>
              </div>
            )}

            {/* Class Periods List - shows all unique periods from students + manually added */}
            {uniqueClassPeriods.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <p className="text-sm">No class periods yet. Add one above or import students with class periods.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {uniqueClassPeriods.map((period) => {
                  const studentCount = bridge.students.filter(s => s.classPeriod === period).length;
                  const isManuallyAdded = bridge.getClassPeriods().includes(period);
                  return (
                    <div
                      key={period}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{period}</span>
                        <span className="text-xs text-gray-500">({studentCount} student{studentCount !== 1 ? 's' : ''})</span>
                      </div>
                      {isManuallyAdded && (
                        <button
                          onClick={() => handleRemoveClassPeriod(period)}
                          className="text-sm text-red-600 hover:text-red-800 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Bulk Action Bar */}
        {selectedStudents.size > 0 && (
          <Card className="shadow-xl bg-indigo-50 border-2 border-indigo-300 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-indigo-800">
                  {selectedStudents.size} student{selectedStudents.size !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={() => setSelectedStudents(new Set())}
                  className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                >
                  Clear selection
                </button>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={bulkClassPeriod}
                  onChange={(e) => setBulkClassPeriod(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-indigo-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Select Class Period --</option>
                  {bridge.getClassPeriods().map((period) => (
                    <option key={period} value={period}>{period}</option>
                  ))}
                </select>
                <Button
                  onClick={handleBulkClassPeriodUpdate}
                  disabled={isBulkUpdating || !bulkClassPeriod}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {isBulkUpdating ? 'Updating...' : 'Assign Class Period'}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Roster Table Card */}
        <Card className="shadow-xl bg-white">
          {/* Search and Filter Bar */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by student name..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              
              {/* Class Period Filter */}
              <select
                value={filterClassPeriod}
                onChange={(e) => setFilterClassPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              >
                <option value="all">All Classes ({bridge.students.length})</option>
                {uniqueClassPeriods.map((period) => {
                  const count = bridge.students.filter(s => s.classPeriod === period).length;
                  return (
                    <option key={period} value={period}>{period} ({count})</option>
                  );
                })}
                <option value="unassigned">Unassigned ({bridge.students.filter(s => !s.classPeriod).length})</option>
              </select>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>
            
            {/* Results Count */}
            {hasActiveFilters && (
              <p className="mt-2 text-sm text-gray-600">
                Showing {filteredAndSortedStudents.length} of {bridge.students.length} students
              </p>
            )}
          </div>

          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={filteredAndSortedStudents.length > 0 && filteredAndSortedStudents.every(s => selectedStudents.has(s.uuid))}
                    onChange={toggleAllStudents}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSortClick('localId')}
                >
                  <div className="flex items-center gap-1">
                    Local ID
                    {sortColumn === 'localId' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-gray-300" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSortClick('name')}
                >
                  <div className="flex items-center gap-1">
                    Student Name
                    {sortColumn === 'name' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-gray-300" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSortClick('classPeriod')}
                >
                  <div className="flex items-center gap-1">
                    Class
                    {sortColumn === 'classPeriod' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-gray-300" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  UUID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {bridge.students.length === 0 ? (
                      <>
                        <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-lg font-medium">No students yet</p>
                        <p className="text-sm">Add students individually or import from CSV</p>
                      </>
                    ) : (
                      <>
                        <Search className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-lg font-medium">No matching students</p>
                        <p className="text-sm">Try adjusting your search or filter</p>
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                filteredAndSortedStudents.map((student) => (
                  <tr key={student.uuid} className={`hover:bg-gray-50 ${selectedStudents.has(student.uuid) ? 'bg-indigo-50' : ''}`}>
                    <td className="px-3 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedStudents.has(student.uuid)}
                        onChange={() => toggleStudentSelection(student.uuid)}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.localId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {student.classPeriod || <span className="text-gray-400 italic">—</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {student.uuid.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => {
                          setEditingStudent(student);
                          setShowEditModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 mr-3 flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>

        {/* Modals */}
        <AddStudentModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={(name, localId, classPeriod) => {
            const student = bridge.addStudent(name, localId, classPeriod);
            bridge.save().catch(console.error); // Auto-save after adding
            
            // Sync class_period to database if provided
            if (classPeriod) {
              updateStudent(student.uuid, { class_period: classPeriod })
                .catch(err => console.error('Failed to sync class period to database:', err));
            }
            
            return student;
          }}
          classPeriods={bridge.getClassPeriods()}
        />

        <ImportCsvModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImport={async (csvText) => {
            const result = await bridge.importCsv(csvText);
            
            // Build import results object
            const results: ImportResults = {
              added: result.added,
              updated: result.updated,
              skipped: result.skipped,
              errors: result.errors,
              savedToFile: false,
              syncedToDatabase: false,
            };
            
            // Try to save to local encrypted file
            try {
              await bridge.save();
              results.savedToFile = true;
            } catch (err) {
              results.saveError = err instanceof Error ? err.message : 'Unknown error';
            }
            
            // Sync class periods to Neon for affected students
            if (result.affectedUuids.length > 0) {
              try {
                const studentsToSync = result.affectedUuids
                  .map(uuid => bridge.findByUuid(uuid))
                  .filter((s): s is NonNullable<typeof s> => s !== null);
                
                const byClassPeriod = new Map<string | null, string[]>();
                for (const student of studentsToSync) {
                  const cp = student.classPeriod || null;
                  if (!byClassPeriod.has(cp)) {
                    byClassPeriod.set(cp, []);
                  }
                  byClassPeriod.get(cp)!.push(student.uuid);
                }
                
                let totalUpdated = 0;
                let totalInserted = 0;
                let totalFailed = 0;
                
                for (const [classPeriod, uuids] of byClassPeriod) {
                  try {
                    const syncResult = await updateStudentsBulk(uuids, classPeriod);
                    totalUpdated += syncResult.updated;
                    totalInserted += syncResult.inserted;
                    totalFailed += syncResult.failed;
                  } catch {
                    totalFailed += uuids.length;
                  }
                }
                
                results.syncedToDatabase = totalFailed === 0;
                results.syncResults = { updated: totalUpdated, inserted: totalInserted, failed: totalFailed };
              } catch (err) {
                console.error('Failed to sync class periods to database:', err);
              }
            } else {
              results.syncedToDatabase = true; // Nothing to sync
            }
            
            // Show results modal
            setImportResults(results);
            setShowImportResultsModal(true);
            
            return result;
          }}
        />

        <ImportResultsModal
          isOpen={showImportResultsModal}
          onClose={() => {
            setShowImportResultsModal(false);
            setImportResults(null);
          }}
          results={importResults || {
            added: 0,
            updated: 0,
            skipped: 0,
            errors: [],
            savedToFile: false,
            syncedToDatabase: false,
          }}
          onRetry={async () => {
            if (!importResults) return;
            setIsRetryingSave(true);
            try {
              await bridge.save();
              setImportResults({ ...importResults, savedToFile: true, saveError: undefined });
            } catch (err) {
              setImportResults({
                ...importResults,
                saveError: err instanceof Error ? err.message : 'Unknown error',
              });
            } finally {
              setIsRetryingSave(false);
            }
          }}
          isRetrying={isRetryingSave}
        />

        <EditStudentModal
          isOpen={showEditModal}
          student={editingStudent}
          onClose={() => {
            setShowEditModal(false);
            setEditingStudent(null);
          }}
          onUpdate={(uuid, updates) => {
            const student = bridge.updateStudent(uuid, updates);
            bridge.save().catch(console.error); // Auto-save after update
            
            // Sync class_period to database if it changed
            if (updates.classPeriod !== undefined) {
              updateStudent(uuid, { class_period: updates.classPeriod || null })
                .catch(err => console.error('Failed to sync class period to database:', err));
            }
            
            return student;
          }}
          onDelete={(uuid) => {
            bridge.deleteStudent(uuid);
            bridge.save().catch(console.error); // Auto-save after delete
          }}
          classPeriods={bridge.getClassPeriods()}
        />
      </div>
    </div>
  );
}
