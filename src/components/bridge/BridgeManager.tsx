// Bridge Manager - Main UI for student identity management
// Handles bridge creation, unlock, roster management, and import/export

import { useState } from 'react';
import { useBridge } from '../../hooks/useBridge';
import { Lock, Unlock, Plus, Upload, Download, FileText, Users, Edit } from 'lucide-react';
import AddStudentModal from './AddStudentModal';
import ImportCsvModal from './ImportCsvModal';
import EditStudentModal from './EditStudentModal';
import { BridgeEntry } from '../../bridge/bridgeTypes';

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Unlock className="w-8 h-8 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Student Roster</h1>
                <p className="text-sm text-gray-600">
                  {bridge.students.length} student{bridge.students.length !== 1 ? 's' : ''} • 
                  Bridge unlocked
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={bridge.save}
                disabled={bridge.loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={bridge.exportFile}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={handleLock}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Lock
              </button>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Student
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Import CSV
            </button>
          </div>
        </div>

        {/* Roster Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
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
        </div>

        {/* Modals */}
        <AddStudentModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={(name, localId) => {
            const student = bridge.addStudent(name, localId);
            bridge.save().catch(console.error); // Auto-save after adding
            return student;
          }}
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
            return student;
          }}
          onDelete={(uuid) => {
            bridge.deleteStudent(uuid);
            bridge.save().catch(console.error); // Auto-save after delete
          }}
        />
      </div>
    </div>
  );
}
