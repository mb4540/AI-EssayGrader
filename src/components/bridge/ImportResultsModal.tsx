import { CheckCircle, AlertCircle, XCircle, RefreshCw, Database, HardDrive } from 'lucide-react';
import { Button } from '../ui/button';

export interface ImportResults {
  added: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; error: string }>;
  savedToFile: boolean;
  saveError?: string;
  syncedToDatabase: boolean;
  syncResults?: { updated: number; inserted: number; failed: number };
}

interface ImportResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: ImportResults;
  onRetry?: () => Promise<void>;
  isRetrying?: boolean;
}

export default function ImportResultsModal({
  isOpen,
  onClose,
  results,
  onRetry,
  isRetrying = false,
}: ImportResultsModalProps) {
  if (!isOpen) return null;

  const totalProcessed = results.added + results.updated + results.skipped;
  const hasErrors = results.errors.length > 0;
  const hasSaveError = !results.savedToFile && results.saveError;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {hasSaveError ? (
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            ) : hasErrors ? (
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {hasSaveError ? 'Import Failed to Save' : 'Import Complete'}
              </h2>
              <p className="text-sm text-gray-600">
                {totalProcessed} student{totalProcessed !== 1 ? 's' : ''} processed
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[50vh]">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-700">{results.added}</p>
              <p className="text-xs text-green-600">Added</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-700">{results.updated}</p>
              <p className="text-xs text-blue-600">Updated</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-700">{results.skipped}</p>
              <p className="text-xs text-gray-600">Skipped</p>
            </div>
          </div>

          {/* Errors Section */}
          {hasErrors && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm font-medium text-red-800 mb-2">
                {results.errors.length} row{results.errors.length !== 1 ? 's' : ''} had errors:
              </p>
              <ul className="text-xs text-red-700 space-y-1 max-h-24 overflow-y-auto">
                {results.errors.slice(0, 5).map((err, i) => (
                  <li key={i}>Row {err.row}: {err.error}</li>
                ))}
                {results.errors.length > 5 && (
                  <li className="italic">...and {results.errors.length - 5} more</li>
                )}
              </ul>
            </div>
          )}

          {/* Save Status */}
          <div className="space-y-2">
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              results.savedToFile ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <HardDrive className={`w-4 h-4 ${results.savedToFile ? 'text-green-600' : 'text-red-600'}`} />
              <span className={`text-sm ${results.savedToFile ? 'text-green-800' : 'text-red-800'}`}>
                {results.savedToFile ? (
                  '✓ Saved to local encrypted file'
                ) : (
                  <>✗ Failed to save: {results.saveError || 'Unknown error'}</>
                )}
              </span>
            </div>

            {/* Database Sync Status */}
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              results.syncedToDatabase ? 'bg-green-50' : 'bg-yellow-50'
            }`}>
              <Database className={`w-4 h-4 ${results.syncedToDatabase ? 'text-green-600' : 'text-yellow-600'}`} />
              <span className={`text-sm ${results.syncedToDatabase ? 'text-green-800' : 'text-yellow-800'}`}>
                {results.syncedToDatabase ? (
                  <>
                    ✓ Synced to database
                    {results.syncResults && (
                      <span className="text-xs ml-1">
                        ({results.syncResults.inserted} new, {results.syncResults.updated} updated)
                      </span>
                    )}
                  </>
                ) : (
                  '⚠ Database sync pending (will sync on next grading)'
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
          {hasSaveError && onRetry && (
            <Button
              onClick={onRetry}
              disabled={isRetrying}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Retrying...' : 'Retry Save'}
            </Button>
          )}
          <Button
            onClick={onClose}
            disabled={Boolean(hasSaveError) && !results.savedToFile}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {hasSaveError ? 'Close (Data Not Saved!)' : 'Done'}
          </Button>
        </div>
      </div>
    </div>
  );
}
