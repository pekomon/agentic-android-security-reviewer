import { z } from "zod";

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
            permission: z.string().nullable()
        })
    ),

    permissions: z.array(z.string())

})
