import { EndpointDefaults } from "@octokit/types";
import assert from "node:assert";
import { describe, it } from "node:test";
import { TestOctokit } from "./octokit";

describe("Cache plugin", () => {
    it("should cache responses", async () => {
        const octokit = new TestOctokit();

        const etag = "etag-1234";

        const result = await octokit.request("GET /versions", {
            request: {
                assertRequest: (request: EndpointDefaults) => {
                    assert.equal(request.headers["if-not-modified"], undefined);
                },
                response: { status: 200, headers: { etag: etag }, data: { message: "Success!" } },
            },
        });

        assert.deepStrictEqual(result.data, { message: "Success!" });

        const cached = await octokit.request("GET /versions", {
            request: {
                assertRequest: (request: EndpointDefaults) => {
                    assert.equal(request.headers["if-none-match"], etag);
                },
                response: { status: 304, headers: { etag: etag }, data: {} },
            },
        });

        assert.deepStrictEqual(cached.data, result.data);
    });

    it("can be disabled", async () => {
        const octokit = new TestOctokit({
            cache: {
                enabled: false,
            },
        });

        const etag = "etag-1234";

        await assert.doesNotReject(
            octokit.request("GET /versions", {
                request: {
                    assertRequest: (request: EndpointDefaults) => {
                        assert.equal(request.headers["if-not-modified"], undefined);
                    },
                    response: { status: 200, headers: { etag: etag }, data: { message: "Success!" } },
                },
            }),
        );

        await assert.rejects(
            octokit.request("GET /versions", {
                request: {
                    assertRequest: (request: EndpointDefaults) => {
                        assert.equal(request.headers["if-none-match"], etag);
                    },
                    response: { status: 304, headers: { etag: etag }, data: {} },
                },
            }),
        );
    });
});
