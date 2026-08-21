import { z } from "zod";

const IntentDataFacts = z.object({
    scheme: z.string().nullable(),
    host: z.string().nullable(),
    path: z.string().nullable(),
    pathPrefix: z.string().nullable(),
    pathPattern: z.string().nullable(),
    mimeType: z.string().nullable(),
})

const IntentFilterFacts = z.object({
    actions: z.array(z.string()),
    categories: z.array(z.string()),
    data: z.array(IntentDataFacts)
})

export const ManifestFacts = z.object({
    application: z.object({
        debuggable: z.boolean().nullable(),
        usesCleartextTraffic: z.boolean().nullable()
    }),

    components: z.array(
        z.object({
            type: z.enum([
                "ACTIVITY",
                "SERVICE",
                "RECEIVER",
                "PROVIDER"
            ]),
            name: z.string(),
            exported: z.boolean().nullable(),
            permission: z.string().nullable(),
            intentFilters: z.array(IntentFilterFacts)
        })
    ),

    permissions: z.array(z.string())

})
