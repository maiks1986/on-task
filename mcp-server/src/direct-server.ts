/**
 * Direct MCP Server implementation
 * 
 * This file implements a direct MCP server following the Model Context Protocol format
 * without relying on external SDK dependencies.
 */

// Import required modules
import express from 'express';
import { json } from 'body-parser';
import { allTools } from './tools';
import './database'; // Initialize database

// Create a simple server configuration
const serverConfig = {
  name: "on-task-mcp-server",
  version: "0.1.0"
};

/**
 * MCP Server class
 * Handles tool registration and transport management
 */
class MCPServer {
  private config: typeof serverConfig;
  private transports: any[] = [];
  public tools: any[] = [];

  constructor(config: typeof serverConfig) {
    this.config = config;
    console.log(`Creating MCP server: ${config.name} v${config.version}`);
  }

  /**
   * Register a tool with the server
   */
  tool(name: string, schema: any, handler: any) {
    this.tools.push({ name, schema, handler });
    console.log(`Registered tool: ${name}`);
    return this;
  }

  /**
   * Register a transport with the server
   */
  registerTransport(transport: any) {
    this.transports.push(transport);
    console.log('Registered transport');
    return this;
  }

  /**
   * Find a tool by name
   */
  findTool(name: string) {
    return this.tools.find(tool => tool.name === name);
  }
}

/**
 * Stdio Transport for CLI usage
 */
class StdioTransport {
  constructor() {
    console.log('Created stdio transport');
    process.stdin.on('data', this.handleStdinData.bind(this));
  }

  private async handleStdinData(data: Buffer) {
    try {
      const input = JSON.parse(data.toString());
      console.log('Received request:', JSON.stringify(input, null, 2));
      
      // Check if it's a valid JSON-RPC 2.0 request
      if (input.jsonrpc !== '2.0' || !input.method) {
        const errorResponse = {
          jsonrpc: '2.0',
          id: input.id,
          error: {
            code: -32600,
            message: 'Invalid Request',
            data: 'The JSON sent is not a valid Request object.'
          }
        };
        process.stdout.write(JSON.stringify(errorResponse) + '\n');
        return;
      }
      
      const result = await this.processRequest(input);
      process.stdout.write(JSON.stringify(result) + '\n');
    } catch (error) {
      console.error('Error processing stdin data:', error);
      const errorResponse = {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: 'Parse error',
          data: String(error)
        }
      };
      process.stdout.write(JSON.stringify(errorResponse) + '\n');
    }
  }

  private async processRequest(request: any) {
    const { id, method, params } = request;
    
    // Handle different methods
    if (method === 'tools/list') {
      // Return list of tools
      return {
        jsonrpc: '2.0',
        id,
        result: {
          tools: server.tools.map(tool => ({
            name: tool.name,
            description: `Tool for ${tool.name}`,
            inputSchema: tool.schema
          })),
          nextCursor: null // No pagination for now
        }
      };
    } else if (method === 'tools/call') {
      const { name, arguments: args } = params;
      const tool = server.findTool(name);
      
      if (!tool) {
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32602,
            message: 'Tool not found',
            data: `Tool '${name}' not found`
          }
        };
      }
      
      try {
        const result = await tool.handler(args);
        
        // If result already has content array, use it, otherwise wrap it
        const content = result.content || [{ type: 'text', text: JSON.stringify(result) }];
        
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content,
            isError: false
          }
        };
      } catch (error) {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: String(error) }],
            isError: true
          }
        };
      }
    } else {
      // Method not supported
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32601,
          message: 'Method not found',
          data: `The method ${method} is not supported`
        }
      };
    }
  }

  handleRequest(req: any, res: any, body: any) {
    console.log('Handling stdio request');
    return Promise.resolve();
  }
}

/**
 * HTTP Transport for web usage
 */
class HttpTransport {
  private config: { port: number; sessionIdGenerator?: () => string };

  constructor(config: { port: number; sessionIdGenerator?: () => string }) {
    this.config = config;
    console.log(`Created HTTP transport on port ${config.port}`);
  }

  async handleRequest(req: any, res: any, body: any) {
    try {
      console.log('Received HTTP request:', JSON.stringify(body, null, 2));
      
      // Check if it's a valid JSON-RPC 2.0 request
      if (body.jsonrpc !== '2.0' || !body.method) {
        return res.json({
          jsonrpc: '2.0',
          id: body.id,
          error: {
            code: -32600,
            message: 'Invalid Request',
            data: 'The JSON sent is not a valid Request object.'
          }
        });
      }
      
      const { id, method, params } = body;
      
      // Handle different methods
      if (method === 'tools/list') {
        // Return list of tools
        return res.json({
          jsonrpc: '2.0',
          id,
          result: {
            tools: server.tools.map(tool => ({
              name: tool.name,
              description: `Tool for ${tool.name}`,
              inputSchema: tool.schema
            })),
            nextCursor: null // No pagination for now
          }
        });
      } else if (method === 'tools/call') {
        const { name, arguments: args } = params;
        const tool = server.findTool(name);
        
        if (!tool) {
          return res.json({
            jsonrpc: '2.0',
            id,
            error: {
              code: -32602,
              message: 'Tool not found',
              data: `Tool '${name}' not found`
            }
          });
        }
        
        try {
          const result = await tool.handler(args);
          
          // If result already has content array, use it, otherwise wrap it
          const content = result.content || [{ type: 'text', text: JSON.stringify(result) }];
          
          return res.json({
            jsonrpc: '2.0',
            id,
            result: {
              content,
              isError: false
            }
          });
        } catch (error) {
          return res.json({
            jsonrpc: '2.0',
            id,
            result: {
              content: [{ type: 'text', text: String(error) }],
              isError: true
            }
          });
        }
      } else {
        // Method not supported
        return res.json({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: 'Method not found',
            data: `The method ${method} is not supported`
          }
        });
      }
    } catch (error) {
      console.error('Error handling request:', error);
      return res.status(500).json({
        jsonrpc: '2.0',
        id: body?.id || null,
        error: {
          code: -32700,
          message: 'Parse error',
          data: String(error)
        }
      });
    }
  }
}

// Create the server instance
const server = new MCPServer(serverConfig);

// Register all tools
allTools.forEach(tool => {
  server.tool(tool.name, tool.schema, tool.handler);
});

/**
 * Start the server with stdio transport
 */
export function startStdioServer() {
  const transport = new StdioTransport();
  server.registerTransport(transport);
  console.log('MCP server started in stdio mode');
}

/**
 * Start the server with HTTP transport
 */
export function startHttpServer(port: number = 3000) {
  const transport = new HttpTransport({ 
    port,
    sessionIdGenerator: () => Math.random().toString(36).substring(2, 15)
  });
  server.registerTransport(transport);
  
  const app = express();
  app.use(json());
  
  // Add CORS headers for local development
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });
  
  // Handle MCP requests
  app.post("/", async (req, res) => {
    await transport.handleRequest(req, res, req.body);
  });
  
  // Start the server
  app.listen(port, () => {
    console.log(`MCP Server is running on http://localhost:${port}`);
    console.log(`Server info: ${serverConfig.name} v${serverConfig.version}`);
  });
}

// Export the server for use in other modules
export { server };
