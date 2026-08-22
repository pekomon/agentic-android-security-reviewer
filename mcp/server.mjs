import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";

import { parseManifest } from "../src/manifest-parser.mjs";
import { ManifestFacts } from "../src/manifest-facts.mjs";

function createServer() {
    const server = new McpServer({
        name: "android-security",
        version: "0.1.0"
    });

    server.registerTool(
        "inspect_manifest",
        {
            title: "Inspect Android Manifest",
            description: "Parse an AndroidManifest.xml document and return deterministic manifest facts.",
            inputSchema: z.object({
                manifestXml: z.string()
            }),
            outputSchema: ManifestFacts
        },
        async ({ manifestXml }) => {
            const facts = parseManifest(manifestXml);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(facts)
                    }
                ],
                structuredContent: facts
            };
        }
    )
    return server;
}

void serveStdio(createServer);