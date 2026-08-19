import { z } from "zod";

export const Finding = z.object({
    category: z.enum([
        "EXPORTED_COMPONENT",
        "DEBUG_CONFIGURATION",
        "CLEARTEXT_TRAFFIC",
        "PERMISSION",
        "APPLICATION_CONFIGURATION",
        "OTHER"
    ]),
    severity: z.enum([
        "INFO",
        "LOW",
        "MEDIUM",
        "HIGH",
        "CRITICAL"
    ]),
    classification: z.enum([
        "VULNERABILITY",
        "POTENTIAL_RISK",
        "INFORMATIONAL"
    ]),

    title: z.string(),
    description: z.string(),
    evidence: z.string(),
    recommendation: z.string(),
    confidence: z.number().min(0).max(1)
});

export const SecurityReview = z.object({
    findings: z.array(Finding)
});