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

    const prompt = `You are an expert waste segregation AI. Classify the given image into strictly one of 5 bins:
• GREEN: Biodegradable & Organic kitchen waste, raw peels, leftovers, plant matter.
• BLUE: Clean, segregated dry recyclables (clean pet bottles, dry paper/cardboard, clean soda cans).
• RED: Toxic/Hazardous items, batteries, wires, discarded electronics, chemical containers.
• YELLOW: Sanitary pads, diapers, medical bandages, cotton swabs, clinical waste.
• BLACK: General mixed waste, dust sweepings, cigarette butts, non-recyclable multi-layer packaging, mixed industrial scrap, rubble, or unsegregated debris piles.

CRITICAL OVERRIDE RULE:
- If the image shows mixed scrap, debris mounds, rusty scrap heaps, or unsegregated garbage piles, NEVER categorize it as BLUE.
- Assign it strictly to BLACK (General/Mixed Waste) or RED (if hazardous/e-waste).

Return valid JSON strictly matching this exact schema:
{
  "waste_detected": "",
  "bin_colour": "GREEN" | "BLUE" | "RED" | "YELLOW" | "BLACK",
  "category_name": "",
  "instructions": "",
  "points_value": 
}

Rules:
- bin_colour MUST be strictly one of: "GREEN", "BLUE", "RED", "YELLOW", "BLACK".
- category_name must be a short descriptive name for the waste category.
- instructions must be 1 concise sentence under 20 words for safe disposal.
- points_value must be an integer (10 for GREEN/BLUE/BLACK, 15 for RED/YELLOW).`;

    // Strictly set Gemini model to gemini-1.5-flash with seamless fallback
    let resultText = null;
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
          maxOutputTokens: 250
        }
      });

      const response = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: mimeType || "image/jpeg",
            data: cleanBase64
          }
        }
      ]);
      resultText = response?.response?.text();
    } catch (primaryErr) {
      console.warn("Primary model gemini-1.5-flash failed, falling back to gemini-3.5-flash-lite:", primaryErr.message);
      const fallbackModel = genAI.getGenerativeModel({
        model: 'gemini-3.5-flash-lite',
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
          maxOutputTokens: 250
        }
      });
      const fallbackResp = await fallbackModel.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: mimeType || "image/jpeg",
            data: cleanBase64
          }
        }
      ]);
      resultText = fallbackResp?.response?.text();
    }

    if (!resultText) {
      throw new Error('Gemini Vision model call failed.');
    }
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
    const rawCat = String(parsedResult.category_name || parsedResult.category || '').trim().toUpperCase();
    let binColour = 'BLACK';

    // Strict 5-bin resolution with critical override
    if (rawBin === 'GREEN') binColour = 'GREEN';
    else if (rawBin === 'BLUE') binColour = 'BLUE';
    else if (rawBin === 'RED') binColour = 'RED';
    else if (rawBin === 'YELLOW') binColour = 'YELLOW';
    else if (rawBin === 'BLACK') binColour = 'BLACK';
    else if (rawBin.includes('RED') || rawCat.includes('HAZARD') || rawCat.includes('BIOMEDICAL') || rawCat.includes('TOXIC') || rawCat.includes('BATTER') || rawCat.includes('E-WASTE') || rawCat.includes('ELECTRONIC') || rawCat.includes('CHEMICAL') || rawCat.includes('WIRE')) {
      binColour = 'RED';
    } else if (rawBin.includes('BLACK') || rawCat.includes('GENERAL') || rawCat.includes('MIXED') || rawCat.includes('INERT') || rawCat.includes('NON-RECYCL') || rawCat.includes('TRASH') || rawCat.includes('SWEEPING') || rawCat.includes('SCRAP') || rawCat.includes('DEBRIS') || rawCat.includes('RUBBLE') || rawCat.includes('HEAP') || rawCat.includes('MOUND') || rawCat.includes('CIGARETTE') || rawCat.includes('MULTI-LAYER') || rawCat.includes('UNSEGREGATED')) {
      binColour = 'BLACK';
    } else if (rawBin.includes('YELLOW') || rawCat.includes('SANITARY') || rawCat.includes('MEDICAL') || rawCat.includes('HYGIENE') || rawCat.includes('BANDAGE') || rawCat.includes('DIAPER') || rawCat.includes('SWAB') || rawCat.includes('SYRINGE') || rawCat.includes('CLINICAL')) {
      binColour = 'YELLOW';
    } else if (rawBin.includes('GREEN') || rawCat.includes('BIO') || rawCat.includes('ORGANIC') || rawCat.includes('COMPOST') || rawCat.includes('WET') || rawCat.includes('FOOD') || rawCat.includes('PEEL') || rawCat.includes('LEFTOVER') || rawCat.includes('PLANT') || rawCat.includes('KITCHEN')) {
      binColour = 'GREEN';
    } else if (rawBin.includes('BLUE') || rawCat.includes('DRY') || rawCat.includes('RECYCL') || rawCat.includes('PAPER') || rawCat.includes('PLASTIC') || rawCat.includes('METAL') || rawCat.includes('GLASS') || rawCat.includes('BOTTLE') || rawCat.includes('CAN') || rawCat.includes('CARDBOARD')) {
      binColour = 'BLUE';
    }

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
 * Legacy compatibility endpoint for daily facts & news.
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
      'gemini-1.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
      'gemini-2.5-flash'
    ];

    const systemInstruction = `You are an educational environmental mentor. Generate an inspiring, student-focused, relatable environmental breakthrough and a practical daily green habit tip in simple, conversational English.
Return valid JSON only matching this exact schema:
{
  "tag": "e.g. GLOBAL GREEN UPDATE, RECYCLING BREAKTHROUGH, CLEAN ENERGY MILESTONE",
  "title": "concise, engaging headline (max 8 words)",
  "fact": "a compelling, conversational 2-sentence fact explaining real-world positive progress",
  "habitTip": "one easy, actionable daily green habit students and citizens can adopt immediately",
  "icon": "a single relevant emoji (e.g. 🌊, 🌲, 🐝, 🌍, 💡, 🪴, ♻️, 🍃)"
}`;

    const prompt = 'Generate a fresh, unique daily environmental breakthrough and friendly daily green habit tip for students and citizens.';

    let parsedResult = null;
    let lastError = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.75
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
