import { Octokit } from "@octokit/core";
import { cache } from "../src/index.ts";
import { RequestError } from "@octokit/request-error";

function testPlugin(octokit: Octokit) {
    octokit.hook.wrap("request", async (_, options) => {
        await new Promise((resolve) => setTimeout(resolve, 0));

        options.request.assertRequest(options);

        const res = options.request.response;
        if (res.status >= 300) {
            const message = res.data.message != null ? res.data.message : `Test failed request (${res.status})`;
            const error = new RequestError(message, res.status, {
                request: options,
            });
            throw error;
        } else {
            return res;
        }
    });

    return {};
}

export const TestOctokit = Octokit.plugin(testPlugin, cache);
