import { beforeAll, describe, expect, it } from "vitest";

import { githubConnectorProfile } from "../../src/connector-profile.js";
import { McpClient, type McpTool } from "../../src/mcp-client.js";

const accessToken = requireContractToken();
let tools: McpTool[] = [];

describe("GitHub remote MCP read-only contract", () => {
  beforeAll(async () => {
    const client = new McpClient(githubConnectorProfile.mcp.endpoint, accessToken);
    const initialized = await client.initialize();

    expect(initialized.protocolVersion).toEqual(expect.any(String));
    expect(initialized.capabilities).toHaveProperty("tools");

    await client.notifyInitialized();
    tools = await client.listTools();
  }, 30_000);

  it("keeps each required read capability and its protected input schema", () => {
    for (const requiredTool of githubConnectorProfile.mcp.requiredTools) {
      const tool = tools.find((candidate) => candidate.name === requiredTool.name);

      expect(tool, `Missing required MCP tool: ${requiredTool.name}`).toBeDefined();

      if (tool === undefined) {
        throw new Error(`Missing required MCP tool: ${requiredTool.name}`);
      }

      expect(tool.inputSchema.type).toBe("object");
      expect(tool.inputSchema.required).toEqual(
        expect.arrayContaining(requiredTool.requiredInputProperties)
      );
      expect(tool.annotations?.readOnlyHint).toBe(true);
    }
  });

  it("does not expose known mutating tools or a tool without a read-only annotation", () => {
    const mutatingTools = tools
      .filter((tool) => githubConnectorProfile.mcp.forbiddenTools.includes(tool.name))
      .map((tool) => tool.name);

    expect(mutatingTools).toEqual([]);
    expect(tools).not.toHaveLength(0);
    expect(tools.every((tool) => tool.annotations?.readOnlyHint === true)).toBe(true);
  });
});

function requireContractToken(): string {
  const token = process.env.GITHUB_MCP_TEST_TOKEN;

  if (token === undefined || token.trim().length === 0) {
    throw new Error(
      "GITHUB_MCP_TEST_TOKEN is required for contract tests. Use a dedicated read-only token limited to the non-sensitive fixture repository."
    );
  }

  return token;
}
