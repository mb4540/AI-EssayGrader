import { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';
import mammoth from 'mammoth';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

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

// Default prompt (fallback if not provided)
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
        // ... other levels for this category
      ]
    }
    // ... other categories
  ],
  "warning": "<optional warning message if extraction was difficult or total points are unclear>"
}

EXTRACTION RULES:
1. Identify Rubric Title: Extract the main title of the rubric or assignment.
2. Identify All Categories: Identify all grading criteria (e.g., "Organization", "Details", "Research"). Categories are typically in the leftmost column or first row of a table.
3. Identify All Achievement Levels: For each category, identify all performance levels (e.g., "Poor (1)", "Good (3)", "4-Sophisticated", "5 Mastery"). These are usually found in the top row or first column.
4. **TABLE PARSING CRITICAL**: If the rubric is in a table format:
   - Each ROW represents a different category
   - Each COLUMN represents a different achievement level
   - Extract the text from EACH CELL separately
   - The cell at row "Organization" and column "Excellent (4)" contains ONLY the Excellent description for Organization
   - Do NOT read across multiple columns or combine text from adjacent cells
5. Extract Descriptions VERBATIM: CRITICAL: Copy the description for EACH category at EACH performance level VERBATIM from the document. Do NOT summarize or paraphrase.
6. Keep Levels Separate: Each level object should contain ONLY the description for that specific level. Do NOT combine text from multiple levels into one description.
7. Extract Score/Point Values: Determine the numerical score or point value for each achievement level (e.g., if a column is labeled "Excellent (4)," the scoreValue is "4"). If points are percentages or letter grades, extract them as strings (e.g., "A", "90%").
8. Calculate Total Points: Estimate the totalPossiblePoints by finding the maximum score in the highest level (e.g., if the levels go 1-4, the total is likely 4 or 4 x number of categories). If a clear total is not present, use a heuristic (e.g., maximum column score).
9. Preserve Wording: Preserve the teacher's EXACT wording, including all details, examples, punctuation, and specifics.
10. **VERIFY COMPLETENESS**: Count the categories and levels. If the table has 5 rows and 4 columns, you should have 5 categories with 4 levels each (20 total descriptions).

CRITICAL REQUIREMENTS:
- The structure MUST be an array of categories, and each category MUST contain an array of levels.
- Each level MUST be a separate object with its own description field.
- The description field for every level MUST be copied VERBATIM from the source document.
- Do NOT combine, merge, or concatenate descriptions from multiple levels.
- Do NOT summarize, shorten, or paraphrase the rubric text.
- The scoreValue should be the numerical score or level designator for that specific column/row.

Example of Expected Output for a Single Category (Based on Formal Analysis Rubric - Organization):
{
  "rubricTitle": "Formal Analysis Writing Rubric",
  "totalPossiblePoints": 20,
  "categories": [
    {
      "categoryName": "Organization",
      "levels": [
        {
          "levelName": "Poor (1)",
          "scoreValue": "1",
          "description": "unorganized list of points; lacks a definite intro or conclusion"
        },
        {
          "levelName": "Average (2)",
          "scoreValue": "2",
          "description": "has clear intro, may be a restatement of assigned question; identifies some main points but lacks a sense of their relative importance; may not distinguish between minor points and supporting details; includes much repetition or statements without development"
        },
        {
          "levelName": "Good (3)",
          "scoreValue": "3",
          "description": "clear introduction and summary at end; generally clear structure but may lack direction or progression; some parts may not contribute to meaning or goal of paper; conclusion is merely a summary of points made or a repetition of intro."
        },
        {
          "levelName": "Excellent (4)",
          "scoreValue": "4",
          "description": "organization shows reader how to understand topic; introduction contains an idea, not just restatement of question; main points well supported by details; examples well chosen; strong conclusion that attempts to bring ideas together."
        }
      ]
    }
  ],
  "warning": ""
}

IMPORTANT: Notice how each level has its OWN separate description. The "Excellent (4)" description does NOT contain text from "Poor (1)", "Average (2)", or "Good (3)". Each level stands alone.

TABLE EXTRACTION EXAMPLE:
If you see a table like this:
| Task         | Poor (1)           | Average (2)        | Good (3)           | Excellent (4)      |
|--------------|--------------------|--------------------|--------------------|--------------------|
| Organization | text from cell 1,1 | text from cell 1,2 | text from cell 1,3 | text from cell 1,4 |
| Description  | text from cell 2,1 | text from cell 2,2 | text from cell 2,3 | text from cell 2,4 |

You should extract:
- Category "Organization" with 4 separate level objects (one for each cell in that row)
- Category "Description" with 4 separate level objects (one for each cell in that row)
- Each cell's text goes into ONE level object only - do not combine cells
`;

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { file, fileName, fileType, totalPoints, geminiModel, extractionPrompt } = JSON.parse(event.body || '{}');
    
    if (!file) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ 
          success: false,
          error: 'Missing file data' 
        }) 
      };
    }

    // Decode base64
    const fileBuffer = Buffer.from(file, 'base64');
    
    // Get Gemini model (default to gemini-2.0-flash-exp)
    const model = genAI.getGenerativeModel({ 
      model: geminiModel || 'gemini-2.0-flash-exp',
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    // Use custom prompt from request or fallback to default
    const systemPrompt = extractionPrompt || DEFAULT_EXTRACTION_PROMPT;
    
    let promptParts: any[] = [systemPrompt];
    
    if (totalPoints) {
      promptParts.push(`Expected total points: ${totalPoints}`);
    }

    // Process based on file type
    // Strategy: Convert Word documents to PDF, then send to Gemini vision API
    
    let pdfBase64: string;
    
    if (fileType.includes('pdf') || fileName.endsWith('.pdf')) {
      // PDF: Use directly
      pdfBase64 = file;
    } else if (fileType.includes('wordprocessingml') || fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      // Word documents: Convert to PDF first
      console.log('Converting Word document to PDF...');
      try {
        // Extract text from Word document
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
        const maxWidth = width - (2 * margin);
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
        console.log('Successfully converted Word document to PDF');
        
      } catch (conversionError: any) {
        console.error('Word to PDF conversion error:', conversionError);
        return {
          statusCode: 400,
          body: JSON.stringify({
            success: false,
            error: `Failed to convert Word document to PDF: ${conversionError.message}`,
            hint: 'Please try converting your document to PDF manually and uploading the PDF file.'
          })
        };
      }
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: 'Unsupported file type. Please upload PDF or DOCX.'
        })
      };
    }

    // Send PDF to Gemini vision API
    promptParts.push("Analyze the PDF document below and extract the rubric.");
    promptParts.push({
      inlineData: {
        data: pdfBase64,
        mimeType: "application/pdf"
      }
    });

    // Call Gemini
    const result = await model.generateContent(promptParts);
    const responseText = result.response.text();
    const rubricData: RubricResponse = JSON.parse(responseText);

    // Convert to paragraph format (using highest level description for each category)
    const formattedText = formatRubricToText(rubricData);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        rubricText: formattedText,
        totalPoints: rubricData.totalPossiblePoints,
        warning: rubricData.warning,
        raw: rubricData // For debugging
      }),
    };

  } catch (error: any) {
    console.error('Extraction error:', error);
    
    // Return a default rubric with warning
    const defaultRubric = createDefaultRubric();
    
    return {
      statusCode: 200, // Still return 200 but with warning
      body: JSON.stringify({
        success: true,
        rubricText: defaultRubric.text,
        totalPoints: defaultRubric.totalPoints,
        warning: 'The system had trouble processing the document. A default rubric has been created. Please review and edit as needed.',
        error: error.message
      }),
    };
  }
};

function formatRubricToText(data: RubricResponse): string {
  if (!data.categories || data.categories.length === 0) {
    return '';
  }

  // Find the maximum score across all categories for the header
  const maxScore = Math.max(...data.categories.map(cat => 
    Math.max(...cat.levels.map(level => parseFloat(level.scoreValue) || 0))
  ));

  const lines = [`Scoring (${data.totalPossiblePoints} pts total):`];
  
  // For each category, include ALL achievement levels
  data.categories.forEach(category => {
    if (category.levels && category.levels.length > 0) {
      // Sort levels by score (highest to lowest)
      const sortedLevels = [...category.levels].sort((a, b) => {
        const scoreA = parseFloat(a.scoreValue) || 0;
        const scoreB = parseFloat(b.scoreValue) || 0;
        return scoreB - scoreA;
      });
      
      // Add category header with max points
      const maxPoints = sortedLevels[0].scoreValue;
      lines.push(`- ${category.categoryName} (${maxPoints} pts):`);
      
      // Add each level as a sub-item
      sortedLevels.forEach(level => {
        lines.push(`  • ${level.levelName}: ${level.description}`);
      });
    }
  });

  return lines.join('\n');
}

function createDefaultRubric() {
  const defaultCriteria = [
    { category: 'Content', points: 40, description: 'demonstrates understanding of topic with relevant details' },
    { category: 'Organization', points: 30, description: 'clear structure with introduction, body, and conclusion' },
    { category: 'Language & Style', points: 20, description: 'appropriate word choice and sentence variety' },
    { category: 'Conventions', points: 10, description: 'correct grammar, spelling, and punctuation' }
  ];

  const totalPoints = defaultCriteria.reduce((sum, c) => sum + c.points, 0);
  const lines = [`Scoring (${totalPoints} pts total):`];
  
  defaultCriteria.forEach(c => {
    lines.push(`- ${c.category} (${c.points}): ${c.description}`);
  });

  return {
    text: lines.join('\n'),
    totalPoints
  };
}
