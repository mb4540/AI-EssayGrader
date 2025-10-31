import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Plus, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { createAssignment } from '@/lib/api';
import CriteriaInput from './CriteriaInput';
import { ELA_DOCUMENT_TYPES } from '@/lib/documentTypes';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateAssignmentModal({ isOpen, onClose }: CreateAssignmentModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [criteria, setCriteria] = useState('');
  const [totalPoints, setTotalPoints] = useState(100);
  const [documentType, setDocumentType] = useState('personal_narrative');
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createAssignment,
    onSuccess: () => {
      console.log('✅ Assignment created successfully');
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      setTitle('');
      setDescription('');
      setCriteria('');
      setTotalPoints(100); // Reset total points
      onClose();
    },
    onError: (error) => {
      console.error('❌ Error creating assignment:', error);
      alert(`Failed to create assignment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter an assignment title');
      return;
    }
    console.log('📝 Creating assignment:', { title: title.trim(), document_type: documentType, has_criteria: !!criteria.trim() });
    createMutation.mutate({ 
      title: title.trim(), 
      description: description.trim() || undefined,
      grading_criteria: criteria.trim() || undefined,
      document_type: documentType,
    });
  };

  const handleClose = () => {
    if (createMutation.isPending) {
      return; // Don't close while creating
    }
    setTitle('');
    setDescription('');
    setCriteria('');
    setTotalPoints(100);
    setDocumentType('personal_narrative');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4 border-2 border-blue-200 dark:border-blue-800 my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">New Assignment</h2>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
              disabled={createMutation.isPending}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label htmlFor="assignment-title" className="text-gray-700 dark:text-gray-300 font-medium">
              Assignment Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="assignment-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Persuasive Essay #1"
              className="mt-1 border-2 focus:border-blue-500"
              disabled={createMutation.isPending}
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="document-type" className="text-gray-700 dark:text-gray-300 font-medium">
              Document Type
            </Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger id="document-type" className="mt-1 border-2 focus:border-blue-500">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {ELA_DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Helps AI provide more relevant feedback
            </p>
          </div>

          <div>
            <Label htmlFor="assignment-description" className="text-gray-700 dark:text-gray-300 font-medium">
              Description <span className="text-gray-400 text-xs">(optional)</span>
            </Label>
            <Textarea
              id="assignment-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details about this assignment..."
              className="mt-1 border-2 focus:border-blue-500 min-h-[80px]"
              disabled={createMutation.isPending}
            />
          </div>

          <div>
            <CriteriaInput
              value={criteria}
              onChange={setCriteria}
              totalPoints={totalPoints}
              onTotalPointsChange={setTotalPoints}
              showCard={false}
              title="Grading Criteria"
              required={false}
              disabled={createMutation.isPending}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createMutation.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || !title.trim()}
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Assignment
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
