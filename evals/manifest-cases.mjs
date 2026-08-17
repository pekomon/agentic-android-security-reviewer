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

    {
        name: "Exported activity is reported as a potential risk",

        manifest: `
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application>
        <activity
            android:name=".PublicActivity"
            android:exported="true" />
    </application>
</manifest>
`,

        expectedCategory: "EXPORTED_COMPONENT",
        expectedClassification: "POTENTIAL_RISK"
    },

    {
        name: "Non-exported activity does not produce an exported component finding",

        manifest: `
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application>
        <activity
            android:name=".InternalActivity"
            android:exported="false" />
    </application>
</manifest>
`,

        expectedFindingsCount: 0
    },

    {
        name: "Internet permission alone does not produce a finding",

        manifest: `
    <manifest xmlns:android="http://schemas.android.com/apk/res/android">
        <uses-permission android:name="android.permission.INTERNET" />

        <application>
        </application>
    </manifest>
    `,

        expectedFindingsCount: 0
    },

    {
        name: "Requesting broad package visibility is reported",

        manifest: `
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.QUERY_ALL_PACKAGES" />

    <application>
    </application>
</manifest>
`,

        expectedCategory: "PERMISSION"
    },

    {
        name: "Camera permission alone does not produce a finding",

        manifest: `
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.CAMERA" />

    <application>
    </application>
</manifest>
`,

        expectedFindingsCount: 0
    },
];

let failures = 0;

for (const testCase of cases) {
    const result = await reviewManifest(testCase.manifest);

    let passed = true;

    // First check expected number of findings
    if (testCase.expectedFindingsCount !== undefined &&
        result.findings.length !== testCase.expectedFindingsCount
    ) {
        passed = false
    }

    // Next check Category and classification
    // - These must belong to same finding
    if (testCase.expectedCategory !== undefined) {
        const matchingFinding = result.findings.find(
            finding =>
                finding.category === testCase.expectedCategory &&
                (
                    testCase.expectedClassification === undefined ||
                    finding.classification === testCase.expectedClassification
                )
        );

        if (!matchingFinding) {
            passed = false;
        }
    }

    //

    //

    if (passed) {
        console.log(`PASS: ${testCase.name}`);
    } else {
        failures++;
        console.log(`FAIL: ${testCase.name}`);
        console.dir(result, { depth: null });
    }
}

if (failures > 0) {
    process.exitCode = 1
}