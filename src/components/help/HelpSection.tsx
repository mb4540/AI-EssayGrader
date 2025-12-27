/**
 * HelpSection Component
 * 
 * Renders a help block from the registry in a styled card format.
 * Used on the Help page to display content from the centralized registry.
 */

import { getHelpContent, type HelpId } from '@/lib/help/helpContent';

interface HelpSectionProps {
  helpId: HelpId;
  icon?: React.ReactNode;
  className?: string;
}

export default function HelpSection({ helpId, icon, className = '' }: HelpSectionProps) {
  const content = getHelpContent(helpId);

  if (!content) {
    console.warn(`HelpSection: No content found for helpId "${helpId}"`);
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <h4 className="font-bold text-lg text-gray-800 dark:text-gray-200 flex items-center gap-2">
        {icon}
        {content.title}
      </h4>
      
      <p className="text-gray-700 dark:text-gray-300">
        {content.summary}
      </p>

      {content.bullets && content.bullets.length > 0 && (
        <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4">
          {content.bullets.map((bullet, i) => (
            <li key={i}>{bullet}</li>
          ))}
        </ul>
      )}

      {content.tips && content.tips.length > 0 && (
        <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm font-semibold text-green-800 dark:text-green-100 mb-1">💡 Tips</p>
          <ul className="space-y-1">
            {content.tips.map((tip, i) => (
              <li key={i} className="text-sm text-green-700 dark:text-green-200">{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {content.warnings && content.warnings.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-100 mb-1">⚠️ Important</p>
          <ul className="space-y-1">
            {content.warnings.map((warning, i) => (
              <li key={i} className="text-sm text-amber-700 dark:text-amber-200">{warning}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
