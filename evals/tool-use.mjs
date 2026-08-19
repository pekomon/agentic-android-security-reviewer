import { runManifestReview } from "../src/agent.mjs";

const manifest = `
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application android:debuggable="true" />
</manifest>
`;

const result = await runManifestReview(manifest);

const inspectManifestCalls = result.newItems.filter(
    item =>
        item.type === "tool_call_item" &&
        item.toolName === "inspect_manifest"
);

if (inspectManifestCalls.length === 1) {
    console.log("PASS: Agent used inspect_manifest tool");
} else {
    console.log("FAIL: Agent DID NOT use inspect_manifest tool");
    process.exitCode = 1;
}
