import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY not found in environment');
        process.exit(1);
    }

    console.log('🔑 Using API Key:', apiKey.substring(0, 8) + '...');

    try {
        // We can't easily list models with the SDK directly in a simple way without a model instance,
        // but we can try to just make a raw fetch request to the API which is often more revealing for 404s.
        // Or we can use the model manager if exposed, but the SDK simplifies this.
        // Actually, the SDK doesn't expose listModels directly on the top level class in all versions.
        // Let's try a raw REST call to be sure.

        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('\n📋 Available Models:');
        if (data.models) {
            data.models.forEach(m => {
                if (m.name.includes('gemini')) {
                    console.log(`- ${m.name} (${m.displayName})`);
                    console.log(`  Supported methods: ${m.supportedGenerationMethods.join(', ')}`);
                }
            });
        } else {
            console.log('No models found in response.');
        }

    } catch (error) {
        console.error('❌ Error listing models:', error);
    }
}

listModels();
