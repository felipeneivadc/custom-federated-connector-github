import { DEFAULT_MCP_PROTOCOL_VERSION } from "./connector-profile.js";

export interface McpToolAnnotations {
  readOnlyHint?: boolean;
}

export interface McpInputSchema {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
}

export interface McpTool {
  name: string;
  inputSchema: McpInputSchema;
  annotations?: McpToolAnnotations;
}

export interface McpInitializeResult {
  protocolVersion: string;
  capabilities: Record<string, unknown>;
  serverInfo?: Record<string, unknown>;
}

export class McpProtocolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "McpProtocolError";
  }
}

export class McpClient {
  private nextRequestId = 1;
  private negotiatedProtocolVersion: string | undefined;
  private sessionId: string | undefined;

  constructor(
    private readonly endpoint: string,
    private readonly accessToken: string,
    private readonly fetchImplementation: typeof fetch = fetch
  ) {}

  async initialize(): Promise<McpInitializeResult> {
    const result = await this.request(
      "initialize",
      {
        protocolVersion: DEFAULT_MCP_PROTOCOL_VERSION,
        capabilities: {},
        clientInfo: {
          name: "github-federated-connector-contract-tests",
          version: "1.0.0"
        }
      },
      undefined
    );
    const record = ensureRecord(result, "initialize result");
    const protocolVersion = ensureString(record.protocolVersion, "initialize result.protocolVersion");
    const capabilities = ensureRecord(record.capabilities, "initialize result.capabilities");
    const serverInfo = record.serverInfo;

    this.negotiatedProtocolVersion = protocolVersion;

    if (serverInfo === undefined) {
      return {
        protocolVersion,
        capabilities
      };
    }

    return {
      protocolVersion,
      capabilities,
      serverInfo: ensureRecord(serverInfo, "initialize result.serverInfo")
    };
  }

  async notifyInitialized(): Promise<void> {
    const protocolVersion = this.requireNegotiatedProtocolVersion();
    const response = await this.post(
      {
        jsonrpc: "2.0",
        method: "notifications/initialized"
      },
      protocolVersion
    );

    if (!response.ok) {
      throw new McpProtocolError(
        `MCP notifications/initialized request failed with HTTP ${response.status}`
      );
    }
  }

  async listTools(): Promise<McpTool[]> {
    const result = await this.request("tools/list", {}, this.requireNegotiatedProtocolVersion());
    const record = ensureRecord(result, "tools/list result");
    const rawTools = record.tools;

    if (!Array.isArray(rawTools)) {
      throw new McpProtocolError("tools/list result.tools must be an array");
    }

    return rawTools.map((tool, index) => parseTool(tool, index));
  }

  private async request(
    method: string,
    params: Record<string, unknown>,
    protocolVersion: string | undefined
  ): Promise<unknown> {
    const requestId = this.nextRequestId;
    this.nextRequestId += 1;

    const response = await this.post(
      {
        jsonrpc: "2.0",
        id: requestId,
        method,
        params
      },
      protocolVersion
    );

    if (!response.ok) {
      throw new McpProtocolError(`MCP ${method} request failed with HTTP ${response.status}`);
    }

    const payload = await parseJsonRpcPayload(response);
    const record = ensureRecord(payload, `${method} response`);

    if (record.jsonrpc !== "2.0") {
      throw new McpProtocolError(`${method} response must use JSON-RPC 2.0`);
    }

    if (record.error !== undefined) {
      const error = ensureRecord(record.error, `${method} response.error`);
      const errorCode = typeof error.code === "number" ? error.code : "unknown";
      const errorMessage = typeof error.message === "string" ? error.message : "unknown error";
      throw new McpProtocolError(`MCP ${method} returned error ${errorCode}: ${errorMessage}`);
    }

    if (!Object.hasOwn(record, "result")) {
      throw new McpProtocolError(`${method} response must include result`);
    }

    return record.result;
  }

  private async post(
    payload: Record<string, unknown>,
    protocolVersion: string | undefined
  ): Promise<Response> {
    const headers = new Headers({
      Accept: "application/json, text/event-stream",
      Authorization: `Bearer ${this.accessToken}`,
      "Content-Type": "application/json"
    });

    if (protocolVersion !== undefined) {
      headers.set("MCP-Protocol-Version", protocolVersion);
    }

    if (this.sessionId !== undefined) {
      headers.set("Mcp-Session-Id", this.sessionId);
    }

    const response = await this.fetchImplementation(this.endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
    const returnedSessionId = response.headers.get("mcp-session-id");

    if (returnedSessionId !== null) {
      this.sessionId = returnedSessionId;
    }

    return response;
  }

  private requireNegotiatedProtocolVersion(): string {
    if (this.negotiatedProtocolVersion === undefined) {
      throw new McpProtocolError("initialize must complete before calling this method");
    }

    return this.negotiatedProtocolVersion;
  }
}

async function parseJsonRpcPayload(response: Response): Promise<unknown> {
  const responseBody = await response.text();

  if (responseBody.trim().length === 0) {
    throw new McpProtocolError("MCP response body is empty");
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payloads = contentType.includes("text/event-stream")
    ? extractServerSentEventPayloads(responseBody)
    : [responseBody];

  for (const payload of payloads) {
    try {
      return JSON.parse(payload);
    } catch {
      continue;
    }
  }

  throw new McpProtocolError("MCP response body does not contain valid JSON-RPC");
}

function extractServerSentEventPayloads(responseBody: string): string[] {
  return responseBody
    .split(/\r?\n\r?\n/)
    .map((event) =>
      event
        .split(/\r?\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice("data:".length).trimStart())
        .join("\n")
    )
    .filter((payload) => payload.length > 0 && payload !== "[DONE]");
}

function parseTool(value: unknown, index: number): McpTool {
  const tool = ensureRecord(value, `tools/list result.tools[${index}]`);
  const name = ensureString(tool.name, `tools/list result.tools[${index}].name`);
  const inputSchema = parseInputSchema(tool.inputSchema, index);
  const annotations = parseAnnotations(tool.annotations, index);

  if (annotations === undefined) {
    return {
      name,
      inputSchema
    };
  }

  return {
    name,
    inputSchema,
    annotations
  };
}

function parseInputSchema(value: unknown, index: number): McpInputSchema {
  const schema = ensureRecord(value, `tools/list result.tools[${index}].inputSchema`);
  const type = ensureString(schema.type, `tools/list result.tools[${index}].inputSchema.type`);
  const properties = ensureRecord(
    schema.properties,
    `tools/list result.tools[${index}].inputSchema.properties`
  );
  const required = schema.required;

  if (required === undefined) {
    return {
      type,
      properties,
      required: []
    };
  }

  if (!Array.isArray(required) || !required.every((property) => typeof property === "string")) {
    throw new McpProtocolError(
      `tools/list result.tools[${index}].inputSchema.required must be an array of strings`
    );
  }

  return {
    type,
    properties,
    required
  };
}

function parseAnnotations(value: unknown, index: number): McpToolAnnotations | undefined {
  if (value === undefined) {
    return undefined;
  }

  const annotations = ensureRecord(value, `tools/list result.tools[${index}].annotations`);
  const readOnlyHint = annotations.readOnlyHint;

  if (readOnlyHint === undefined) {
    return {};
  }

  if (typeof readOnlyHint !== "boolean") {
    throw new McpProtocolError(
      `tools/list result.tools[${index}].annotations.readOnlyHint must be a boolean`
    );
  }

  return {
    readOnlyHint
  };
}

function ensureRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new McpProtocolError(`${label} must be an object`);
  }

  return value;
}

function ensureString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new McpProtocolError(`${label} must be a non-empty string`);
  }

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
