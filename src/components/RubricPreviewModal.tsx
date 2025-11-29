import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { AlertTriangle } from 'lucide-react';

interface RubricPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (rubricText: string) => void;
  extractedRubric: {
    rubricText: string;
    totalPoints: number;
    warning?: string;
  } | null;
}

export default function RubricPreviewModal({ 
  isOpen, 
  onClose, 
  onAccept,
  extractedRubric 
}: RubricPreviewModalProps) {
  const [editedText, setEditedText] = useState('');

  useEffect(() => {
    if (extractedRubric) {
      setEditedText(extractedRubric.rubricText);
    }
  }, [extractedRubric]);

  if (!extractedRubric) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review Extracted Rubric</DialogTitle>
        </DialogHeader>

        {/* Warning Message */}
        {extractedRubric.warning && (
          <div className="flex items-center gap-3 p-4 rounded-lg border border-yellow-500 bg-yellow-50 text-yellow-900">
            <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
            <div className="text-sm font-medium">{extractedRubric.warning}</div>
          </div>
        )}

        {/* Total Points Display */}
        <div className="bg-muted p-3 rounded-md flex justify-between items-center">
          <span className="font-semibold">Total Points Detected: </span>
          <span className="text-lg font-bold bg-background px-3 py-1 rounded border">
            {extractedRubric.totalPoints}
          </span>
        </div>

        {/* Editable Rubric Text */}
        <div className="space-y-2">
          <Label>Grading Criteria (Paragraph Format)</Label>
          <Textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            rows={12}
            className="font-mono text-sm leading-relaxed"
          />
          <p className="text-sm text-muted-foreground">
            Review and edit the extracted criteria before accepting.
            This text will be used to generate the final grading rubric.
          </p>
        </div>

        {/* Actions */}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onAccept(editedText)}>
            Accept & Use This Rubric
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
