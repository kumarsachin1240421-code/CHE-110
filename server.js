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
    supabaseUrl: (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim(),
    supabaseAnonKey: (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '').trim()
  });
});

/**
 * POST /api/classify
 * Accepts an image (base64 string or data URL), analyzes it with Gemini Vision,
 * and returns structured waste classification JSON.
 */
app.post('/api/classify', async (req, res) => {
  try {
    const apiKey = (req.body.apiKey || process.env.GEMINI_API_KEY || '').trim();
    const { image, mimeType } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        error: 'No image provided. Please send a base64 image or data URL in the request body.'
      });
    }

    // Check if GEMINI_API_KEY is configured
    if (!apiKey || apiKey.length === 0) {
      return res.status(200).json({
        success: false,
        needsKey: true,
        error: 'GEMINI_API_KEY is not configured. Please add your key to .env.local to enable live real-time Gemini Vision classification.',
        data: null
      });
    }

    // Initialize Google Generative AI client
    const genAI = new GoogleGenerativeAI(apiKey);

    // Cleanly strip data URI scheme
    const base64Data = typeof image === 'string' ? image : '';
    const cleanBase64 = base64Data.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const prompt = `You are an expert waste segregation and environmental recycling AI.
Analyze the image and strictly classify the waste item into one of the 5 standard municipal color bins according to these rules:
• GREEN: Biodegradable & Organic waste (food leftovers, peels, plants)
• BLUE: Dry & Recyclable waste (clean plastic, paper, glass, metal)
• RED: Hazardous & Biomedical waste (chemicals, batteries, electronics, toxic items)
• YELLOW: Sanitary & Medical waste (bandages, syringes, diapers, medical hygiene)
• BLACK: General & Mixed waste (inert sweepings, composite materials, non-recyclables)

Force response output strictly as clean JSON matching this exact structure:
{
  "waste_detected": "string",
  "bin_colour": "GREEN" | "BLUE" | "RED" | "YELLOW" | "BLACK",
  "category_name": "string",
  "instructions": "string",
  "points_value": number
}

Rules:
- bin_colour MUST be strictly one of: "GREEN", "BLUE", "RED", "YELLOW", "BLACK".
- instructions must be 1 concise sentence under 20 words.
- points_value must be an integer (10 for GREEN/BLUE/BLACK, 15 for RED/YELLOW).`;

    // Strictly prioritize gemini-1.5-flash with resilient fallback for upstream 404/availability
    const candidateModels = ['gemini-1.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-flash'];
    let response = null;
    let lastError = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
            maxOutputTokens: 250
          }
        });

        response = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType || "image/jpeg"
            }
          }
        ]);
        if (response) break;
      } catch (err) {
        lastError = err;
        console.warn(`Model ${modelName} call failed, trying next candidate:`, err.message || err);
      }
    }

    if (!response) {
      throw lastError || new Error('Gemini Vision model call failed.');
    }

    const resultText = response.response.text();
    let parsedResult = null;
    try {
      parsedResult = JSON.parse(resultText);
    } catch {
      try {
        const cleaned = resultText.replace(/```json/gi, '').replace(/```/g, '').trim();
        parsedResult = JSON.parse(cleaned);
      } catch {
        const match = resultText.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            parsedResult = JSON.parse(match[0]);
          } catch {}
        }
      }
    }

    if (!parsedResult) {
      throw new Error('Failed to parse Gemini Vision classification response.');
    }

    const wasteDetected = parsedResult.waste_detected || parsedResult.itemName || 'Identified Waste';
    let rawBin = String(parsedResult.bin_colour || parsedResult.binColor || parsedResult.binType || '').trim().toUpperCase();
    let binColour = 'BLUE';
    if (rawBin.includes('RED') || String(parsedResult.category_name).toUpperCase().includes('HAZARD')) binColour = 'RED';
    else if (rawBin.includes('YELLOW') || String(parsedResult.category_name).toUpperCase().includes('SANITARY') || String(parsedResult.category_name).toUpperCase().includes('MEDICAL')) binColour = 'YELLOW';
    else if (rawBin.includes('BLACK') || String(parsedResult.category_name).toUpperCase().includes('GENERAL') || String(parsedResult.category_name).toUpperCase().includes('MIXED')) binColour = 'BLACK';
    else if (rawBin.includes('GREEN') || String(parsedResult.category_name).toUpperCase().includes('BIO') || String(parsedResult.category_name).toUpperCase().includes('ORGANIC')) binColour = 'GREEN';
    else if (rawBin.includes('BLUE') || String(parsedResult.category_name).toUpperCase().includes('RECYCL')) binColour = 'BLUE';

    const defaultCategories = {
      GREEN: 'Biodegradable & Organic',
      BLUE: 'Dry & Recyclable',
      RED: 'Hazardous & Biomedical',
      YELLOW: 'Sanitary & Medical',
      BLACK: 'General & Mixed'
    };

    const categoryName = parsedResult.category_name || parsedResult.category || defaultCategories[binColour];
    const instructions = parsedResult.instructions || parsedResult.ecoAdvice || 'Place into designated collection bin.';
    const pointsValue = Number(parsedResult.points_value) || (binColour === 'RED' || binColour === 'YELLOW' ? 15 : 10);

    const binTypeNames = {
      GREEN: 'Green Bin (Biodegradable & Organic Waste)',
      BLUE: 'Blue Bin (Dry & Recyclable Waste)',
      RED: 'Red Bin (Hazardous & Biomedical Waste)',
      YELLOW: 'Yellow Bin (Sanitary & Medical Waste)',
      BLACK: 'Black Bin (General & Mixed Waste)'
    };

    return res.json({
      success: true,
      source: 'gemini-vision-live',
      data: {
        waste_detected: wasteDetected,
        bin_colour: binColour,
        category_name: categoryName,
        instructions: instructions,
        points_value: pointsValue,
        // Compatibility properties
        itemName: wasteDetected,
        category: categoryName,
        classification: categoryName,
        binType: binTypeNames[binColour] || `${binColour} Bin`,
        binColor: binTypeNames[binColour] || `${binColour} Bin`,
        ecoAdvice: instructions,
        tip: instructions
      }
    });

  } catch (err) {
    console.error("Gemini Vision Scan Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to analyze image with Gemini Vision API.'
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
