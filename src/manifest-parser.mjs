import { XMLParser } from "fast-xml-parser";
import { ManifestFacts } from "./manifest-facts.mjs";

const xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: ""
});

function asArray(value) {
    if (value === undefined) {
        return []
    }

    return Array.isArray(value) ? value : [value]
}

function parseBoolean(value) {
    if (value === undefined) {
        return null;
    }

    return value === "true"
}


function parseComponents(application, xmlName, type) {
    return asArray(application[xmlName]).map(component => ({
        type,
        name: component["android:name"],
        exported: parseBoolean(component["android:exported"]),
        permission: component["android:permission"] ?? null
    }));
}

export function parseManifest(manifestXml) {
    const parsed = xmlParser.parse(manifestXml)

    const application = parsed.manifest.application ?? {};

    const components = [
        ...parseComponents(application, "activity", "ACTIVITY"),
        ...parseComponents(application, "service", "SERVICE"),
        ...parseComponents(application, "receiver", "RECEIVER"),
        ...parseComponents(application, "provider", "PROVIDER"),
    ];

    const permissionElements = asArray(
        parsed.manifest["uses-permission"]
    );

    const permissions = permissionElements.map(
        permission => permission["android:name"]
    )

    const facts = {
        application: {
            debuggable: parseBoolean(application["android:debuggable"]),
            usesCleartextTraffic: parseBoolean(application["android:usesCleartextTraffic"])
        },
        components,
        permissions
    }

    return ManifestFacts.parse(facts)
}

//
// For testing purposes
//

const manifest = `
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <application>
        <activity
            android:name=".MainActivity"
            android:exported="true" />

        <activity
            android:name=".InternalActivity"
            android:exported="false" />

        <service
            android:name=".SyncService"
            android:exported="true"
            android:permission="com.example.SYNC" />

        <receiver
            android:name=".BootReceiver" />

        <provider
            android:name=".DataProvider"
            android:exported="false" />
    </application>

</manifest>
</manifest>
`;

const result = parseManifest(manifest);
console.dir(result, { depth: null });
