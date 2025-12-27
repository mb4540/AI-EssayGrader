/**
 * Test script for Gemini 2.5 Pro API connectivity
 * 
 * Usage:
 *   node test-gemini-2.5-pro-verify.js
 * 
 * Requirements:
 *   - GEMINI_API_KEY environment variable must be set
 *   - @google/generative-ai package installed
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testGemini25Pro() {
  console.log('\n🧪 Testing Gemini 2.5 Pro API\n');
  console.log('=' .repeat(60));
  
  // Check for API key
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ Error: GEMINI_API_KEY not found in environment variables');
    console.error('💡 Make sure you have a .env file with GEMINI_API_KEY set\n');
    process.exit(1);
  }
  
  console.log('✓ GEMINI_API_KEY found');
  console.log(`  Key preview: ${process.env.GEMINI_API_KEY.substring(0, 10)}...`);
  
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Test: Basic text generation with Gemini 2.5 Pro
    console.log('\n📝 Test: Basic Text Generation');
    console.log('   Model: gemini-2.5-pro');
    console.log('   Prompt: "Explain how AI works in a few words"\n');
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    
    const result = await model.generateContent('Explain how AI works in a few words');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Response received:');
    console.log('─'.repeat(60));
    console.log(text);
    console.log('─'.repeat(60));
    
    // Check token usage
    const usage = response.usageMetadata;
    if (usage) {
      console.log('\n📊 Token Usage:');
      console.log(`   Prompt tokens: ${usage.promptTokenCount || 0}`);
      console.log(`   Response tokens: ${usage.candidatesTokenCount || 0}`);
      console.log(`   Total tokens: ${usage.totalTokenCount || 0}`);
    }
    
    console.log('\n✅ Test completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   ✓ API key is valid');
    console.log('   ✓ gemini-2.5-pro model is accessible');
    console.log('   ✓ Text generation works');
    console.log('\n🎉 You can use Gemini 2.5 Pro in your application!\n');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error('─'.repeat(60));
    console.error(error.message);
    console.error('─'.repeat(60));
    
    if (error.message.includes('API key')) {
      console.error('\n💡 Tip: Check that your GEMINI_API_KEY is correct');
      console.error('   Get your key from: https://aistudio.google.com/app/apikey\n');
    } else if (error.message.includes('not found') || error.message.includes('404')) {
      console.error('\n💡 Tip: The model "gemini-2.5-pro" may not be available');
      console.error('   Try these alternatives:');
      console.error('   - gemini-2.5-flash');
      console.error('   - gemini-2.0-flash-exp');
      console.error('   - gemini-1.5-pro\n');
    } else if (error.message.includes('quota') || error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED')) {
      console.error('\n💡 Tip: You may have exceeded your API quota');
      console.error('   Check your quota at: https://console.cloud.google.com/');
      console.error('   Gemini 2.5 Pro free tier: 15 requests per minute\n');
    }
    
    process.exit(1);
  }
}

// Run the test
testGemini25Pro();
