import type { OctokitOptions } from "@octokit/core";
import { Octokit } from "@octokit/core";
import { LRUCache } from "lru-cache";
import type { CacheKey, CacheOptions, CacheValue, State } from "./types.js";
import { wrapRequest } from "./wrap-request.js";

export const cache = (octokit: Octokit, octokitOptions: OctokitOptions) => {
    const {
        enabled = true,
        options = {
            max: 1024,
            ttl: 1000 * 60 * 60 * 6,
            maxEntrySize: 1024 * 16,
            sizeCalculation: (value: CacheValue) => {
                const contentLengthHeader = value.headers["content-length"];
                if (contentLengthHeader === undefined) return 1;

                // the content-length header is typed as a number but really it's a string
                return parseInt(contentLengthHeader.toString());
            },
        },
    } = octokitOptions.cache || {};

    if (!enabled) {
        return {};
    }

    const state: State = {
        cache: new LRUCache<CacheKey, CacheValue>(options),
    };

    octokit.hook.wrap("request", wrapRequest.bind(null, state));

    return {};
};

declare module "@octokit/core" {
    interface OctokitOptions {
        cache?: CacheOptions;
    }
}
