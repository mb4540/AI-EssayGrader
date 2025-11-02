// useTextEnhancement Hook
// Handles AI text enhancement/cleanup logic

import { useState } from 'react';

interface UseTextEnhancementReturn {
  isEnhancing: boolean;
  enhanceText: (text: string) => Promise<string>;
}

export function useTextEnhancement(): UseTextEnhancementReturn {
  const [isEnhancing, setIsEnhancing] = useState(false);

  const enhanceText = async (text: string): Promise<string> => {
    setIsEnhancing(true);
    try {
      const customOcrPrompt = localStorage.getItem('ai_ocr_prompt');
      const response = await fetch('/.netlify/functions/enhance-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text,
          ocr_prompt: customOcrPrompt || undefined
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to enhance text');
      }

      const data = await response.json();
      return data.enhanced_text;
    } catch (error) {
      console.error('Text enhancement failed:', error);
      throw new Error('Failed to enhance text. Please try again.');
    } finally {
      setIsEnhancing(false);
    }
  };

  return {
    isEnhancing,
    enhanceText,
  };
}
