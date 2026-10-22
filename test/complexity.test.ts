import { describe, expect, it } from "vitest";
import { ComplexityDetail } from "../src/complexity-detail.js";
import { ComplexityResult } from "../src/complexity-result.js";
import { getCodeComplexity } from "../src/complexity.js";
import { InvalidFixture, invalidFixtures, ValidFixture, validFixtures } from "./fixtures.js";

describe("analyzeFunction", () => {
    it.each(validFixtures)("scores $name", (fixture: ValidFixture) => {
        const result: ComplexityResult = getCodeComplexity(fixture.code);

        expect(result).toEqual(ComplexityResult.success(fixture.expectedTotal, fixture.expectedDetails));
    });

    it.each(validFixtures)("total equals the sum of details for $name", (fixture: ValidFixture) => {
        const result: ComplexityResult = getCodeComplexity(fixture.code);
        if (!result.ok) {
            throw new Error(result.error);
        }
        const sum: number = result.details.reduce((acc: number, d: ComplexityDetail): number => acc + d.complexity, 0);

        expect(result.total).toBe(sum);
    });

    it.each(invalidFixtures)("rejects $name", (fixture: InvalidFixture) => {
        const result: ComplexityResult = getCodeComplexity(fixture.code);

        expect(result.ok).toBe(false);
        expect(result.error).toContain(fixture.expectedError);
    });
});
