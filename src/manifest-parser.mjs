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

function parseIntentData(intentFilter) {
    return asArray(intentFilter.data).map(data => ({
        scheme: data["android:scheme"] ?? null,
        host: data["android:host"] ?? null,
        path: data["android:path"] ?? null,
        pathPrefix: data["android:pathPrefix"] ?? null,
        pathPattern: data["android:pathPattern"] ?? null,
        mimeType: data["android:mimeType"] ?? null,
    }));
}

function parseIntentFilters(component) {
    return asArray(component["intent-filter"]).map(intentFilter => ({
        actions: asArray(intentFilter.action).map(
            action => action["android:name"]
        ),
        categories: asArray(intentFilter.category).map(
            category => category["android:name"]
        ),
        data: parseIntentData(intentFilter)
    }))
}

function parseComponents(application, xmlName, type) {
    return asArray(application[xmlName]).map(component => ({
        type,
        name: component["android:name"],
        exported: parseBoolean(component["android:exported"]),
        permission: component["android:permission"] ?? null,
        intentFilters: parseIntentFilters(component)
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
