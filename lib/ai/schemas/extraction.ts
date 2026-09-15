// lib/ai/schemas/extraction.ts
//
// Two schemas describing the same shape, deliberately kept separate:
// - GEMINI_EXTRACTION_RESPONSE_SCHEMA is what we ask the provider to
//   constrain its output to (responseSchema).
// - extractionResultSchema is what we validate the parsed JSON against
//   ourselves, on receipt, regardless of what the provider did. Per the
//   brief: "structured output, requested with a schema and validated in
//   your own code on receipt." Provider enforcement is not a substitute.

import { z } from "zod";

export const lineItemSchema = z.object({
  description: z.string(),
  quantity: z.number().nullable(),
  unitPriceMinor: z.number().int().nullable(),
  amountMinor: z.number().int(),
});

export const extractionResultSchema = z.object({
  merchant: z.string().nullable(),
  // ISO 8601 date string (YYYY-MM-DD), or null if not legible.
  purchaseDate: z.string().nullable(),
  // ISO 4217 currency code (e.g. NGN, USD), or null if not determinable.
  currency: z.string().length(3).nullable(),
  // Total in minor units (kobo, cents) as an integer — never a decimal.
  totalMinor: z.number().int().nullable(),
  lineItems: z.array(lineItemSchema),
});

export type ExtractionResultData = z.infer<typeof extractionResultSchema>;

// Gemini's responseSchema uses an OpenAPI-subset format, not Zod directly —
// this is hand-written to match extractionResultSchema above field for
// field. If one changes, the other must too.
export const GEMINI_EXTRACTION_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    merchant: { type: "string", nullable: true },
    purchaseDate: {
      type: "string",
      nullable: true,
      description: "ISO 8601 date, e.g. 2026-09-15. Null if not legible.",
    },
    currency: {
      type: "string",
      nullable: true,
      description: "ISO 4217 currency code, e.g. NGN, USD. Null if not determinable.",
    },
    totalMinor: {
      type: "integer",
      nullable: true,
      description: "Total amount in minor units (e.g. kobo, cents), never a decimal.",
    },
    lineItems: {
      type: "array",
      items: {
        type: "object",
        properties: {
          description: { type: "string" },
          quantity: { type: "number", nullable: true },
          unitPriceMinor: { type: "integer", nullable: true },
          amountMinor: { type: "integer" },
        },
        required: ["description", "amountMinor"],
      },
    },
  },
  required: ["lineItems"],
} as const;
