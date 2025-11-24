/**
 * Source Text Selector Component
 * 
 * Allows teachers to select an existing source text or upload a new one
 * for book reports and source-based writing assignments.
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Upload, FileText, Loader2, X, BookOpen } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { listSourceTexts, uploadSourceText, fileToBase64, getFileType } from '@/lib/api/sourceTexts';
import { useAuth } from '@/contexts/AuthContext';

interface SourceTextSelectorProps {
  value: string | null; // source_text_id
  onChange: (sourceTextId: string | null) => void;
  disabled?: boolean;
}

export default function SourceTextSelector({ value, onChange, disabled }: SourceTextSelectorProps) {
  const { token } = useAuth();
  const [mode, setMode] = useState<'select' | 'upload'>('select');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadPrompt, setUploadPrompt] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Fetch existing source texts
  const { data: sourceTexts = [], isLoading } = useQuery({
    queryKey: ['sourceTexts'],
    queryFn: () => listSourceTexts(token!),
    enabled: !!token,
  });

  // Reset upload form when switching modes
  useEffect(() => {
    if (mode === 'select') {
      setUploadFile(null);
      setUploadTitle('');
      setUploadPrompt('');
      setUploadError(null);
    }
  }, [mode]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = getFileType(file);
    if (!fileType) {
      setUploadError('Invalid file type. Please upload a PDF, DOCX, or TXT file.');
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setUploadError('File too large. Maximum size is 10MB.');
      return;
    }

    setUploadFile(file);
    setUploadError(null);
    
    // Auto-populate title from filename
    if (!uploadTitle) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setUploadTitle(nameWithoutExt);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle || !token) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const fileType = getFileType(uploadFile);
      if (!fileType) throw new Error('Invalid file type');

      const base64Data = await fileToBase64(uploadFile);

      const response = await uploadSourceText(
        {
          title: uploadTitle,
          writing_prompt: uploadPrompt || undefined,
          file_data: base64Data,
          file_name: uploadFile.name,
          file_type: fileType,
        },
        token
      );

      // Switch to select mode and select the newly uploaded source text
      onChange(response.source_text_id);
      setMode('select');
      
      // Reset form
      setUploadFile(null);
      setUploadTitle('');
      setUploadPrompt('');
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload source text');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearSelection = () => {
    onChange(null);
  };

  const selectedSourceText = sourceTexts.find((st) => st.source_text_id === value);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-gray-700 dark:text-gray-300 font-medium">
          Source Text <span className="text-gray-400 text-xs">(optional)</span>
        </Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === 'select' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('select')}
            disabled={disabled}
          >
            <BookOpen className="w-4 h-4 mr-1" />
            Select
          </Button>
          <Button
            type="button"
            variant={mode === 'upload' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('upload')}
            disabled={disabled}
          >
            <Upload className="w-4 h-4 mr-1" />
            Upload New
          </Button>
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        For book reports or source-based writing. AI will use this for context-aware grading.
      </p>

      {mode === 'select' && (
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : sourceTexts.length === 0 ? (
            <div className="text-center py-4 text-sm text-gray-500">
              No source texts yet. Upload one to get started.
            </div>
          ) : (
            <>
              <Select value={value || 'none'} onValueChange={(val) => onChange(val === 'none' ? null : val)} disabled={disabled}>
                <SelectTrigger className="border-2">
                  <SelectValue placeholder="Select a source text..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-gray-500">No source text</span>
                  </SelectItem>
                  {sourceTexts.map((st) => (
                    <SelectItem key={st.source_text_id} value={st.source_text_id}>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span>{st.title}</span>
                        <span className="text-xs text-gray-400">({st.file_type.toUpperCase()})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedSourceText && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="font-medium text-sm text-blue-900 dark:text-blue-100">
                          {selectedSourceText.title}
                        </span>
                      </div>
                      {selectedSourceText.writing_prompt && (
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                          {selectedSourceText.writing_prompt}
                        </p>
                      )}
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        {selectedSourceText.file_type.toUpperCase()} • {(selectedSourceText.file_size_bytes / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearSelection}
                      disabled={disabled}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {mode === 'upload' && (
        <div className="space-y-3 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <div>
            <Label htmlFor="source-file" className="text-sm font-medium">
              File (PDF, DOCX, or TXT)
            </Label>
            <Input
              id="source-file"
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleFileChange}
              disabled={disabled || isUploading}
              className="mt-1"
            />
            {uploadFile && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                ✓ {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="source-title" className="text-sm font-medium">
              Title
            </Label>
            <Input
              id="source-title"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder="e.g., To Kill a Mockingbird"
              disabled={disabled || isUploading}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="source-prompt" className="text-sm font-medium">
              Writing Prompt <span className="text-gray-400 text-xs">(optional)</span>
            </Label>
            <Textarea
              id="source-prompt"
              value={uploadPrompt}
              onChange={(e) => setUploadPrompt(e.target.value)}
              placeholder="e.g., Analyze the theme of justice in the novel..."
              disabled={disabled || isUploading}
              className="mt-1 min-h-[60px]"
            />
          </div>

          {uploadError && (
            <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
              {uploadError}
            </div>
          )}

          <Button
            type="button"
            onClick={handleUpload}
            disabled={!uploadFile || !uploadTitle || disabled || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Source Text
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
