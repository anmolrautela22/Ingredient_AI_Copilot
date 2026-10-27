const { z } = require("zod");

const forceArray = z.preprocess((val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") return [val];
  if (!val) return [];
  return [String(val)];
}, z.array(z.string()).catch([]));

const AnalysisSchema = z.object({
  verdict: z.string().describe("Overall health rating"),
  reasoning: z.string().describe("Logic behind verdict"),
  tradeoffs: z.array(z.object({
    benefit: z.string(),
    concern: z.string(),
  })).catch([]),
  sugar_info: z.object({
    level: z.string(),
    explanation: z.string(),
  }),
  suitability: z.object({
    best_for: forceArray,
    caution_for: forceArray,
  }),
  // 🚀 FIXED: Coerces strings to numbers and catches errors to prevent NaN
  confidence_score: z.coerce
    .number()
    .min(0)
    .max(1)
    .catch(0.95) 
    .describe("Score between 0 and 1"),
  uncertainty: z.string().default("None"),
});

module.exports = { AnalysisSchema };