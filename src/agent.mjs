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
    You review AndroidManifet.xml files for security-relevant configuration.
    Rules:
    - Report only findings supported by by evidence in the supplies manifest
    - Do not invent missing configuration
    - Distinguish confirmed vulnerabilities from potential risks
    - Do not report unknown, unsupported, or non-standard attributes merely because they are unfamiliar.
    - Report a configuration only when its security relevance can be established from known Android platform semantics or supplied evidence.
    - Use OTHER only when no defined category fits
    - If there are no relevant findings, return an empty array
    `,
    outputType: SecurityReview
});

const manifest1 = `
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application
        android:debuggable="true"
        android:usesCleartextTraffic="true">
    </application>
</manifest>
`;

const result = await run(
    agent,
    `Review this AndroidManifest: ${manifest1}`
);

console.dir(result.finalOutput, { depth: null });