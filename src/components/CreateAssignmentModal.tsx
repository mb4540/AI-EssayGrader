import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Plus, Loader2, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { createAssignment } from '@/lib/api';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

async function enhanceRubricWithAI(simpleRules: string): Promise<string> {
  const customRubricPrompt = localStorage.getItem('ai_rubric_prompt');
  const response = await fetch('/.netlify/functions/enhance-rubric', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      simple_rules: simpleRules,
      rubric_prompt: customRubricPrompt || undefined
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to enhance rubric');
  }

  const data = await response.json();
  return data.enhanced_rubric;
}

export default function CreateAssignmentModal({ isOpen, onClose }: CreateAssignmentModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [criteria, setCriteria] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      setTitle('');
      setDescription('');
      setCriteria('');
      onClose();
    },
  });

  const handleEnhance = async () => {
    if (!criteria.trim()) {
      alert('Please enter some basic grading rules first');
      return;
    }

    setIsEnhancing(true);
    try {
      const enhanced = await enhanceRubricWithAI(criteria);
      setCriteria(enhanced);
    } catch (error) {
      console.error('Enhancement failed:', error);
      alert('Failed to enhance rubric. Please try again.');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter an assignment title');
      return;
    }
    createMutation.mutate({ 
      title: title.trim(), 
      description: description.trim() || undefined,
      grading_criteria: criteria.trim() || undefined,
    });
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
              onClick={onClose}
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
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="assignment-criteria" className="text-gray-700 dark:text-gray-300 font-medium">
                Grading Criteria <span className="text-gray-400 text-xs">(optional)</span>
              </Label>
              <Button
                type="button"
                onClick={handleEnhance}
                disabled={isEnhancing || !criteria.trim() || createMutation.isPending}
                size="sm"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {isEnhancing ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Enhancing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 mr-1" />
                    Enhance With AI
                  </>
                )}
              </Button>
            </div>
            <Textarea
              id="assignment-criteria"
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
              placeholder="Enter grading rubric or simple rules (e.g., 'Check grammar, organization, evidence. 100 points total.')"
              className="mt-1 border-2 focus:border-amber-400 min-h-[120px] font-mono text-sm"
              disabled={createMutation.isPending}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 bg-gradient-to-r from-amber-50 to-purple-50 dark:from-amber-950/30 dark:to-purple-950/30 p-2 rounded border border-amber-200 dark:border-amber-800">
              <span className="font-semibold">✨ Tip:</span> Add criteria here to auto-populate for all submissions of this assignment!
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
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
