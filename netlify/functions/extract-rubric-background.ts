/**
 * Extract Rubric Background Function
 * 
 * Performs the actual rubric extraction in the background.
 * This is a copy of extract-rubric-from-document.ts logic but updates job status.
 */

import { Handler, HandlerEvent } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';
import mammoth from 'mammoth';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { updateJob, getJob } from './lib/rubric-job-storage';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface RubricLevel {
  levelName: string;
  scoreValue: string;
  description: string;
}

interface RubricCategory {
  categoryName: string;
  levels: RubricLevel[];
}

interface RubricResponse {
  rubricTitle?: string;
  totalPossiblePoints: number;
  categories: RubricCategory[];
  warning?: string;
}

// Import the default prompt from the original function
const DEFAULT_EXTRACTION_PROMPT = `You are an expert educator and rubric analyst. Your task is to extract all grading criteria, including descriptions and associated achievement levels/points, from a document and reformat it into a structured JSON object.

INPUT: A document that contains a grading rubric.

CRITICAL: You MUST extract EACH achievement level separately. Do NOT combine or concatenate descriptions from multiple levels.

OUTPUT: A structured JSON object with the following format:
{
  "rubricTitle": "<Title of the rubric/assignment, if available>",
  "totalPossiblePoints": <number>,
  "categories": [
    {
      "categoryName": "<The name of the grading criterion, e.g., 'Organization', 'Development of Thesis'>",
      "levels": [
        {
          "levelName": "<The name of the achievement level, e.g., 'Excellent (4)', 'Proficient', '5 Mastery'>",
          "scoreValue": "<The numerical or point value associated with this level, e.g., 4, 5, or 20>",
          "description": "<VERBATIM description for this specific level>"
        }
      ]
    }
  ],
  "warning": "<optional warning message if extraction was difficult or total points are unclear>"
}

EXTRACTION RULES:
1. Identify Rubric Title: Extract the main title of the rubric or assignment.
2. Identify All Categories: Identify all grading criteria (e.g., "Organization", "Details", "Research").
3. Identify All Achievement Levels: For each category, identify all performance levels.
4. Extract Descriptions VERBATIM: Copy the description for EACH category at EACH performance level VERBATIM from the document.
5. Keep Levels Separate: Each level object should contain ONLY the description for that specific level.
6. Extract Score/Point Values: Determine the numerical score or point value for each achievement level.
7. Calculate Total Points: Estimate the totalPossiblePoints.
8. Preserve Wording: Preserve the teacher's EXACT wording.

CRITICAL REQUIREMENTS:
- The structure MUST be an array of categories, and each category MUST contain an array of levels.
- Each level MUST be a separate object with its own description field.
- The description field for every level MUST be copied VERBATIM from the source document.
- Do NOT combine, merge, or concatenate descriptions from multiple levels.`;

function formatRubricToText(rubric: RubricResponse): string {
  let text = '';
  
  if (rubric.rubricTitle) {
    text += `${rubric.rubricTitle}\n`;
  }
  
  text += `Scoring (${rubric.totalPossiblePoints} pts total):\n`;
  
  for (const category of rubric.categories) {
    text += `- ${category.categoryName}:\n`;
    
    for (const level of category.levels) {
      text += `  • ${level.levelName}: ${level.description}\n`;
    }
  }
  
  return text.trim();
}

function createDefaultRubric(): RubricResponse {
  return {
    rubricTitle: 'Default Rubric',
    totalPossiblePoints: 100,
    categories: [
      {
        categoryName: 'Content',
        levels: [
          { levelName: 'Excellent', scoreValue: '100', description: 'Exceptional work' },
          { levelName: 'Good', scoreValue: '80', description: 'Good work' },
          { levelName: 'Fair', scoreValue: '60', description: 'Fair work' },
          { levelName: 'Poor', scoreValue: '0', description: 'Needs improvement' },
        ],
      },
    ],
    warning: 'Failed to extract rubric from document. Using default rubric.',
  };
}

const handler: Handler = async (event: HandlerEvent) => {
  const startTime = Date.now();
  console.log('[extract-rubric-background] ========== FUNCTION STARTED ==========');
  console.log('[extract-rubric-background] Timestamp:', new Date().toISOString());
  
  try {
    console.log('[extract-rubric-background] Parsing request body...');
    const { jobId, file, fileName, fileType, totalPoints, geminiModel, extractionPrompt } =
      JSON.parse(event.body || '{}');

    console.log('[extract-rubric-background] Request params:', {
      jobId,
      fileName,
      fileType,
      totalPoints,
      geminiModel,
      fileSize: file ? `${Math.round(file.length / 1024)}KB` : 'missing',
      hasPrompt: !!extractionPrompt,
    });

    if (!jobId) {
      console.error('[extract-rubric-background] ERROR: Missing jobId');
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing jobId' }) };
    }

    // Update job status to processing
    console.log(`[extract-rubric-background] Updating job ${jobId} to 'processing'...`);
    await updateJob(jobId, { status: 'processing' });
    console.log(`[extract-rubric-background] Job ${jobId} status updated to 'processing'`);

    console.log(`[extract-rubric-background] Starting extraction for file: ${fileName}`);

    // Performance logging - start
    const startTime = Date.now();
    const modelName = geminiModel || 'gemini-2.0-flash-exp';

    // Decode base64
    const fileBuffer = Buffer.from(file, 'base64');
    const fileSizeKB = Math.round(fileBuffer.length / 1024);

    // Get Gemini model
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    // Use custom prompt or fallback to default
    const systemPrompt = extractionPrompt || DEFAULT_EXTRACTION_PROMPT;

    let promptParts: any[] = [systemPrompt];

    if (totalPoints) {
      promptParts.push(`Expected total points: ${totalPoints}`);
    }

    // Process based on file type
    let pdfBase64: string;

    if (fileType.includes('pdf') || fileName.endsWith('.pdf')) {
      // PDF: Use directly
      pdfBase64 = file;
    } else if (
      fileType.includes('wordprocessingml') ||
      fileName.endsWith('.docx') ||
      fileName.endsWith('.doc')
    ) {
      // Word documents: Convert to PDF first
      try {
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        const extractedText = result.value;

        if (!extractedText || extractedText.trim().length === 0) {
          throw new Error('No text could be extracted from the document');
        }

        // Create a PDF from the extracted text
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontSize = 11;
        const margin = 50;
        const lineHeight = fontSize * 1.2;

        let page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        let yPosition = height - margin;

        // Split text into lines that fit the page width
        const maxWidth = width - 2 * margin;
        const words = extractedText.split(/\s+/);
        let currentLine = '';

        for (const word of words) {
          const testLine = currentLine + (currentLine ? ' ' : '') + word;
          const textWidth = font.widthOfTextAtSize(testLine, fontSize);

          if (textWidth > maxWidth && currentLine) {
            // Draw current line
            page.drawText(currentLine, {
              x: margin,
              y: yPosition,
              size: fontSize,
              font: font,
              color: rgb(0, 0, 0),
            });
            yPosition -= lineHeight;
            currentLine = word;

            // Add new page if needed
            if (yPosition < margin) {
              page = pdfDoc.addPage();
              yPosition = height - margin;
            }
          } else {
            currentLine = testLine;
          }
        }

        // Draw last line
        if (currentLine) {
          page.drawText(currentLine, {
            x: margin,
            y: yPosition,
            size: fontSize,
            font: font,
            color: rgb(0, 0, 0),
          });
        }

        // Save PDF and convert to base64
        const pdfBytes = await pdfDoc.save();
        pdfBase64 = Buffer.from(pdfBytes).toString('base64');
      } catch (conversionError: any) {
        console.error('[extract-rubric-background] Word to PDF conversion error:', conversionError);
        
        await updateJob(jobId, {
          status: 'failed',
          error: `Failed to convert Word document to PDF: ${conversionError.message}`,
        });
        
        return { statusCode: 200, body: JSON.stringify({ success: true }) };
      }
    } else {
      await updateJob(jobId, {
        status: 'failed',
        error: 'Unsupported file type. Please upload PDF or DOCX.',
      });
      
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    // Send PDF to Gemini
    console.log(`[extract-rubric-background] Preparing Gemini request...`);
    console.log(`[extract-rubric-background] Model: ${modelName}`);
    console.log(`[extract-rubric-background] PDF size: ${Math.round(pdfBase64.length / 1024)}KB`);
    
    promptParts.push('Analyze the PDF document below and extract the rubric.');
    promptParts.push({
      inlineData: {
        data: pdfBase64,
        mimeType: 'application/pdf',
      },
    });

    // Call Gemini
    console.log(`[extract-rubric-background] Calling Gemini API...`);
    const geminiStartTime = Date.now();
    const result = await model.generateContent(promptParts);
    const geminiDuration = Date.now() - geminiStartTime;
    console.log(`[extract-rubric-background] Gemini API responded in ${geminiDuration}ms`);
    
    const responseText = result.response.text();
    console.log(`[extract-rubric-background] Response length: ${responseText.length} chars`);
    const rubricData: RubricResponse = JSON.parse(responseText);

    // Performance logging - end
    const duration = Date.now() - startTime;
    const tokenUsage = result.response.usageMetadata;
    const promptTokens = tokenUsage?.promptTokenCount || 0;
    const completionTokens = tokenUsage?.candidatesTokenCount || 0;
    const totalTokens = promptTokens + completionTokens;

    console.log(`[extract-rubric-background] ✅ Job ${jobId} completed in ${duration}ms`);
    console.log(`[extract-rubric-background] Extracted ${rubricData.categories.length} categories`);
    console.log(`[extract-rubric-background] Total points: ${rubricData.totalPossiblePoints}`);

    // Convert to paragraph format
    console.log(`[extract-rubric-background] Formatting rubric to text...`);
    const formattedText = formatRubricToText(rubricData);
    console.log(`[extract-rubric-background] Formatted text length: ${formattedText.length} chars`);

    // Update job with result
    console.log(`[extract-rubric-background] Updating job ${jobId} to 'completed'...`);
    await updateJob(jobId, {
      status: 'completed',
      result: {
        success: true,
        rubricText: formattedText,
        totalPoints: rubricData.totalPossiblePoints,
        warning: rubricData.warning,
        raw: rubricData,
      },
      performance: {
        duration_ms: duration,
        provider: 'gemini',
        model: modelName,
        file_size_kb: fileSizeKB,
        file_type: fileType,
        categories_extracted: rubricData.categories.length,
        tokens_used: totalTokens,
      },
    });
    console.log(`[extract-rubric-background] Job ${jobId} marked as completed`);
    console.log('[extract-rubric-background] ========== FUNCTION COMPLETED ==========');

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (error: any) {
    console.error('[extract-rubric-background] ========== ERROR OCCURRED ==========');
    console.error('[extract-rubric-background] Error type:', error.constructor.name);
    console.error('[extract-rubric-background] Error message:', error.message);
    console.error('[extract-rubric-background] Error stack:', error.stack);

    const { jobId } = JSON.parse(event.body || '{}');
    
    if (jobId) {
      // Return default rubric with warning
      const defaultRubric = createDefaultRubric();
      const formattedText = formatRubricToText(defaultRubric);

      await updateJob(jobId, {
        status: 'completed',
        result: {
          success: true,
          rubricText: formattedText,
          totalPoints: defaultRubric.totalPossiblePoints,
          warning: defaultRubric.warning,
          raw: defaultRubric,
        },
        error: error.message,
      });
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  }
};

export { handler };
