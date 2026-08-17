import { reviewManifest } from "../src/agent.mjs";

const cases = [
    {
        name: "Clean manifest produces no findings",
        manifest: `
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application
        android:debuggable="false"
        android:usesCleartextTraffic="false">
    </application>
</manifest>
`,
        expectedFindingsCount: 0,
    },

    {
        name: "Unknown attribute does not produce a finding",
        manifest: `
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application
        android:debuggable="false"
        android:usesCleartextTraffic="false"
        android:doSomethingFishy="true">
    </application>
</manifest>
`,
        expectedFindingsCount: 0,
    },

    {
        name: "Debuggable application produces a finding",
        manifest: `
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application android:debuggable="true">
    </application>
</manifest>
`,
        expectedCategory: "DEBUG_CONFIGURATION",
    },

    {
        name: "Cleartext traffic produces a finding",
        manifest: `
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application android:usesCleartextTraffic="true">
    </application>
</manifest>
`,
        expectedCategory: "CLEARTEXT_TRAFFIC",
    },
];

let failures = 0;

for (const testCase of cases) {
    const result = await reviewManifest(testCase.manifest);

    let passed = true;

    if (testCase.expectedFindingsCount !== undefined &&
        result.findings.length !== testCase.expectedFindingsCount
    ) {
        passed = false
    }

    if (testCase.expectedCategory !== undefined &&
        !result.findings.some(
            finding => finding.category === testCase.expectedCategory
        )
    ) {
        passed = false;
    }

    if (passed) {
        console.log(`PASS: ${testCase.name}`);
    } else {
        console.log(`FAIL: ${testCase.name}`);
        console.dir(result, { depth: null});
    }
}

if (failures > 0) {
    process.exitCode = 1
}