# Gemini 2.5 Pro Test Script

## Purpose
This test script verifies that your Gemini API key works and that you can access the `gemini-2.5-pro` model.

## Prerequisites

1. **Gemini API Key**: Get one from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. **Add to .env file**:
   ```bash
   GEMINI_API_KEY=your-api-key-here
   ```

## Running the Test

### Option 1: Using .env file (Recommended)
```bash
# Make sure GEMINI_API_KEY is in your .env file
node test-gemini-2.5-pro.js
```

### Option 2: Export environment variable
```bash
export GEMINI_API_KEY=your-api-key-here
node test-gemini-2.5-pro.js
```

### Option 3: Inline environment variable
```bash
GEMINI_API_KEY=your-api-key-here node test-gemini-2.5-pro.js
```

## What the Test Does

1. ✅ Verifies your API key is set
2. ✅ Tests basic text generation with `gemini-2.5-pro`
3. ✅ Simulates an essay grading task
4. ✅ Checks available models (optional)

## Expected Output

```
🧪 Testing Gemini 2.5 Pro API...

✅ API Key found
   Key prefix: AIzaSyBxxx...
   Key length: 39 characters

📝 Test 1: Basic Text Generation
   Model: gemini-2.5-pro
   Prompt: "What is 2+2? Answer in one sentence."

✅ Response received:
   "2 + 2 equals 4."

📝 Test 2: Essay Grading Simulation
   Testing with a sample essay prompt

✅ Grading response received:
---
[Grading feedback will appear here]
---

📝 Test 3: Model Information
   Checking available models...

✅ All tests completed successfully!

📊 Summary:
   ✓ API key is valid
   ✓ gemini-2.5-pro model is accessible
   ✓ Text generation works
   ✓ Essay grading simulation works

🎉 You can use Gemini 2.5 Pro in your application!
```

## Troubleshooting

### Error: "GEMINI_API_KEY environment variable not set"
- Add `GEMINI_API_KEY` to your `.env` file
- Or export it: `export GEMINI_API_KEY=your-key`

### Error: "API key not valid"
- Verify your key at [Google AI Studio](https://aistudio.google.com/app/apikey)
- Make sure there are no extra spaces or quotes

### Error: "Model not found" or "404"
- The `gemini-2.5-pro` model may not be available yet
- Try these alternatives:
  - `gemini-2.0-flash-exp`
  - `gemini-exp-1206`
  - `gemini-1.5-pro`

### Error: "Quota exceeded" or "429"
- You've hit your API rate limit
- Check usage at [Google AI Studio](https://aistudio.google.com/)
- Wait a few minutes and try again

## Next Steps

If the test succeeds, you can:
1. Update your backend functions to use `gemini-2.5-pro`
2. Add Gemini as an alternative to OpenAI in your grading system
3. Update the AI settings UI to include Gemini 2.5 Pro as an option

## Cleanup

After testing, you can delete these files:
- `test-gemini-2.5-pro.js`
- `TEST-GEMINI-README.md`
