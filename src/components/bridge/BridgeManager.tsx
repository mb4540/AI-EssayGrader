// Bridge Manager - Main UI for student identity management
// Handles bridge creation, unlock, roster management, and import/export

import { useState } from 'react';
import { useBridge } from '../../hooks/useBridge';
import { Lock, Plus, Upload, Download, FileText, Users, Edit } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import AddStudentModal from './AddStudentModal';
import ImportCsvModal from './ImportCsvModal';
import EditStudentModal from './EditStudentModal';
import { BridgeEntry } from '../../bridge/bridgeTypes';
import { updateStudent } from '../../lib/api';

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

  // Class period management
  const [newClassPeriod, setNewClassPeriod] = useState('');
  const [classError, setClassError] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ success: number; failed: number; total: number } | null>(null);

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
              <div>
                <CardTitle className="text-lg text-gray-900">Manage Class Periods</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Create class periods to organize your students
                </p>
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

            {/* Class Periods List */}
            {bridge.getClassPeriods().length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <p className="text-sm">No class periods yet. Add one above to get started.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {bridge.getClassPeriods().map((period) => (
                  <div
                    key={period}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200"
                  >
                    <span className="text-sm font-medium text-gray-900">{period}</span>
                    <button
                      onClick={() => handleRemoveClassPeriod(period)}
                      className="text-sm text-red-600 hover:text-red-800 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Roster Table Card */}
        <Card className="shadow-xl bg-white">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Local ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class
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
              {bridge.students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-lg font-medium">No students yet</p>
                    <p className="text-sm">Add students individually or import from CSV</p>
                  </td>
                </tr>
              ) : (
                bridge.students.map((student) => (
                  <tr key={student.uuid} className="hover:bg-gray-50">
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
            await bridge.save(); // Auto-save after import
            return result;
          }}
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
