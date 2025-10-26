import { useState } from 'react';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Sparkles, Loader2 } from 'lucide-react';

interface CriteriaInputProps {
  value: string;
  onChange: (value: string) => void;
}

const EXAMPLE_CRITERIA = `Scoring (100 pts total):
- Organization (20): clear intro, body, conclusion
- Evidence/Examples (20): supports main idea
- Grammar & Mechanics (25): capitalization, punctuation, subject-verb, sentence boundaries
- Spelling (15)
- Clarity & Style (20): precise words, transitions

Penalties:
- Off-topic: -10
- Too short (< 200 words): -10`;

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

export default function CriteriaInput({ value, onChange }: CriteriaInputProps) {
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleEnhance = async () => {
    if (!value.trim()) {
      alert('Please enter some basic grading rules first');
      return;
    }

    setIsEnhancing(true);
    try {
      const enhanced = await enhanceRubricWithAI(value);
      onChange(enhanced);
    } catch (error) {
      console.error('Enhancement failed:', error);
      alert('Failed to enhance rubric. Please try again.');
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <Card className="shadow-lg border-l-4 border-amber-500 bg-white dark:bg-slate-800">
      <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
              <span className="text-amber-600 dark:text-amber-300 text-sm">📋</span>
            </div>
            Grading Criteria
          </div>
          <Button
            onClick={handleEnhance}
            disabled={isEnhancing || !value.trim()}
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
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-4">
        <Label htmlFor="criteria" className="text-gray-700 dark:text-gray-300 font-medium">
          Teacher Rubric <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="criteria"
          placeholder={EXAMPLE_CRITERIA}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[200px] font-mono text-sm border-2 focus:border-amber-400"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 bg-gradient-to-r from-amber-50 to-purple-50 dark:from-amber-950/30 dark:to-purple-950/30 p-3 rounded border border-amber-200 dark:border-amber-800">
          <span className="font-semibold">✨ Tip:</span> Put in simple rules for grading, then let AI create a detailed rubric for you!
          <br />
          <span className="text-xs italic mt-1 block">Example: "Check grammar, organization, and evidence. Total 100 points."</span>
        </p>
      </CardContent>
    </Card>
  );
}
