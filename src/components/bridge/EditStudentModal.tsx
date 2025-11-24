// Edit Student Modal - Update student name or local ID

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { BridgeEntry } from '../../bridge/bridgeTypes';

interface EditStudentModalProps {
  isOpen: boolean;
  student: BridgeEntry | null;
  onClose: () => void;
  onUpdate: (uuid: string, updates: { name?: string; localId?: string; classPeriod?: string }) => BridgeEntry;
  onDelete: (uuid: string) => void;
  classPeriods: string[];
}

export default function EditStudentModal({
  isOpen,
  student,
  onClose,
  onUpdate,
  onDelete,
  classPeriods,
}: EditStudentModalProps) {
  const [name, setName] = useState('');
  const [localId, setLocalId] = useState('');
  const [classPeriod, setClassPeriod] = useState('');
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (student) {
      setName(student.name);
      setLocalId(student.localId);
      setClassPeriod(student.classPeriod || '');
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const updates: { name?: string; localId?: string; classPeriod?: string } = {};
      
      if (name.trim() !== student.name) {
        updates.name = name.trim();
      }
      
      if (localId.trim() !== student.localId) {
        updates.localId = localId.trim();
      }

      if (classPeriod !== (student.classPeriod || '')) {
        updates.classPeriod = classPeriod || undefined;
      }

      if (Object.keys(updates).length === 0) {
        handleClose();
        return;
      }

      onUpdate(student.uuid, updates);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update student');
    }
  };

  const handleDelete = () => {
    try {
      onDelete(student.uuid);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete student');
    }
  };

  const handleClose = () => {
    setName('');
    setLocalId('');
    setClassPeriod('');
    setError('');
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Edit Student</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {showDeleteConfirm ? (
            // Delete confirmation
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 font-medium mb-2">⚠️ Confirm Deletion</p>
                <p className="text-sm text-red-700">
                  Are you sure you want to delete <strong>{student.name}</strong>?
                </p>
                <p className="text-sm text-red-700 mt-2">
                  This action cannot be undone. The student's UUID will no longer be 
                  associated with their name in your local bridge.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
                >
                  Delete Student
                </button>
              </div>
            </div>
          ) : (
            // Edit form
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  UUID (Read-only)
                </label>
                <input
                  type="text"
                  value={student.uuid}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Sharon Lee"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Local Student ID *
                </label>
                <input
                  type="text"
                  value={localId}
                  onChange={(e) => setLocalId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., S123456"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Period (Optional)
                </label>
                <select
                  value={classPeriod}
                  onChange={(e) => setClassPeriod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- No Class Period --</option>
                  {classPeriods.map((period) => (
                    <option key={period} value={period}>
                      {period}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Assign student to a class period for organization
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                >
                  Save Changes
                </button>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full px-4 py-2 bg-red-50 text-red-700 rounded-md hover:bg-red-100 font-medium"
                >
                  Delete Student
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
