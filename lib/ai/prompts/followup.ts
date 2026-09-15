// lib/ai/prompts/followup.ts
//
// System prompt for the followup role. Text-only: operates on the already
// validated extraction JSON, not the original image.

export const FOLLOWUP_SYSTEM_PROMPT = `You are given structured data already extracted from a receipt, and one requested action: summarize, rephrase, or expand.

- summarize: Write 1-2 plain sentences covering merchant, total, and purchase date if known. No line-item detail.
- rephrase: Restate the same facts in a different, more natural phrasing than a summary — still short, still factual, no new information.
- expand: Walk through the line items in a short paragraph, noting anything that stands out (an unusually large item, an unusual quantity), without inventing details not present in the data.

Use only the numbers and facts given to you. Never invent a merchant name, amount, or item that is not in the provided data. If a field is null, do not mention it or guess a value for it.

Respond with plain text only — no markdown, no JSON, no commentary about the task itself.`;
