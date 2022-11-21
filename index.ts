import { ZodError } from "zod";
import { Environment, ReceivedBody, ReceivedBodySchema, StatsObject, StatsObjectSchema } from "./types";

const KV_STATS = '{"totalGuilds":2,"totalChannels":111,"totalMembers":129179,"totalStatsSent":3,"lastUpdated":{"date":"Sun, 11 Sep 2022 10:19:53 GMT","timestampMilliseconds":1662891593340,"timestampSeconds":1662891593}}';

export default {
    async fetch(request: Request, env: Environment): Promise<Response> {

        if (request.method === "POST") {

            // IF API-KEY is not correct, return
            if (request.headers.get("API-KEY") !== env.API_KEY) {
                return new Response("No valid 'API-KEY' in request headers.", { status: 401 });
            }

            // Validate the received data with zod against ReceivedBodySchema. If the validation fails, return the zod errors as the response
            let receivedBody: ReceivedBody;
            try {
                const parsedJson = await request.json().catch(() => ({}));
                receivedBody = ReceivedBodySchema.parse(parsedJson);
            } catch (err) {
                if (err instanceof ZodError) return Response.json({ note: "Received this ZodError.", ...err.format() }, { status: 400 });
                return new Response(err.message);
            }

            // At least totalGuilds, totalChannels, totalMembers are guaranteed to be present and numbers
            const { totalGuilds, totalChannels, totalMembers, incrementTotalStatsSent } = receivedBody;

            // Get the KV STATS object and edit it accordingly, before .put()ing it back
            const statsObject: StatsObject = await env.DATA_KV.get("STATS", { type: "json" });
            try {
                StatsObjectSchema.parse(statsObject);
            } catch (err) {
                return Response.json({ note: "KV statsObject doesn't match schema. Not updating KV. Received this ZodError.", ...err.format() }, { status: 500 });
            }

            // Update totalGuilds, totalChannels, totalMembers
            statsObject.totalGuilds = totalGuilds;
            statsObject.totalChannels = totalChannels;
            statsObject.totalMembers = totalMembers;

            // Increment total and specific game and language. Only increment game/language if defined
            if (incrementTotalStatsSent === true) statsObject.totalStatsSent++;

            // Add lastUpdated to the object
            const date = new Date();
            statsObject.lastUpdated = { date: date.toUTCString(), timestampMilliseconds: date.valueOf(), timestampSeconds: Math.floor(date.valueOf() / 1000) };

            // .put() the edited object
            await env.DATA_KV.put("STATS", JSON.stringify(statsObject));

            return Response.json(({ message: "Data posted to KV.", statsObject }));

        } else if (request.method === "GET") {
            const statsObject: string = await env.DATA_KV.get("STATS");
            return new Response(statsObject, {
                headers: { "Content-Type": "application/json" }
            });
        }

        return new Response("Not found.", { status: 404 });
    }
}