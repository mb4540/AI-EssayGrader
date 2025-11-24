/**
 * Delete Confirmation Modal Component
 * Handles both submission and assignment deletion confirmations
 */

import { Button } from '@/components/ui/button';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  type: 'submission' | 'assignment';
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
  itemName?: string;
  submissionCount?: number;
}

export default function DeleteConfirmModal({
  isOpen,
  type,
  onConfirm,
  onCancel,
  isDeleting,
  itemName,
  submissionCount = 0,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  const isAssignment = type === 'assignment';
  const title = isAssignment ? 'Delete Assignment?' : 'Delete Submission?';
  const confirmText = isAssignment ? 'Delete All' : 'Delete';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 border-2 border-red-200">
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-t-xl">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
        </div>
        <div className="p-6">
          {isAssignment && itemName ? (
            <>
              <p className="text-gray-700 mb-2 font-semibold">
                Assignment: <span className="text-red-600">{itemName}</span>
              </p>
              <p className="text-gray-700 mb-6">
                This will permanently delete this assignment and{' '}
                <strong>ALL {submissionCount} submission(s)</strong> associated with it. 
                This action cannot be undone.
              </p>
            </>
          ) : (
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this submission? This action cannot be undone.
            </p>
          )}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isDeleting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Deleting...' : confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
