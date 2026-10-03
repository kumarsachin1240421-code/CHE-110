import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables exclusively from .env.local first, then fallback to .env
dotenv.config({ path: '.env.local' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8088;

// Body parsing middleware for JSON and URL-encoded data with high limits for base64 images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static frontend files from workspace root
app.use(express.static(__dirname));

/**
 * GET /api/auth/config
 * Returns public Supabase client configuration safely (URL and Anon Key).
 */
app.get('/api/auth/config', (req, res) => {
  res.json({
    supabaseUrl: (process.env.SUPABASE_URL || '').trim(),
    supabaseAnonKey: (process.env.SUPABASE_ANON_KEY || '').trim()
  });
});

/**
 * POST /api/classify
 * Accepts an image (base64 string or data URL), analyzes it with Gemini Vision,
 * and returns structured waste classification JSON.
 */
app.post('/api/classify', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const { image, mimeType } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        error: 'No image provided. Please send a base64 image or data URL in the request body.'
      });
    }

    // Check if GEMINI_API_KEY is configured in process.env
    if (!apiKey || apiKey.trim().length === 0) {
      return res.status(200).json({
        success: false,
        needsKey: true,
        error: 'GEMINI_API_KEY is not configured. Please add your key to .env.local to enable live real-time Gemini Vision classification.',
        data: null
      });
    }

    // Initialize Google Generative AI client exclusively via process.env.GEMINI_API_KEY
    const genAI = new GoogleGenerativeAI(apiKey.trim());

    // Extract raw base64 data and mimeType
    let base64Data = image;
    let detectedMime = mimeType || 'image/jpeg';

    if (typeof image === 'string' && image.includes(';base64,')) {
      const parts = image.split(';base64,');
      detectedMime = parts[0].replace('data:', '') || detectedMime;
      base64Data = parts[1];
    }

    const systemInstruction = `You are a world-class waste segregation & recycling intelligence AI.
Your objective is to inspect the uploaded image of a household waste or discarded item, accurately recognize the material, and return strictly valid JSON matching this exact schema:
{
  "itemName": "string",
  "classification": "Biodegradable" or "Non-Biodegradable",
  "binColor": "Green Bin (Organic/Wet Waste)" or "Blue Bin (Dry/Recyclable)",
  "tip": "short, actionable, friendly disposal advice"
}

CRITICAL RULES FOR ACCURATE SEGREGATION:
1. PAPER, CARDBOARD, NEWSPAPERS, & PAPER SHEETS:
   - Clean, dry paper sheets, notebooks, books, newspapers, envelopes, and cardboard boxes are recyclable dry waste. In municipal waste management, dry clean paper MUST be deposited in the "Blue Bin (Dry/Recyclable)".
   - Set classification to "Biodegradable" (since cellulose naturally decomposes in nature), but ALWAYS assign binColor to "Blue Bin (Dry/Recyclable)" for clean paper so it can be mechanically shredded and recycled into new paper products.
   - If paper is heavily soiled with wet food, oil, or grease (like greasy food packaging or dirty paper napkins), assign "Green Bin (Organic/Wet Waste)" for composting.
2. ORGANIC & WET WASTE:
   - Banana peels, apple cores, fruit/vegetable scraps, food leftovers, coffee grounds, tea bags, garden leaves, flowers, and eggshells:
   - classification: "Biodegradable"
   - binColor: "Green Bin (Organic/Wet Waste)"
   - tip: Focus on composting or wet waste processing.
3. DRY & RECYCLABLE PLASTICS, METALS, GLASS:
   - Plastic bottles, plastic containers, beverage cans, aluminum foil, glass bottles, metal caps, cardboard cartons:
   - classification: "Non-Biodegradable"
   - binColor: "Blue Bin (Dry/Recyclable)"
   - tip: Advise rinsing residual food/liquid and flattening/crushing to conserve space.
4. DO NOT HALLUCINATE: Identify what is genuinely visible in the image. Give a concise itemName (e.g. "Clean Paper Sheet", "Plastic Water Bottle", "Banana Peel", "Aluminum Soda Can").`;

    const prompt = 'Analyze this waste item for municipal segregation. Accurately identify the item name, whether it is Biodegradable or Non-Biodegradable, its proper bin color (Green Bin for wet/organic, Blue Bin for dry/recyclable), and practical disposal tip.';

    // List of model candidates in order of preference
    const candidateModels = [
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
      'gemini-2.5-flash',
      'gemini-1.5-flash'
    ];

    let lastError = null;
    let parsedResult = null;
    let usedModel = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2
          },
          systemInstruction
        });

        const response = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64Data,
              mimeType: detectedMime
            }
          }
        ]);

        const resultText = response.response.text();
        try {
          parsedResult = JSON.parse(resultText);
        } catch {
          const cleaned = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
          parsedResult = JSON.parse(cleaned);
        }

        if (parsedResult) {
          usedModel = modelName;
          break;
        }
      } catch (err) {
        console.warn(`Model ${modelName} failed, trying next candidate:`, err.message || err);
        lastError = err;
      }
    }

    if (!parsedResult) {
      throw lastError || new Error('All Gemini Vision model candidates failed to classify image.');
    }

    return res.json({
      success: true,
      source: 'gemini-vision-live',
      data: {
        itemName: parsedResult.itemName || 'Identified Waste',
        classification: parsedResult.classification === 'Biodegradable' ? 'Biodegradable' : 'Non-Biodegradable',
        binColor: parsedResult.binColor || (parsedResult.classification === 'Biodegradable' ? 'Green Bin (Organic/Wet Waste)' : 'Blue Bin (Dry/Recyclable)'),
        tip: parsedResult.tip || 'Place into designated collection bin.'
      }
    });

  } catch (error) {
    console.error('Gemini Classification Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze image with Gemini Vision API.'
    });
  }
});

/**
 * GET /api/daily-fact
 * Generates an inspiring, student-focused, scientifically accurate environmental fact
 * and an easy daily green habit tip using the Gemini API.
 */
app.get('/api/daily-fact', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim().length === 0) {
      return res.status(200).json({
        success: false,
        needsKey: true,
        error: 'GEMINI_API_KEY is not configured in .env.local'
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey.trim());
    const candidateModels = [
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
      'gemini-2.5-flash',
      'gemini-1.5-flash'
    ];

    const systemInstruction = `You are an educational environmental scientist and zero-waste mentor. Generate an inspiring, student-focused, scientifically accurate environmental fact and an easy, practical daily green habit tip.
Return valid JSON only matching this exact schema:
{
  "tag": "short category badge (e.g. Ocean Health, Circular Economy, Soil Science, Renewable Power, Plastic Reduction)",
  "title": "concise, engaging headline (max 8 words)",
  "fact": "a compelling, scientifically accurate 2-sentence fact with concrete data or real-world impact",
  "habitTip": "one easy, actionable daily green habit students and citizens can adopt immediately",
  "icon": "a single relevant emoji (e.g. 🌊, 🌲, 🐝, 🌍, 💡, 🪴, ♻️, 🍃)"
}`;

    const prompt = 'Generate a fresh, unique daily environmental fact and daily green habit tip for students and citizens.';

    let parsedResult = null;
    let lastError = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.7
          },
          systemInstruction
        });

        const response = await model.generateContent(prompt);
        const text = response.response.text();

        try {
          parsedResult = JSON.parse(text);
        } catch {
          const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
          parsedResult = JSON.parse(cleaned);
        }

        if (parsedResult) break;
      } catch (err) {
        lastError = err;
      }
    }

    if (!parsedResult) {
      throw lastError || new Error('Failed to generate daily eco-fact with Gemini.');
    }

    return res.json({
      success: true,
      data: parsedResult
    });
  } catch (error) {
    console.error('Gemini Fact Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch Gemini eco fact'
    });
  }
});

// Fallback to index.html for single-page routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌿 EcoScan AI server running with Gemini Vision API endpoint at http://localhost:${PORT}`);
  console.log(`🔑 GEMINI_API_KEY status: ${process.env.GEMINI_API_KEY ? 'Configured' : 'Empty in .env.local'}`);
});
