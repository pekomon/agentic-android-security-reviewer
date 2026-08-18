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
