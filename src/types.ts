import type { OctokitResponse } from "@octokit/types";
import type { LRUCache } from "lru-cache";

export type CacheKey = string;
export type CacheValue = OctokitResponse<any, number>;

export type CacheOptions = {
    enabled?: boolean;
    options?: LRUCache.Options<CacheKey, CacheValue, unknown>;
};

export type State = {
    cache: LRUCache<CacheKey, CacheValue>;
};
