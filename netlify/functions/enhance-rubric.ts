import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function buildRubricEnhancementPrompt(totalPoints: number): string {
  return `You are an expert educator helping teachers create detailed, effective grading rubrics.

Your task: Transform simple grading rules into a clear, comprehensive rubric that:
- Uses a ${totalPoints}-point scale
- Breaks down into specific categories with point values
- Provides clear criteria for each category
- Is concise but thorough (aim for 150-300 words)
- Uses bullet points for easy scanning
- Includes any penalties if relevant

CRITICAL RULES:
1. Categories MUST sum to EXACTLY ${totalPoints} points - not more, not less
2. Use the format "Scoring (${totalPoints} pts total):" at the top
3. Double-check your math - verify all categories add up to ${totalPoints}
4. Distribute points logically based on importance
5. Include 2-4 performance levels per category (e.g., 20 pts, 10 pts, 0 pts)

Keep the rubric practical and easy to apply. Focus on clarity over complexity.

Format example:
Scoring (${totalPoints} pts total):
- Category Name (XX pts): 
  - XX pts: Excellent performance description
  - XX pts: Good performance description
  - 0 pts: Poor performance description
- Another Category (XX pts): what to look for

Penalties (if applicable):
- Issue: -X pts

REMEMBER: All category maximums must sum to EXACTLY ${totalPoints} points!`;
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
    const systemPrompt = rubric_prompt || buildRubricEnhancementPrompt(totalPoints);

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Transform these simple grading rules into a detailed rubric with EXACTLY ${totalPoints} total points:\n\n${simple_rules}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const enhanced_rubric = completion.choices[0]?.message?.content?.trim() || '';

    if (!enhanced_rubric) {
      throw new Error('No rubric generated');
    }

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
