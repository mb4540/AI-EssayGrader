import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { FileText, Image as ImageIcon, Upload, Loader2, Sparkles } from 'lucide-react';
import { extractTextFromImage, extractTextFromPDF } from '@/lib/ocr';
import { extractTextFromDocx } from '@/lib/docx';

interface VerbatimViewerProps {
  text: string;
  sourceType?: string;
  onTextExtracted?: (text: string, sourceType: 'text' | 'docx' | 'pdf' | 'doc' | 'image', imageDataUrl?: string) => void;
  onTextEnhanced?: (text: string) => void;
  imageUrl?: string;
  // Customization props for reuse in Draft Comparison
  title?: string;
  titleIcon?: string;
  borderColor?: string;
  headerGradient?: string;
  badgeColor?: string;
  badgeText?: string;
  placeholder?: string;
  textareaClassName?: string;
  wordCountColor?: string;
  showEnhanceButton?: boolean;
}

export default function VerbatimViewer({ 
  text, 
  sourceType, 
  onTextExtracted, 
  onTextEnhanced, 
  imageUrl,
  title = "Student Essay (Verbatim)",
  titleIcon = "📝",
  borderColor = "border-emerald-500",
  headerGradient = "from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950",
  badgeColor = "bg-emerald-500",
  badgeText,
  placeholder = "Paste student essay here...",
  textareaClassName = "border-2 focus:border-emerald-400",
  wordCountColor = "text-emerald-600 dark:text-emerald-400",
  showEnhanceButton = true,
}: VerbatimViewerProps) {
  const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const [activeTab, setActiveTab] = useState('text');
  const [tempText, setTempText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onTextExtracted) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      // Create object URL for image preview
      let imageDataUrl: string | undefined;
      if (file.type.startsWith('image/')) {
        const objectUrl = URL.createObjectURL(file);
        setUploadedImage(objectUrl);
        
        // Also convert to base64 for storage
        const reader = new FileReader();
        imageDataUrl = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      const extractedText = file.type === 'application/pdf' 
        ? await extractTextFromPDF(file, setProgress)
        : await extractTextFromImage(file, setProgress);
      
      onTextExtracted(extractedText, 'image', imageDataUrl);
    } catch (error) {
      console.error('OCR failed:', error);
      alert('Failed to extract text from image. Please try again.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleDocxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onTextExtracted) return;

    setIsProcessing(true);

    try {
      // Extract text from document
      const { text: extractedText, fileType } = await extractTextFromDocx(file);
      
      // Read file as base64 for storage (if ALLOW_BLOB_STORAGE is enabled)
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result as string;
        // Pass both extracted text and file data
        onTextExtracted(extractedText, fileType, base64Data);
      };
      reader.onerror = () => {
        // If file reading fails, still pass the extracted text
        onTextExtracted(extractedText, fileType);
      };
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error('Document extraction failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to extract text from document: ${errorMessage}\n\nPlease ensure the file is a valid DOCX, PDF, or DOC file.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextSubmit = () => {
    if (tempText.trim() && onTextExtracted) {
      onTextExtracted(tempText, 'text');
      setTempText('');
    }
  };

  const handleEnhanceText = async () => {
    if (!text || !onTextEnhanced) return;

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
      onTextEnhanced(data.enhanced_text);
    } catch (error) {
      console.error('Text enhancement failed:', error);
      alert('Failed to enhance text. Please try again.');
    } finally {
      setIsEnhancing(false);
    }
  };
  
  return (
    <Card className={`h-full shadow-lg border-l-4 ${borderColor} bg-white dark:bg-slate-800`}>
      <CardHeader className={`bg-gradient-to-r ${headerGradient}`}>
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
              <span className="text-emerald-600 dark:text-emerald-300 text-sm">{titleIcon}</span>
            </div>
            <span>{title}</span>
            {badgeText && (
              <span className={`${badgeColor} text-white px-2 py-1 rounded text-xs font-semibold ml-2`}>
                {badgeText}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {text && onTextEnhanced && sourceType === 'image' && showEnhanceButton && (
              <Button
                onClick={handleEnhanceText}
                disabled={isEnhancing}
                size="sm"
                className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
              >
                {isEnhancing ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Enhancing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 mr-1" />
                    Enhance Text
                  </>
                )}
              </Button>
            )}
            {sourceType && (
              <span className="text-xs font-normal px-2 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded uppercase">
                {sourceType}
              </span>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Upload Tabs */}
        {onTextExtracted && !text && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 bg-emerald-100 dark:bg-emerald-900">
              <TabsTrigger value="text" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                <FileText className="w-4 h-4 mr-2" />
                Text
              </TabsTrigger>
              <TabsTrigger value="image" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                <ImageIcon className="w-4 h-4 mr-2" />
                Image
              </TabsTrigger>
              <TabsTrigger value="docx" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                <Upload className="w-4 h-4 mr-2" />
                Documents
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="space-y-3">
              <Textarea
                placeholder={placeholder}
                value={tempText}
                onChange={(e) => setTempText(e.target.value)}
                className={`min-h-[200px] font-mono ${textareaClassName}`}
              />
              <Button 
                onClick={handleTextSubmit} 
                disabled={!tempText.trim()}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              >
                Use This Text
              </Button>
            </TabsContent>

            <TabsContent value="image" className="space-y-3">
              <div className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-lg p-8 text-center transition-colors bg-emerald-50/50 dark:bg-emerald-950/20">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={isProcessing}
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <ImageIcon className="w-12 h-12 mx-auto mb-4 text-emerald-500" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isProcessing 
                      ? `Processing... ${Math.round(progress * 100)}%`
                      : 'Click to upload image (.png, .jpg, .gif, .bmp, .tiff, .webp)'}
                  </p>
                </label>
              </div>
            </TabsContent>

            <TabsContent value="docx" className="space-y-3">
              <div className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-lg p-8 text-center transition-colors bg-emerald-50/50 dark:bg-emerald-950/20">
                <input
                  type="file"
                  accept=".docx,.pdf,.doc,application/vnd.google-apps.document"
                  onChange={handleDocxUpload}
                  className="hidden"
                  id="docx-upload"
                  disabled={isProcessing}
                />
                <label htmlFor="docx-upload" className="cursor-pointer">
                  {isProcessing ? (
                    <Loader2 className="w-12 h-12 mx-auto mb-4 text-emerald-500 animate-spin" />
                  ) : (
                    <Upload className="w-12 h-12 mx-auto mb-4 text-emerald-500" />
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isProcessing ? 'Processing...' : 'Click to upload document (DOCX, PDF, DOC)'}
                  </p>
                </label>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Essay Display */}
        {text && (
          <>
            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
              <span className="font-medium">📊 Word Count: <span className={`${wordCountColor} font-bold`}>{wordCount}</span></span>
              <span className="text-gray-400">Scroll to read full essay</span>
            </div>
            
            {/* Side-by-side view for image sources */}
            {sourceType === 'image' && (uploadedImage || imageUrl) ? (
              <div className="grid grid-cols-2 gap-4">
                {/* Image Preview */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 max-h-[600px] overflow-y-auto">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">📷 Original Image:</p>
                  <img 
                    src={uploadedImage || imageUrl} 
                    alt="Student's handwritten essay" 
                    className="w-full rounded border border-gray-300 dark:border-gray-600"
                  />
                </div>
                
                {/* Extracted Text */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 max-h-[600px] overflow-y-auto">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">📝 Extracted Text:</p>
                  <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-gray-800 dark:text-gray-200">
                    {text}
                  </pre>
                </div>
              </div>
            ) : (
              /* Regular text display for non-image sources */
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 p-6 rounded-lg max-h-[600px] overflow-y-auto border-2 border-gray-200 dark:border-gray-700">
                <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-gray-800 dark:text-gray-200">
                  {text}
                </pre>
              </div>
            )}
          </>
        )}

        {!text && !onTextExtracted && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-center text-gray-500">
            📄 No text loaded yet...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
