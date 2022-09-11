import { z } from "zod";

export type Environment = {
    DATA_KV: KVNamespace,
    API_KEY: string
};

export type ReceivedBody = z.infer<typeof ReceivedBodySchema>;
export const ReceivedBodySchema = z.object({
    totalGuilds: z.number().int(),
    totalChannels: z.number().int(),
    totalMembers: z.number().int(),
    incrementTotalStatsSent: z.boolean().optional()
});

export type StatsObject = z.infer<typeof StatsObjectSchema>;
export const StatsObjectSchema = z.object({
    totalGuilds: z.number().int(),
    totalChannels: z.number().int(),
    totalMembers: z.number().int(),
    totalStatsSent: z.number().int(),
    lastUpdated: z.object({
        date: z.string(),
        timestampMilliseconds: z.number().int(),
        timestampSeconds: z.number().int()
    })
});