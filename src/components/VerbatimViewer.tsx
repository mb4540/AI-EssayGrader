import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { FileText, Image as ImageIcon, Upload, Loader2, Sparkles, MessageSquare } from 'lucide-react';
import AnnotatedTextViewer from './AnnotatedTextViewer';
import { getInlineAnnotations, updateInlineAnnotation } from '@/lib/api';
import type { Annotation } from '@/lib/annotations/types';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useTextEnhancement } from '@/hooks/useTextEnhancement';

interface VerbatimViewerProps {
  text: string;
  sourceType?: string;
  onTextExtracted?: (text: string, sourceType: 'text' | 'docx' | 'pdf' | 'doc' | 'image', imageDataUrl?: string) => void;
  onTextEnhanced?: (text: string) => void;
  imageUrl?: string;
  // Annotation props
  submissionId?: string;
  showAnnotations?: boolean;
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
  submissionId,
  showAnnotations = false,
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
  
  // Use custom hooks for file upload and text enhancement
  const { isProcessing, progress, uploadedImage, handleImageUpload, handleDocxUpload, setUploadedImage } = useFileUpload();
  const { isEnhancing, enhanceText } = useTextEnhancement();
  
  // Annotation state
  const [viewTab, setViewTab] = useState<'original' | 'annotations'>('original');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [annotationsLoading, setAnnotationsLoading] = useState(false);

  // Fetch annotations when submission ID is available
  useEffect(() => {
    if (submissionId && showAnnotations) {
      setAnnotationsLoading(true);
      getInlineAnnotations(submissionId)
        .then(data => {
          setAnnotations(data.annotations);
        })
        .catch(error => {
          console.error('Failed to load annotations:', error);
        })
        .finally(() => {
          setAnnotationsLoading(false);
        });
    }
  }, [submissionId, showAnnotations]);

  const handleAnnotationUpdate = async (annotationId: string, updates: Partial<Annotation>) => {
    try {
      await updateInlineAnnotation(annotationId, updates);
      // Refresh annotations
      if (submissionId) {
        const data = await getInlineAnnotations(submissionId);
        setAnnotations(data.annotations);
      }
    } catch (error) {
      console.error('Failed to update annotation:', error);
      alert('Failed to update annotation. Please try again.');
    }
  };

  const handleAnnotationAdd = async (_annotation: Omit<Annotation, 'annotation_id'>) => {
    // TODO: Implement add annotation
    console.log('Add annotation not yet implemented');
  };

  const handleImageUploadWrapper = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onTextExtracted) return;

    try {
      await handleImageUpload(file, onTextExtracted);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to extract text from image');
    }
  };

  const handleDocxUploadWrapper = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onTextExtracted) return;

    try {
      await handleDocxUpload(file, onTextExtracted);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to extract text from document');
    }
  };

  const handleTextSubmit = () => {
    if (tempText.trim() && onTextExtracted) {
      onTextExtracted(tempText, 'text');
      setTempText('');
    }
  };

  const handleEnhanceTextWrapper = async () => {
    if (!text || !onTextEnhanced) return;

    try {
      const enhancedText = await enhanceText(text);
      onTextEnhanced(enhancedText);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to enhance text');
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
                onClick={handleEnhanceTextWrapper}
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
                  onChange={handleImageUploadWrapper}
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
                  onChange={handleDocxUploadWrapper}
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
            
            {/* Show annotations tab if available */}
            {showAnnotations && submissionId ? (
              <Tabs value={viewTab} onValueChange={(v) => setViewTab(v as 'original' | 'annotations')}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="original" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Original
                  </TabsTrigger>
                  <TabsTrigger value="annotations" className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Annotations {annotations.length > 0 && `(${annotations.length})`}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="original">
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
                </TabsContent>

                <TabsContent value="annotations">
                  {annotationsLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                      <span className="ml-2 text-gray-600">Loading annotations...</span>
                    </div>
                  ) : (
                    <AnnotatedTextViewer
                      text={text}
                      submissionId={submissionId}
                      annotations={annotations}
                      onAnnotationUpdate={handleAnnotationUpdate}
                      onAnnotationAdd={handleAnnotationAdd}
                    />
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              /* No annotations - show original view only */
              <>
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
