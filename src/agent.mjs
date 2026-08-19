import { Agent, run} from "@openai/agents";
import { z } from "zod";

import { inspectManifestTool } from "./manifest-tool.mjs";

// First guess of what output will look like 
// This may later change
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
    You review AndroidManifest.xml files for security-relevant risks and vulnerabilities.

    Always use the inspect_manifest tool to obtain manifest facts before performing security analysis.

    Base findings on the facts returned by the tool rather than parsing or interpreting the XML directly.

    Rules:
    - Report only configurations that represent a vulnerability, a potential security risk, or otherwise require security review.
    - Do not report secure or recommended configuration as informational findings.
    - Report only findings supported by evidence in the supplied manifest
    - Do not invent missing configuration
    - Distinguish confirmed vulnerabilities from potential risks
    - Do not report unknown, unsupported, or non-standard attributes merely because they are unfamiliar.
    - Report a configuration only when its security relevance can be established from known Android platform semantics or supplied evidence.
    - Use OTHER only when no defined category fits
    - If there are no relevant findings, return an empty array

    Permission rules:
    - Do not report a permission merely because it grants access to a capability.
    - Common permissions such as INTERNET or CAMERA are not findings by themselves.
    - Report a permission only when the permission declaration itself is unusually broad,
    security-sensitive in a way that requires review, or other supplied evidence establishes a risk.
    - Treat QUERY_ALL_PACKAGES as requiring review because it grants broad package visibility.
    `,
    tools: [inspectManifestTool],
    outputType: SecurityReview
});

export async function runManifestReview(manifest) {
    return run(
        agent,
        `Review this AndroidManifest.xml: ${manifest}`
    )
}

export async function reviewManifest(manifest) {
    const result = await runManifestReview(manifest)
    return result.finalOutput;
}
