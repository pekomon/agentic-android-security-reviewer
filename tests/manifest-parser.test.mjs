import test from "node:test";
import assert from "node:assert/strict";

import { parseManifest } from "../src/manifest-parser.mjs";

test("parses application security flags", () => {
    const manifest = `
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application
        android:debuggable="true"
        android:usesCleartextTraffic="false" />
</manifest>
    `

    const result = parseManifest(manifest)

    assert.equal(result.application.debuggable, true)
    assert.equal(result.application.usesCleartextTraffic, false)
});

test("uses null when application security flags are missing", () => {
    const manifest = `
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application />
</manifest>
`;

    const result = parseManifest(manifest);

    assert.equal(result.application.debuggable, null);
    assert.equal(result.application.usesCleartextTraffic, null);
});


test("parses no permissions", () => {
    const manifest = `
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application />
</manifest>
`;

    const result = parseManifest(manifest);

    assert.deepEqual(result.permissions, []);
});


test("parses one permission", () => {
    const manifest = `
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />

    <application />
</manifest>
`;

    const result = parseManifest(manifest);

    assert.deepEqual(
        result.permissions,
        ["android.permission.INTERNET"]
    );
});


test("parses multiple permissions", () => {
    const manifest = `
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />

    <application />
</manifest>
`;

    const result = parseManifest(manifest);

    assert.deepEqual(
        result.permissions,
        [
            "android.permission.INTERNET",
            "android.permission.CAMERA"
        ]
    );
});


test("parses multiple activities", () => {
    const manifest = `
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application>
        <activity
            android:name=".MainActivity"
            android:exported="true" />

        <activity
            android:name=".InternalActivity"
            android:exported="false" />
    </application>
</manifest>
`;

    const result = parseManifest(manifest);

    assert.deepEqual(
        result.components,
        [
            {
                type: "ACTIVITY",
                name: ".MainActivity",
                exported: true,
                permission: null,
                intentFilters: []
            },
            {
                type: "ACTIVITY",
                name: ".InternalActivity",
                exported: false,
                permission: null,
                intentFilters: []
            }
        ]
    );
});


test("parses all supported component types", () => {
    const manifest = `
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application>
        <activity
            android:name=".MainActivity"
            android:exported="true" />

        <service
            android:name=".SyncService"
            android:exported="true" />

        <receiver
            android:name=".BootReceiver"
            android:exported="false" />

        <provider
            android:name=".DataProvider"
            android:exported="false" />
    </application>
</manifest>
`;

    const result = parseManifest(manifest);

    assert.deepEqual(
        result.components.map(component => component.type),
        [
            "ACTIVITY",
            "SERVICE",
            "RECEIVER",
            "PROVIDER"
        ]
    );
});


test("uses null when component exported attribute is missing", () => {
    const manifest = `
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application>
        <receiver android:name=".BootReceiver" />
    </application>
</manifest>
`;

    const result = parseManifest(manifest);

    assert.equal(result.components.length, 1);
    assert.equal(result.components[0].exported, null);
});


test("parses component permission", () => {
    const manifest = `
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application>
        <service
            android:name=".SensitiveService"
            android:exported="true"
            android:permission="com.example.permission.ACCESS_SENSITIVE" />
    </application>
</manifest>
`;

    const result = parseManifest(manifest);

    assert.equal(
        result.components[0].permission,
        "com.example.permission.ACCESS_SENSITIVE"
    );
});


test("returns empty components for empty application", () => {
    const manifest = `
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application />
</manifest>
`;

    const result = parseManifest(manifest);

    assert.deepEqual(result.components, []);
});

test("parses intent filters", () => {
    const manifest = `
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application>
        <activity
            android:name=".DeepLinkActivity"
            android:exported="true">

            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`;

    const result = parseManifest(manifest);

    assert.deepEqual(
        result.components[0].intentFilters,
        [
            {
                actions: [
                    "android.intent.action.VIEW"
                ],
                categories: [
                    "android.intent.category.DEFAULT",
                    "android.intent.category.BROWSABLE"
                ]
            }
        ]
    );
});