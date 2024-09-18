import type { EndpointDefaults, OctokitResponse } from "@octokit/types";
import type { State } from "./types.js";
import { endpoint } from "@octokit/endpoint";
import { RequestError } from "@octokit/request-error";

export function calculateCacheKey(options: Required<EndpointDefaults>): string {
    // todo: is there a better way to calculate this?
    return endpoint(options).url;
}

export async function wrapRequest(
    state: State,
    request: (
        options: Required<EndpointDefaults>,
    ) => OctokitResponse<any, number> | Promise<OctokitResponse<any, number>>,
    options: Required<EndpointDefaults>,
) {
    // we can only cache get requests
    if (options.method !== "GET") return await request(options);

    const cacheKey = calculateCacheKey(options);

    const cachedResponse = state.cache.get(cacheKey);

    if (cachedResponse !== undefined) {
        if (cachedResponse.headers.etag) {
            options.headers["if-none-match"] = cachedResponse.headers.etag;
        }
        if (cachedResponse.headers["last-modified"]) {
            options.headers["if-modified-since"] = cachedResponse.headers["last-modified"];
        }
    }

    try {
        const response = await request(options);

        // we can only cache http 200 right now
        if (response.status === 200) {
            state.cache.set(cacheKey, response);
        }

        return response;
    } catch (e) {
        if (e instanceof RequestError && e.status === 304 && cachedResponse !== undefined) return cachedResponse;

        throw e;
    }
}
