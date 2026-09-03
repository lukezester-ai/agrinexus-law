import { afterEach, describe, expect, it } from "vitest";
import { isCronAuthorized } from "./cron-auth";

const originalSecret = process.env.CRON_SECRET;

afterEach(() => {
	if (originalSecret === undefined) delete process.env.CRON_SECRET;
	else process.env.CRON_SECRET = originalSecret;
});

describe("isCronAuthorized", () => {
	it("fails closed when CRON_SECRET is missing", () => {
		delete process.env.CRON_SECRET;
		expect(isCronAuthorized(new Request("https://example.test"))).toBe(false);
	});

	it("rejects an invalid bearer token", () => {
		process.env.CRON_SECRET = "expected-secret";
		const request = new Request("https://example.test", {
			headers: { authorization: "Bearer wrong-secret" },
		});
		expect(isCronAuthorized(request)).toBe(false);
	});

	it("accepts the configured bearer token", () => {
		process.env.CRON_SECRET = "expected-secret";
		const request = new Request("https://example.test", {
			headers: { authorization: "Bearer expected-secret" },
		});
		expect(isCronAuthorized(request)).toBe(true);
	});
});
