// Import CSV Modal - Bulk import students from CSV file

import { useState } from 'react';
import { X, Upload, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { ImportResult } from '../../bridge/bridgeTypes';

interface ImportCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (csvText: string) => Promise<ImportResult>;
}

export default function ImportCsvModal({ isOpen, onClose, onImport }: ImportCsvModalProps) {
  const [csvText, setCsvText] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvText.trim()) {
      setError('Please select a CSV file or paste CSV data');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const importResult = await onImport(csvText);
      setResult(importResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCsvText('');
    setResult(null);
    setError('');
    onClose();
  };

  const handleReset = () => {
    setCsvText('');
    setResult(null);
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">Import Students from CSV</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {result ? (
            // Results view
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center gap-2 text-green-800 mb-1">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Added</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">{result.added}</p>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center gap-2 text-blue-800 mb-1">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Updated</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{result.updated}</p>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                  <div className="flex items-center gap-2 text-gray-800 mb-1">
                    <XCircle className="w-5 h-5" />
                    <span className="font-medium">Skipped</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{result.skipped}</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="font-medium text-red-800 mb-2">
                    {result.errors.length} Error{result.errors.length !== 1 ? 's' : ''}
                  </p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {result.errors.map((err, idx) => (
                      <p key={idx} className="text-sm text-red-700">
                        Row {err.row}: {err.error}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                >
                  Import Another
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
            // Import form
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload CSV File
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileSelect}
                    className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">OR</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste CSV Data
                </label>
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  rows={8}
                  placeholder="name,localId&#10;Sharon Lee,S123456&#10;John Smith,S123457&#10;..."
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800 font-medium mb-2">CSV Format:</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• First row can be headers (name,localId) or data</li>
                  <li>• Each row: student name, local student ID</li>
                  <li>• Duplicates (by local ID) will be updated or skipped</li>
                  <li>• Empty rows are ignored</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={loading || !csvText.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                >
                  {loading ? (
                    'Importing...'
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Import Students
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
