require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { OpenAI } = require("openai");
const { AnalysisSchema } = require("../schema");
const { ZodError } = require("zod");

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','DELETE'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.use(express.json({ limit: "25mb" })); 

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});
app.get("/", (req, res) => {
  res.send("Groq Backend is Live!");
});
app.post("/api/analyze", async (req, res) => {
  const { base64Image } = req.body;
  if (!base64Image) return res.status(400).json({ error: "No image" });

  try {
    const completion = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct", 
      messages: [
        {
          role: "system",
          content: `You are a Food Scientist. Scan the label and return ONLY JSON.
          CRITICAL: "confidence_score" MUST be a number between 0.0 and 1.0 (no strings).
          Example: "confidence_score": 0.95
          
          SCHEMA: {
            "verdict": "string",
            "reasoning": "string",
            "tradeoffs": [{"benefit": "string", "concern": "string"}],
            "sugar_info": {"level": "High|Medium|Low", "explanation": "string"},
            "suitability": {"best_for": ["string"], "caution_for": ["string"]},
            "confidence_score": 0.95,
            "uncertainty": "string"
          }`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this ingredient label." },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
          ],
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const jsonResponse = JSON.parse(completion.choices[0].message.content);
    const validatedData = AnalysisSchema.parse(jsonResponse);
    res.json(validatedData);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed", message: err.message });
  }
});

//app.listen(PORT, "0.0.0.0", () => console.log(`Backend on {PORT}`));
module.exports = app;
