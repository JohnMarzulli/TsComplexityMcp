#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { ComplexityResult } from "./complexity-result.js";
import { getCodeComplexity } from "./complexity.js";

const server: McpServer = new McpServer({ name: "ts-complexity-mcp", version: "0.1.0" });

server.registerTool(
    "analyze_typescript_complexity",
    {
        description:
            "Scores the complexity of a single TypeScript function with tsmetrics-core. Returns JSON " +
            "{ total, details: [{ startLine, endLine, complexity, description }] }; lines are 1-based within the snippet.",
        inputSchema: { code: z.string().min(1).describe("Source of exactly one TypeScript function.") },
    },
    ({ code }: { code: string }): CallToolResult => {
        const result: ComplexityResult = getCodeComplexity(code);

        return result.ok
            ? { content: [{ type: "text", text: JSON.stringify({ total: result.total, details: result.details }) }] }
            : { content: [{ type: "text", text: result.error }], isError: true };
    },
);

await server.connect(new StdioServerTransport());
