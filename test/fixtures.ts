import { ComplexityDetail } from "../src/complexity-detail.js";

/** A snippet whose complexity is known from tsmetrics-core's default configuration. */
export interface ValidFixture {
    readonly name: string;
    readonly code: string;
    readonly expectedTotal: number;
    readonly expectedDetails: readonly ComplexityDetail[];
}

/** A snippet that must be rejected, with text the error message must contain. */
export interface InvalidFixture {
    readonly name: string;
    readonly code: string;
    readonly expectedError: string;
}

// Every default increment that applies to these snippets is 1.
const detail = (startLine: number, endLine: number, description: string): ComplexityDetail => ({
    startLine,
    endLine,
    complexity: 1,
    description,
});

const lines = (...source: string[]): string => source.join("\n");

const NOT_SINGLE_FUNCTION: string = "exactly one function";

/** Shared by unit and acceptance tests so expected scores are defined once. */
export const validFixtures: readonly ValidFixture[] = [
    {
        name: "trivial function (arithmetic operators do not count)",
        code: lines("function add(a: number, b: number): number {", "  return a + b;", "}"),
        expectedTotal: 2,
        expectedDetails: [detail(1, 3, "Function declaration"), detail(2, 2, "Return statement")],
    },
    {
        name: "single if",
        code: lines(
            "function sign(x: number): number {",
            "  if (x < 0) {",
            "    return -1;",
            "  }",
            "  return 1;",
            "}",
        ),
        expectedTotal: 4,
        expectedDetails: [
            detail(1, 6, "Function declaration"),
            detail(2, 4, "If statement"),
            detail(3, 3, "Return statement"),
            detail(5, 5, "Return statement"),
        ],
    },
    {
        name: "if with else (else adds nothing extra)",
        code: lines(
            "function parity(n: number): string {",
            "  if (n % 2 === 0) {",
            '    return "even";',
            "  } else {",
            '    return "odd";',
            "  }",
            "}",
        ),
        expectedTotal: 4,
        expectedDetails: [
            detail(1, 7, "Function declaration"),
            detail(2, 6, "If with else statement"),
            detail(3, 3, "Return statement"),
            detail(5, 5, "Return statement"),
        ],
    },
    {
        name: "for loop",
        code: lines(
            "function sum(values: number[]): number {",
            "  let total: number = 0;",
            "  for (let i: number = 0; i < values.length; i++) {",
            "    total += values[i];",
            "  }",
            "  return total;",
            "}",
        ),
        expectedTotal: 3,
        expectedDetails: [
            detail(1, 7, "Function declaration"),
            detail(3, 5, "For statement"),
            detail(6, 6, "Return statement"),
        ],
    },
    {
        name: "if with continue nested in for-of",
        code: lines(
            "function countPositive(values: number[]): number {",
            "  let count: number = 0;",
            "  for (const value of values) {",
            "    if (value <= 0) {",
            "      continue;",
            "    }",
            "    count++;",
            "  }",
            "  return count;",
            "}",
        ),
        expectedTotal: 5,
        expectedDetails: [
            detail(1, 10, "Function declaration"),
            detail(3, 8, "For of statement"),
            detail(4, 6, "If statement"),
            detail(5, 5, "Continue statement"),
            detail(9, 9, "Return statement"),
        ],
    },
    {
        name: "arrow function with ternary",
        code: "const abs = (x: number): number => (x < 0 ? -x : x);",
        expectedTotal: 2,
        expectedDetails: [detail(1, 1, "Arrow function"), detail(1, 1, "Conditional expression")],
    },
    {
        name: "logical operators",
        code: lines(
            "function inRange(x: number, min: number, max: number): boolean {",
            "  return (x >= min && x <= max) || x === 0;",
            "}",
        ),
        expectedTotal: 4,
        expectedDetails: [
            detail(1, 3, "Function declaration"),
            detail(2, 2, "Return statement"),
            detail(2, 2, "Binary expression"),
            detail(2, 2, "Binary expression"),
        ],
    },
    {
        name: "switch with cases, break, default and throw",
        code: lines(
            "function describe(code: number): string {",
            "  switch (code) {",
            "    case 0:",
            '      return "ok";',
            "    case 1:",
            "      break;",
            "    default:",
            '      throw new Error("unknown");',
            "  }",
            '  return "retry";',
            "}",
        ),
        expectedTotal: 9,
        expectedDetails: [
            detail(1, 11, "Function declaration"),
            detail(2, 9, "Switch statement"),
            detail(3, 4, "Case clause"),
            detail(4, 4, "Return statement"),
            detail(5, 6, "Case clause"),
            detail(6, 6, "Break statement"),
            detail(7, 8, "Default case"),
            detail(8, 8, "Throw statement"),
            detail(10, 10, "Return statement"),
        ],
    },
    {
        name: "try/catch",
        code: lines(
            "function parse(text: string): unknown {",
            "  try {",
            "    return JSON.parse(text);",
            "  } catch {",
            "    return text;",
            "  }",
            "}",
        ),
        expectedTotal: 5,
        expectedDetails: [
            detail(1, 7, "Function declaration"),
            detail(2, 6, "Try statement"),
            detail(3, 3, "Return statement"),
            detail(4, 6, "Catch clause"),
            detail(5, 5, "Return statement"),
        ],
    },
    {
        name: "function expression",
        code: lines("const twice = function (x: number): number {", "  return x * 2;", "};"),
        expectedTotal: 2,
        expectedDetails: [detail(1, 3, "Function expression"), detail(2, 2, "Return statement")],
    },
    {
        name: "nested callback counts as its own function",
        code: lines(
            "function evens(values: number[]): number[] {",
            "  return values.filter((v: number): boolean => v % 2 === 0);",
            "}",
        ),
        expectedTotal: 3,
        expectedDetails: [
            detail(1, 3, "Function declaration"),
            detail(2, 2, "Return statement"),
            detail(2, 2, "Arrow function"),
        ],
    },
    {
        name: "exported function with try/catch, if and ternary (getCodeComplexity)",
        code: lines(
            "export function getCodeComplexity(",
            "    code: string",
            "): ComplexityResult {",
            "    try {",
            "        const temporaryFileName: string = getUniqueFileName();",
            "        const sourceFile: ts.SourceFile = ts.createSourceFile(temporaryFileName, code, TARGET_LANGUAGE_VERSION, true);",
            "        const error: string = findError(code, sourceFile);",
            "",
            '        if (error !== "") {',
            "            return ComplexityResult.failure(error);",
            "        }",
            "",
            "        const root: IMetricsModel = MetricsParser.getMetricsFromText(temporaryFileName, code, MetricsConfiguration, TARGET_LANGUAGE_VERSION).metrics;",
            "",
            "        return ComplexityResult.success(root.getCollectedComplexity(), collectDetails(root, sourceFile));",
            "    } catch (thrown: unknown) {",
            "        const reason: string = thrown instanceof Error ? thrown.message : String(thrown);",
            "",
            "        return ComplexityResult.failure(`Complexity could not be calculated: ${reason}`);",
            "    }",
            "}",
        ),
        expectedTotal: 8,
        expectedDetails: [
            detail(1, 21, "Function declaration"),
            detail(4, 20, "Try statement"),
            detail(9, 11, "If statement"),
            detail(10, 10, "Return statement"),
            detail(15, 15, "Return statement"),
            detail(16, 20, "Catch clause"),
            detail(17, 17, "Conditional expression"),
            detail(19, 19, "Return statement"),
        ],
    },
];

/** Snippets that are not a single, syntactically valid function. */
export const invalidFixtures: readonly InvalidFixture[] = [
    { name: "syntax error", code: "function broken( {", expectedError: "Syntax error" },
    { name: "whitespace only", code: "   ", expectedError: NOT_SINGLE_FUNCTION },
    { name: "two functions", code: lines("function a() {}", "function b() {}"), expectedError: NOT_SINGLE_FUNCTION },
    { name: "class", code: "class A {}", expectedError: NOT_SINGLE_FUNCTION },
    { name: "bare expression", code: "1 + 2;", expectedError: NOT_SINGLE_FUNCTION },
    { name: "non-function variable", code: "const x: number = 5;", expectedError: NOT_SINGLE_FUNCTION },
    {
        name: "import alongside function",
        code: lines('import fs from "fs";', "function f() {}"),
        expectedError: NOT_SINGLE_FUNCTION,
    },
];
