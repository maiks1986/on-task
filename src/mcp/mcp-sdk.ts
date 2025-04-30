/**
 * Implementation of the ModelContextProtocol TypeScript SDK
 * Based on the documentation from https://github.com/modelcontextprotocol/typescript-sdk
 */

import * as vscode from 'vscode';

// Zod-like schema validation
export const z = {
  string: () => ({ type: 'string', validate: (val: any) => typeof val === 'string' }),
  number: () => ({ type: 'number', validate: (val: any) => typeof val === 'number' }),
  boolean: () => ({ type: 'boolean', validate: (val: any) => typeof val === 'boolean' }),
  object: (schema: any) => ({ type: 'object', schema, validate: (val: any) => typeof val === 'object' }),
};

// Content types
export interface TextContent {
  type: 'text';
  text: string;
}

export type Content = TextContent;

// Resource template for dynamic resources
export class ResourceTemplate {
  pattern: string;
  options: { list: any };

  constructor(pattern: string, options: { list: any }) {
    this.pattern = pattern;
    this.options = options;
  }
}

// Server implementation
export class McpServer {
  name: string;
  version: string;
  port: number = 0;
  private tools: Map<string, any> = new Map();
  private resources: Map<string, any> = new Map();
  private prompts: Map<string, any> = new Map();
  private isRunning: boolean = false;
  private statusListeners: ((status: boolean) => void)[] = [];

  constructor(options: { name: string; version: string }) {
    this.name = options.name;
    this.version = options.version;
  }

  // Tool registration
  tool(name: string, params: Record<string, any>, handler: (params: any) => Promise<{ content: Content[] }>) {
    this.tools.set(name, { name, params, handler });
    console.log(`Registered tool: ${name}`);
    return this;
  }

  // Resource registration
  resource(name: string, pattern: string | ResourceTemplate, handler: (uri: URL, params: any) => Promise<{ contents: { uri: string; text: string }[] }>) {
    this.resources.set(name, { name, pattern, handler });
    console.log(`Registered resource: ${name}`);
    return this;
  }

  // Prompt registration
  prompt(name: string, params: any, handler: (params: any) => { messages: any[] }) {
    this.prompts.set(name, { name, params, handler });
    console.log(`Registered prompt: ${name}`);
    return this;
  }

  // Connect to a transport
  async connect(_transport: any): Promise<void> {
    console.log(`Connecting to transport...`);
    this.isRunning = true;
    this.notifyStatusChange();
    // In a real implementation, this would connect to the transport
    this.port = 8080 + Math.floor(Math.random() * 1000);
    console.log(`Server started on port ${this.port}`);
  }

  // Start the server
  async start(): Promise<void> {
    console.log(`Starting MCP Server ${this.name}...`);
    this.isRunning = true;
    this.notifyStatusChange();
    // In a real implementation, this would start an HTTP server
    this.port = 8080 + Math.floor(Math.random() * 1000);
    console.log(`Server started on port ${this.port}`);
  }

  // Stop the server
  async stop(): Promise<void> {
    console.log(`Stopping MCP Server ${this.name}...`);
    this.isRunning = false;
    this.notifyStatusChange();
    // In a real implementation, this would stop the HTTP server
  }

  // Register a status change listener
  onStatusChange(listener: (status: boolean) => void): void {
    this.statusListeners.push(listener);
    // Immediately notify with current status
    listener(this.isRunning);
  }

  private notifyStatusChange(): void {
    for (const listener of this.statusListeners) {
      listener(this.isRunning);
    }
  }

  // Get all registered tools
  getTools(): string[] {
    return Array.from(this.tools.keys());
  }

  // Get all registered resources
  getResources(): string[] {
    return Array.from(this.resources.keys());
  }

  // Get all registered prompts
  getPrompts(): string[] {
    return Array.from(this.prompts.keys());
  }
}

// For backwards compatibility
export class ModelContextProtocolServer extends McpServer {
  constructor(options: { name: string; description: string; version: string; port?: number }) {
    super({ name: options.name, version: options.version });
  }

  public registerTool(tool: any): void {
    this.tool(tool.name, tool.parameters, tool.handler);
  }
}

// Tool class for backwards compatibility
export class Tool {
  name: string;
  description: string;
  parameters: any;
  handler: (params: any) => Promise<any>;

  constructor(options: { name: string; description: string; parameters: any; handler: (params: any) => Promise<any> }) {
    this.name = options.name;
    this.description = options.description;
    this.parameters = options.parameters;
    this.handler = options.handler;
  }
}

// Transport for stdio
export class StdioServerTransport {
  constructor() {}
}
