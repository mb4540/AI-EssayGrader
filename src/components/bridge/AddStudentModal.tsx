// Add Student Modal - Form to add individual students to the bridge

import { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { BridgeEntry } from '../../bridge/bridgeTypes';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, localId: string) => BridgeEntry;
}

export default function AddStudentModal({ isOpen, onClose, onAdd }: AddStudentModalProps) {
  const [name, setName] = useState('');
  const [localId, setLocalId] = useState('');
  const [error, setError] = useState('');
  const [addedStudent, setAddedStudent] = useState<BridgeEntry | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const student = onAdd(name.trim(), localId.trim());
      setAddedStudent(student);
      setName('');
      setLocalId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add student');
    }
  };

  const handleCopyUuid = () => {
    if (addedStudent) {
      navigator.clipboard.writeText(addedStudent.uuid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setName('');
    setLocalId('');
    setError('');
    setAddedStudent(null);
    setCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Add Student</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {addedStudent ? (
            // Success state - show UUID
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-800 font-medium mb-2">✓ Student Added Successfully</p>
                <p className="text-sm text-green-700">
                  <strong>{addedStudent.name}</strong> (ID: {addedStudent.localId})
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Generated UUID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={addedStudent.uuid}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
                  />
                  <button
                    onClick={handleCopyUuid}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  This UUID will be used for all cloud operations
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setAddedStudent(null)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                >
                  Add Another
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            // Form state
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <p className="text-xs text-gray-500 mt-1">
                  Your district's student ID or any unique identifier
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
                  Add Student
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Privacy Notice */}
        <div className="px-6 pb-6">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-800">
              <strong>Privacy:</strong> Student information is encrypted and stored locally. 
              Only the UUID is sent to the cloud.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
