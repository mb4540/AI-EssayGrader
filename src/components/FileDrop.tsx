import { useState } from 'react';
import { Upload, FileText, Image as ImageIcon, Sparkles, Loader2, Brain } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent } from './ui/card';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { extractTextFromImage, extractTextFromPDF } from '@/lib/ocr';
import { extractTextFromDocx } from '@/lib/docx';
import { useTextEnhancement } from '@/hooks/useTextEnhancement';
import { transcribeImage } from '@/lib/api';

interface FileDropProps {
  onTextExtracted: (text: string, sourceType: 'text' | 'docx' | 'pdf' | 'doc' | 'image') => void;
}

export default function FileDrop({ onTextExtracted }: FileDropProps) {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('text');
  const [useAiVision, setUseAiVision] = useState(true);
  
  // Use the enhancement hook for the "Clean Text" feature
  const { isEnhancing, enhanceText } = useTextEnhancement();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      let extractedText = '';

      if (file.type === 'application/pdf') {
        // PDF path - currently uses Tesseract
        extractedText = await extractTextFromPDF(file, setProgress);
      } else if (useAiVision) {
        // AI Vision Path (Gemini/OpenAI)
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const base64Image = await base64Promise;
        
        // Get provider settings
        const globalProvider = localStorage.getItem('ai_provider');
        const handwritingProvider = localStorage.getItem('ai_handwriting_provider');
        
        // Determine actual provider
        // Default to global provider if set, otherwise gemini (primary recommendation)
        // If specific handwriting provider is set (and not 'default'), use that instead
        let provider: 'gemini' | 'openai' = (globalProvider === 'openai' || globalProvider === 'gemini') ? globalProvider : 'gemini';
        
        if (handwritingProvider && handwritingProvider !== 'default') {
           provider = handwritingProvider as 'gemini' | 'openai';
        }
        
        const result = await transcribeImage({ image: base64Image, provider });
        extractedText = result.text;
      } else {
        // Legacy Tesseract Path
        extractedText = await extractTextFromImage(file, setProgress);
      }
      
      onTextExtracted(extractedText, 'image');
      setText(extractedText);
    } catch (error) {
      console.error('OCR failed:', error);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to extract text: ${msg}. \n\nTry disabling "AI Vision" to use local OCR if the issue persists.`);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleDocxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      const { text: extractedText, fileType } = await extractTextFromDocx(file);
      onTextExtracted(extractedText, fileType);
      setText(extractedText);
    } catch (error) {
      console.error('Document extraction failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to extract text from document: ${errorMessage}\n\nPlease ensure the file is a valid DOCX, PDF, or DOC file.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCleanText = async () => {
    if (!text.trim()) return;
    
    try {
      const cleanedText = await enhanceText(text);
      setText(cleanedText);
    } catch (error) {
      // Note: User reported "Failed to enhance text" error here. 
      // This is often due to backend configuration or timeout.
      alert('Failed to clean text. Please check your connection and try again.');
    }
  };

  const handleTextSubmit = () => {
    if (text.trim()) {
      onTextExtracted(text, 'text');
    }
  };

  return (
    <Card className="shadow-lg border-l-4 border-blue-500 bg-white dark:bg-slate-800">
      <CardContent className="pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text">
              <FileText className="w-4 h-4 mr-2" />
              Text
            </TabsTrigger>
            <TabsTrigger value="image">
              <ImageIcon className="w-4 h-4 mr-2" />
              Image
            </TabsTrigger>
            <TabsTrigger value="docx">
              <Upload className="w-4 h-4 mr-2" />
              Documents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4">
            <div className="relative">
              <Textarea
                placeholder="Paste student essay here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[200px] font-mono border-2 focus:border-blue-400 pr-4 pt-12" // Added padding for button
              />
              {/* Clean Text Button Toolbar */}
              <div className="absolute top-2 right-2 flex gap-2">
                 <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCleanText}
                  disabled={!text.trim() || isEnhancing}
                  title="Remove PDF artifacts and formatting issues"
                  className="bg-white/80 backdrop-blur-sm hover:bg-blue-50 text-blue-600 border-blue-200"
                >
                  {isEnhancing ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Cleaning...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 mr-1" />
                      Clean Text
                    </>
                  )}
                </Button>
              </div>
            </div>
            <Button 
              onClick={handleTextSubmit} 
              disabled={!text.trim()}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
            >
              Use This Text
            </Button>
          </TabsContent>

          <TabsContent value="image" className="space-y-4">
            <div className="flex items-center justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUseAiVision(!useAiVision)}
                className={`text-xs flex items-center gap-2 ${useAiVision ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500'}`}
                title={useAiVision ? "Using advanced AI to read handwriting (Recommended)" : "Using local browser OCR (Faster but less accurate)"}
              >
                <Brain className={`w-4 h-4 ${useAiVision ? 'fill-indigo-200' : ''}`} />
                {useAiVision ? 'AI Vision Enabled' : 'Enable AI Vision'}
              </Button>
            </div>

            <div className="border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-lg p-8 text-center transition-colors bg-blue-50/50 dark:bg-blue-950/20">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={isProcessing}
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {isProcessing 
                    ? `Processing... ${Math.round(progress * 100)}%`
                    : 'Click to upload image (.png, .jpg, .gif, .bmp, .tiff, .webp)'}
                </p>
              </label>
            </div>
            {text && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Extracted Text:</p>
                <p className="text-sm font-mono whitespace-pre-wrap">{text.substring(0, 200)}...</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="docx" className="space-y-4">
            <div className="border-2 border-dashed border-green-300 hover:border-green-500 rounded-lg p-8 text-center transition-colors bg-green-50/50 dark:bg-green-950/20">
              <input
                type="file"
                accept=".docx,.pdf,.doc,application/vnd.google-apps.document"
                onChange={handleDocxUpload}
                className="hidden"
                id="docx-upload"
                disabled={isProcessing}
              />
              <label htmlFor="docx-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {isProcessing ? 'Processing...' : 'Click to upload document (DOCX, PDF, DOC)'}
                </p>
              </label>
            </div>
            {text && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Extracted Text:</p>
                <p className="text-sm font-mono whitespace-pre-wrap">{text.substring(0, 200)}...</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
