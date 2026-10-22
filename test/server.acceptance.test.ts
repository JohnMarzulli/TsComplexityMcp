import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { InvalidFixture, invalidFixtures, ValidFixture, validFixtures } from "./fixtures.js";

const SERVER_PATH: string = fileURLToPath(new URL("../dist/server.js", import.meta.url));
const TOOL_NAME: string = "analyze_complexity";

interface ToolReply {
    readonly isError: boolean;
    readonly text: string;
}

const client: Client = new Client({ name: "acceptance-test", version: "0.0.0" });

async function callTool(code: string): Promise<ToolReply> {
    const result: Awaited<ReturnType<Client["callTool"]>> = await client.callTool({
        name: TOOL_NAME,
        arguments: { code },
    });
    const content: ReadonlyArray<{ type: string; text: string }> = result.content as Array<{ type: string; text: string }>;
    return { isError: result.isError === true, text: content.map((c: { text: string }): string => c.text).join("") };
}

describe("MCP server over stdio", () => {
    beforeAll(async () => {
        await client.connect(new StdioClientTransport({ command: process.execPath, args: [SERVER_PATH] }));
    });

    afterAll(async () => {
        await client.close();
    });

    it("lists the complexity tool", async () => {
        const tools: string[] = (await client.listTools()).tools.map((t: { name: string }): string => t.name);

        expect(tools).toContain(TOOL_NAME);
    });

    it.each(validFixtures)("returns the known complexity for $name", async (fixture: ValidFixture) => {
        const reply: ToolReply = await callTool(fixture.code);

        expect(reply.isError).toBe(false);
        expect(JSON.parse(reply.text)).toEqual({ total: fixture.expectedTotal, details: fixture.expectedDetails });
    });

    it.each(invalidFixtures)("returns an error for $name", async (fixture: InvalidFixture) => {
        const reply: ToolReply = await callTool(fixture.code);

        expect(reply.isError).toBe(true);
        expect(reply.text).toContain(fixture.expectedError);
    });

    it("rejects empty code via the input schema", async () => {
        const reply: ToolReply = await callTool("");

        expect(reply.isError).toBe(true);
    });
});
