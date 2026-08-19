import { tool } from "@openai/agents";
import { z } from "zod";

import { parseManifest } from "./manifest-parser.mjs";
import { ManifestFacts } from "./manifest-facts.mjs"; 

export const inspectManifestTool = tool({
    name: "inspect_manifest",
    description: "Parse AndroidManifest.xml document and return deterministic manifest facts. " + 
        "Use this tool before reasoning about manifest security",
    parameters: z.object({
        manifestXml: z.string()
    }),
    outputSchema: ManifestFacts,

    async execute({ manifestXml }) {
        return parseManifest(manifestXml)
    }

})