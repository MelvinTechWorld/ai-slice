// lib/validation/upload.ts
//
// Declared once, imported by both the client form and the server route,
// per AGENTS.md code standards: "Validation rules are declared once... and
// imported by both client and server. Never duplicate a rule in two places."

import { z } from "zod";
import { AI_CONFIG } from "@/lib/ai/config";

export const uploadFileSchema = z.object({
    filename: z.string().min(1).max(255),
    mimeType: z.enum(
        AI_CONFIG.uploads.allowedMimeTypes as unknown as [string, ...string[]]
    ),
    sizeBytes: z
        .number()
        .int()
        .positive()
        .max(
            AI_CONFIG.uploads.maxBytes,
            `File exceeds the ${AI_CONFIG.uploads.maxBytes / (1024 * 1024)}MB limit`
        ),
});

export type UploadFileInput = z.infer<typeof uploadFileSchema>;