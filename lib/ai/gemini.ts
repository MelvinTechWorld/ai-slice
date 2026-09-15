// lib/ai/gemini.ts
//
// Official SDK only (@google/genai), per the brief's requirement. Every
// tunable value is read from AI_CONFIG — nothing hardcoded here.

import { GoogleGenAI } from "@google/genai";
import { AI_CONFIG } from "@/lib/ai/config";
import { EXTRACTION_SYSTEM_PROMPT } from "@/lib/ai/prompts/extraction";
import {
  extractionResultSchema,
  GEMINI_EXTRACTION_RESPONSE_SCHEMA,
  type ExtractionResultData,
} from "@/lib/ai/schemas/extraction";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("Missing GEMINI_API_KEY in .env");
}

const ai = new GoogleGenAI({ apiKey });

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export interface ExtractionCallResult {
  raw: unknown;
  parsed: ExtractionResultData;
}

/**
 * Calls the extraction role model with a receipt image/PDF. Validates the
 * response against our own Zod schema regardless of the provider's schema
 * enforcement — per the brief: never trust provider enforcement alone.
 * Retries up to the role's configured attempt limit on any failure
 * (timeout, malformed JSON, or a response that fails our own validation).
 */
export async function extractReceipt(
  fileBuffer: Buffer,
  mimeType: string
): Promise<ExtractionCallResult> {
  const role = AI_CONFIG.roles.extraction;
  let lastError: unknown;

  for (let attempt = 1; attempt <= role.maxAttempts; attempt++) {
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: role.model,
          contents: [
            { inlineData: { mimeType, data: fileBuffer.toString("base64") } },
            { text: "Extract this receipt." },
          ],
          config: {
            systemInstruction: EXTRACTION_SYSTEM_PROMPT,
            temperature: role.temperature,
            maxOutputTokens: role.maxOutputTokens,
            thinkingConfig: { thinkingLevel: role.thinkingLevel },
            responseMimeType: "application/json",
            responseSchema: GEMINI_EXTRACTION_RESPONSE_SCHEMA,
          },
        }),
        role.timeoutMs,
        "Gemini extraction call"
      );

      const rawText = response.text;
      if (!rawText) {
        throw new Error("Empty response from model");
      }

      const rawJson = JSON.parse(rawText);

      // Our own validation, in our own code, on receipt — not the
      // provider's schema enforcement alone.
      const parsed = extractionResultSchema.parse(rawJson);

      return { raw: rawJson, parsed };
    } catch (err) {
      lastError = err;
      console.warn(`[gemini] extraction attempt ${attempt}/${role.maxAttempts} failed:`, err);
      if (attempt < role.maxAttempts) {
        // Fixed linear backoff, not exponential — a validation failure
        // (bad JSON, schema mismatch) isn't a rate limit, so there's no
        // reason to back off aggressively; a brief pause just avoids
        // hammering the same failing call back to back.
        const backoff = 500 * attempt;
        await new Promise((resolve) => setTimeout(resolve, backoff));
      }
    }
  }

  throw new Error(
    `Extraction failed after ${role.maxAttempts} attempts: ${lastError instanceof Error ? lastError.message : String(lastError)
    }`
  );
}