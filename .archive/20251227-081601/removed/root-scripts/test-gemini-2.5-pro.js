/**
 * Test script for Gemini 2.5 Pro API connectivity
 * 
 * Usage:
 *   node test-gemini-2.5-pro.js
 * 
 * Requirements:
 *   - GEMINI_API_KEY environment variable must be set
 *   - npm install @google/generative-ai (if not already installed)
 */

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenerativeAI } from '@google/generative-ai';

async function testGemini25Pro() {
  console.log('🧪 Testing Gemini 2.5 Pro API...\n');

  // Check for API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: GEMINI_API_KEY environment variable not set');
    console.error('   Please add it to your .env file or export it:');
    console.error('   export GEMINI_API_KEY=your-api-key-here\n');
    process.exit(1);
  }

  console.log('✅ API Key found');
  console.log(`   Key prefix: ${apiKey.substring(0, 10)}...`);
  console.log(`   Key length: ${apiKey.length} characters\n`);

  try {
    // Initialize Gemini client
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Test 1: Basic text generation
    console.log('📝 Test 1: Basic Text Generation');
    console.log('   Model: gemini-2.5-pro');
    console.log('   Prompt: "What is 2+2? Answer in one sentence."\n');
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    
    const result = await model.generateContent('What is 2+2? Answer in one sentence.');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Response received:');
    console.log(`   "${text}"\n`);

    // Test 2: Essay grading simulation
    console.log('📝 Test 2: Essay Grading Simulation');
    console.log('   Testing with a sample essay prompt\n');
    
    const essayPrompt = `You are an expert teacher grading a student essay.

Essay Topic: "The importance of reading"
Student Essay: "Reading is very important because it helps us learn new things. Books teach us about history, science, and many other subjects. Reading also improves our vocabulary and writing skills."

Please provide:
1. A grade out of 100
2. Two strengths
3. Two areas for improvement

Keep your response concise.`;

    const gradingResult = await model.generateContent(essayPrompt);
    const gradingResponse = await gradingResult.response;
    const gradingText = gradingResponse.text();
    
    console.log('✅ Grading response received:');
    console.log('---');
    console.log(gradingText);
    console.log('---\n');

    // Test 3: Check model capabilities
    console.log('📝 Test 3: Model Information');
    console.log('   Checking available models...\n');
    
    // Note: List models may not show all models depending on API access
    try {
      const models = await genAI.listModels();
      const gemini25Models = models.filter(m => m.name.includes('2.5'));
      
      if (gemini25Models.length > 0) {
        console.log('✅ Gemini 2.5 models found:');
        gemini25Models.forEach(m => {
          console.log(`   - ${m.name}`);
        });
      } else {
        console.log('⚠️  No Gemini 2.5 models found in list');
        console.log('   (This may be normal - the model may still work)');
      }
    } catch (listError) {
      console.log('⚠️  Could not list models (this is OK):');
      console.log(`   ${listError.message}`);
    }

    console.log('\n✅ All tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   ✓ API key is valid');
    console.log('   ✓ gemini-2.5-pro model is accessible');
    console.log('   ✓ Text generation works');
    console.log('   ✓ Essay grading simulation works');
    console.log('\n🎉 You can use Gemini 2.5 Pro in your application!\n');

  } catch (error) {
    console.error('\n❌ Error occurred during testing:');
    console.error(`   ${error.message}\n`);
    
    if (error.message.includes('API key')) {
      console.error('💡 Tip: Check that your GEMINI_API_KEY is correct');
      console.error('   Get your key from: https://aistudio.google.com/app/apikey\n');
    } else if (error.message.includes('not found') || error.message.includes('404')) {
      console.error('💡 Tip: The model "gemini-2.5-pro" may not be available yet');
      console.error('   Try these alternatives:');
      console.error('   - gemini-2.0-flash-exp');
      console.error('   - gemini-exp-1206');
      console.error('   - gemini-1.5-pro\n');
    } else if (error.message.includes('quota') || error.message.includes('429')) {
      console.error('💡 Tip: You may have exceeded your API quota');
      console.error('   Check your usage at: https://aistudio.google.com/\n');
    }
    
    console.error('Full error details:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testGemini25Pro();
