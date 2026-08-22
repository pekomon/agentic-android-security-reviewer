import test from "node:test";
import assert from "node:assert/strict";

import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";


test("MCP server exposes inspect_manifest and returns manifest facts", async () => {
    const transport = new StdioClientTransport({
        command: "node",
        args: ["mcp/server.mjs"]
    });

    const client = new Client({
        name: "android-security-test-client",
        version: "0.1.0"
    });

    try {
        await client.connect(transport);

        const tools = await client.listTools();

        assert.ok(
            tools.tools.some(tool => tool.name === "inspect_manifest")
        );

        const result = await client.callTool({
            name: "inspect_manifest",
            arguments: {
                manifestXml: `
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application android:debuggable="true">
        <activity
            android:name=".MainActivity"
            android:exported="true" />
    </application>
</manifest>
`
            }
        });

        assert.deepEqual(result.structuredContent, {
            application: {
                debuggable: true,
                usesCleartextTraffic: null
            },
            components: [
                {
                    type: "ACTIVITY",
                    name: ".MainActivity",
                    exported: true,
                    permission: null,
                    intentFilters: []
                }
            ],
            permissions: []
        });
    } finally {
        await client.close();
    }
});
 