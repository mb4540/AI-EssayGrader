/**
 * ContextHelp Component
 * 
 * Renders a blue circled "i" button that opens a help modal when clicked.
 * Uses the centralized help content registry for consistent help text.
 */

import { useState } from 'react';
import { Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { getHelpContent, type HelpId } from '@/lib/help/helpContent';

interface ContextHelpProps {
  helpId: HelpId;
  className?: string;
}

export default function ContextHelp({ helpId, className = '' }: ContextHelpProps) {
  const [isOpen, setIsOpen] = useState(false);
  const content = getHelpContent(helpId);

  if (!content) {
    console.warn(`ContextHelp: No content found for helpId "${helpId}"`);
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`
          w-6 h-6 rounded-full 
          bg-blue-50 border border-blue-300 
          text-blue-600 hover:bg-blue-100 hover:border-blue-400
          flex items-center justify-center
          transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
          ${className}
        `}
        aria-label={`Help: ${content.title}`}
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Info className="w-4 h-4 text-blue-600" />
              </div>
              {content.title}
            </DialogTitle>
            <DialogDescription className="text-base text-gray-700 pt-2">
              {content.summary}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {content.bullets && content.bullets.length > 0 && (
              <ul className="space-y-2">
                {content.bullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            )}

            {content.tips && content.tips.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-green-800 mb-1">💡 Tips</p>
                <ul className="space-y-1">
                  {content.tips.map((tip, i) => (
                    <li key={i} className="text-sm text-green-700">{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {content.warnings && content.warnings.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-amber-800 mb-1">⚠️ Important</p>
                <ul className="space-y-1">
                  {content.warnings.map((warning, i) => (
                    <li key={i} className="text-sm text-amber-700">{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
