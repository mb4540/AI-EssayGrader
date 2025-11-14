import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import OpenAI from 'openai';
import type { ChatCompletionCreateParamsNonStreaming } from 'openai/resources/chat/completions';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Structured output schema for rubric
const RUBRIC_SCHEMA = {
  type: 'object',
  properties: {
    total_points: {
      type: 'number',
      description: 'Total points for the entire rubric'
    },
    categories: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Category name (e.g., "Focus and Theme")'
          },
          points: {
            type: 'number',
            description: 'Maximum points for this category'
          },
          levels: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                label: {
                  type: 'string',
                  description: 'Level label (e.g., "Exemplary", "Proficient")'
                },
                points: {
                  type: 'number',
                  description: 'Points awarded for achieving this level'
                },
                description: {
                  type: 'string',
                  description: 'What the student must demonstrate for this level'
                }
              },
              required: ['label', 'points', 'description'],
              additionalProperties: false
            }
          }
        },
        required: ['name', 'points', 'levels'],
        additionalProperties: false
      }
    },
    penalties: {
      type: 'array',
      description: 'Optional penalties (can be empty array)',
      items: {
        type: 'object',
        properties: {
          reason: {
            type: 'string',
            description: 'Reason for penalty (e.g., "Late submission")'
          },
          deduction: {
            type: 'number',
            description: 'Points deducted'
          }
        },
        required: ['reason', 'deduction'],
        additionalProperties: false
      }
    }
  },
  required: ['total_points', 'categories', 'penalties'],
  additionalProperties: false
} as const;

/**
 * Convert structured rubric JSON to markdown format for display
 */
function convertRubricToMarkdown(rubric: any): string {
  let markdown = `**Scoring (${rubric.total_points} pts total):**\n\n`;
  
  // Add each category
  for (const category of rubric.categories) {
    markdown += `- **${category.name} (${category.points} pts)**:\n`;
    
    // Add levels for this category
    for (const level of category.levels) {
      markdown += `  - ${level.points} pts: ${level.description}\n`;
    }
    markdown += '\n';
  }
  
  // Add penalties if present
  if (rubric.penalties && rubric.penalties.length > 0) {
    markdown += '**Penalties (if applicable)**:\n';
    for (const penalty of rubric.penalties) {
      markdown += `- **${penalty.reason}:** -${penalty.deduction} pts\n`;
    }
  }
  
  return markdown.trim();
}

function buildRubricEnhancementPrompt(totalPoints: number): string {
  return `You are an expert educator creating a grading rubric.

Your task depends on the input provided:

**IF the input is a COMPREHENSIVE RUBRIC** (detailed scoring criteria with multiple levels):
- Keep ALL scoring criteria, descriptions, and levels EXACTLY as written
- ONLY reformat to match the required structure
- Use EXACTLY ${totalPoints} total points (adjust point values proportionally if needed)
- Preserve the teacher's exact wording and intent
- Do NOT add, remove, or change any criteria descriptions

**IF the input is SIMPLE RULES** (just a few words or brief guidelines):
- Create a detailed, comprehensive rubric
- Use EXACTLY ${totalPoints} total points
- Create 4-8 categories that logically break down the assignment
- Provide 2-4 performance levels per category
- Write clear, specific descriptions for each level

**CRITICAL MATH RULES (applies to both):**
1. All category.points MUST sum to EXACTLY ${totalPoints}
2. Within each category, levels should have DESCENDING points (highest level = category max)
3. Lowest level is typically 0 points
4. Distribute points based on importance

**Format Guidelines:**
- Be specific and measurable
- Use clear language
- Make levels distinguishable
- Keep descriptions concise (1-2 sentences per level)
- If no penalties mentioned, return penalties: []

**IMPORTANT:** If the input already has detailed scoring criteria (like "Score: 4", "Score: 3", etc.), preserve those exact descriptions and only convert to the required JSON structure.

Return a structured JSON object that will be used for grading.`;
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { simple_rules, rubric_prompt, total_points } = JSON.parse(event.body || '{}');

    if (!simple_rules || typeof simple_rules !== 'string') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'simple_rules is required' }),
      };
    }

    // Default to 100 if not provided
    const totalPoints = total_points && typeof total_points === 'number' ? total_points : 100;
    
    // Build the prompt with the specified total points
    const systemPrompt = buildRubricEnhancementPrompt(totalPoints);

    // Use structured outputs to guarantee format
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-2024-08-06', // Structured outputs require this model or newer
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Simple grading rules:\n\n${simple_rules}`,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'rubric',
          strict: true,
          schema: RUBRIC_SCHEMA
        }
      },
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('No rubric generated');
    }

    // Parse the structured JSON response
    const rubricData = JSON.parse(content);
    
    // Validate the math
    const categorySum = rubricData.categories.reduce((sum: number, cat: any) => sum + cat.points, 0);
    if (Math.abs(categorySum - rubricData.total_points) > 0.01) {
      throw new Error(`Category points sum to ${categorySum}, but total_points is ${rubricData.total_points}`);
    }
    
    // Convert JSON to markdown format for display
    const enhanced_rubric = convertRubricToMarkdown(rubricData);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ enhanced_rubric }),
    };
  } catch (error) {
    console.error('Rubric enhancement error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to enhance rubric',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

export { handler };
