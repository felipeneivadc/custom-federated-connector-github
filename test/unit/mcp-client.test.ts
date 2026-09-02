import { describe, expect, it } from "vitest";

import { McpClient } from "../../src/mcp-client.js";

describe("McpClient", () => {
  it("negotiates MCP, sends the initialized notification, and lists tools", async () => {
    const requests: Array<{ input: RequestInfo | URL; init: RequestInit | undefined }> = [];
    const responses = [
      jsonResponse(
        {
          jsonrpc: "2.0",
          id: 1,
          result: {
            protocolVersion: "2025-06-18",
            capabilities: {
              tools: {}
            },
            serverInfo: {
              name: "GitHub MCP Server"
            }
          }
        },
        {
          "mcp-session-id": "session-123"
        }
      ),
      new Response(null, { status: 202 }),
      serverSentEventResponse({
        jsonrpc: "2.0",
        id: 2,
        result: {
          tools: [
            {
              name: "get_file_contents",
              inputSchema: {
                type: "object",
                properties: {
                  owner: {
                    type: "string"
                  }
                },
                required: ["owner"]
              },
              annotations: {
                readOnlyHint: true
              }
            }
          ]
        }
      })
    ];
    const fetchMock: typeof fetch = async (input, init) => {
      requests.push({ input, init });
      const response = responses.shift();

      if (response === undefined) {
        throw new Error("Unexpected MCP request");
      }

      return response;
    };
    const client = new McpClient("https://example.test/mcp/readonly", "test-token", fetchMock);

    const initialized = await client.initialize();
    await client.notifyInitialized();
    const tools = await client.listTools();

    expect(initialized.protocolVersion).toBe("2025-06-18");
    expect(tools).toEqual([
      {
        name: "get_file_contents",
        inputSchema: {
          type: "object",
          properties: {
            owner: {
              type: "string"
            }
          },
          required: ["owner"]
        },
        annotations: {
          readOnlyHint: true
        }
      }
    ]);
    expect(requests).toHaveLength(3);
    expect(new Headers(requests[1]!.init?.headers).get("mcp-session-id")).toBe("session-123");
    expect(new Headers(requests[2]!.init?.headers).get("mcp-protocol-version")).toBe("2025-06-18");
    expect(new Headers(requests[2]!.init?.headers).get("authorization")).toBe("Bearer test-token");
  });

  it("surfaces HTTP errors without including the access token", async () => {
    const client = new McpClient(
      "https://example.test/mcp/readonly",
      "test-token",
      async () => new Response(null, { status: 401 })
    );

    await expect(client.initialize()).rejects.toThrow("HTTP 401");
    await expect(client.initialize()).rejects.not.toThrow("test-token");
  });
});

function jsonResponse(payload: unknown, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      "content-type": "application/json",
      ...headers
    }
  });
}

function serverSentEventResponse(payload: unknown): Response {
  return new Response(`event: message\ndata: ${JSON.stringify(payload)}\n\n`, {
    status: 200,
    headers: {
      "content-type": "text/event-stream"
    }
  });
}
