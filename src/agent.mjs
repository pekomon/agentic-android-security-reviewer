import { Agent, run} from "@openai/agents";
import { z } from "zod";

// First guess of what output will look like 
// This may later
const Finding = z.object({
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

const SecurityReview = z.object({
    findings: z.array(Finding)
});

const agent = new Agent({
    name: "Android Security Reviewer",
    instructions: `
    You review AndroidManifest.xml files for security-relevant configuration.
    Rules:
    - Report only findings supported by evidence in the supplied manifest
    - Do not invent missing configuration
    - Distinguish confirmed vulnerabilities from potential risks
    - Do not report unknown, unsupported, or non-standard attributes merely because they are unfamiliar.
    - Report a configuration only when its security relevance can be established from known Android platform semantics or supplied evidence.
    - Use OTHER only when no defined category fits
    - If there are no relevant findings, return an empty array
    `,
    outputType: SecurityReview
});


export async function reviewManifest(manifest) {
    const result = await run(
        agent,
        `Review this AndroidManifest.xml: ${manifest}`
    );

    return result.finalOutput;
}
