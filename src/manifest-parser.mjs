import { XMLParser } from "fast-xml-parser";
import { ManifestFacts } from "./manifest-facts.mjs";
import { parse } from "dotenv";

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

export function parseManifest(manifestXml) {
    const parsed = xmlParser.parse(manifestXml)

    const application = parsed.manifest.application ?? {};

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
        components: [],
        permissions
    }

    return ManifestFacts.parse(facts)
}

//
// For testing purposes
//

const manifest = `
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <application
        android:debuggable="true"
        android:usesCleartextTraffic="false">

        <activity
            android:name=".MainActivity"
            android:exported="true" />
    </application>
</manifest>
`;

const result = parseManifest(manifest);
console.dir(result, { depth: null });
