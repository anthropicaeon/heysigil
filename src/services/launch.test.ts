import { describe, expect, test } from "bun:test";
import { buildDeployParams, parseDevLinks } from "./launch.js";

describe("buildDeployParams", () => {
    test("defaults to third-party routing with parsed dev links", () => {
        const parsed = parseDevLinks({
            devLinks: ["https://github.com/heysigil/heysigil"],
        });
        if (!parsed.success) {
            throw new Error(parsed.error);
        }

        const params = buildDeployParams(parsed);
        expect(params.isSelfLaunch).toBe(false);
        expect(params.devLinks).toEqual(["https://github.com/heysigil/heysigil"]);
        expect(params.devAddress).toBeUndefined();
    });

    test("allows explicit quick/unclaimed routing overrides", () => {
        const parsed = parseDevLinks({
            devLinks: ["https://github.com/heysigil/heysigil"],
        });
        if (!parsed.success) {
            throw new Error(parsed.error);
        }

        const params = buildDeployParams(parsed, {
            isSelfLaunch: true,
            devAddress: "0x1111111111111111111111111111111111111111",
            devLinks: ["agent://sigilbot-default"],
        });

        expect(params.isSelfLaunch).toBe(true);
        expect(params.devAddress).toBe("0x1111111111111111111111111111111111111111");
        expect(params.devLinks).toEqual(["agent://sigilbot-default"]);
    });
});
