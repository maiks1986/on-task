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

// Create a simple server configuration
const serverConfig = {
  name: "on-task-mcp-server",
  version: "0.1.0"
};

// Set a reasonable timeout for operations
const OPERATION_TIMEOUT = 5000; // 5 seconds

// Flag to track if database is initialized
let isDatabaseInitialized = false;

/**
 * Initialize the database on demand
 * This allows the MCP server to start quickly and only initialize the database when needed
 */
async function initializeDatabaseIfNeeded() {
  if (!isDatabaseInitialized) {
    try {
      // Dynamic import to avoid blocking server startup
      await import('./database');
      isDatabaseInitialized = true;
      console.log('Database initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      return false;
    }
  }
  return true;
}

/**
 * MCP Server class
 * Handles tool registration and transport management
 */
class MCPServer {
  private config: typeof serverConfig;
  private transports: any[] = [];
  public tools: any[] = [];
  private isInitialized: boolean = false;

  constructor(config: typeof serverConfig) {
    this.config = config;
    console.log(`Creating MCP server: ${config.name} v${config.version}`);
  }
  
  /**
   * Initialize the server
   * This is called when the server is ready to receive requests
   */
  initialize() {
    if (!this.isInitialized) {
      console.log('MCP server initialized and ready to receive requests');
      this.isInitialized = true;
    }
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
    
    // Set up the stdin data handler
    process.stdin.on('data', this.handleStdinData.bind(this));
    
    // Set up error handlers
    process.on('uncaughtException', (err: Error) => {
      console.error('Uncaught exception:', err);
      this.sendErrorResponse(null, -32000, 'Internal error', String(err));
    });
    
    // Log that we're ready
    console.log('Stdio transport ready to receive requests');
  }

  private async handleStdinData(data: Buffer) {
    let input: any;
    let id: string | number | null = null;
    
    try {
      // Parse the input data
      input = JSON.parse(data.toString());
      id = input.id;
      
      console.log(`Received request ID ${id}:`, input.method);
      
      // Check if it's a valid JSON-RPC 2.0 request
      if (input.jsonrpc !== '2.0' || !input.method) {
        this.sendErrorResponse(id, -32600, 'Invalid Request', 'The JSON sent is not a valid Request object.');
        return;
      }
      
      // Process the request with a timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Operation timed out')), OPERATION_TIMEOUT);
      });
      
      const result = await Promise.race([
        this.processRequest(input),
        timeoutPromise
      ]);
      
      // Send the response
      process.stdout.write(JSON.stringify(result) + '\n');
    } catch (error: unknown) {
      console.error('Error processing stdin data:', error);
      
      if (error instanceof Error && error.message === 'Operation timed out') {
        this.sendErrorResponse(id, -32000, 'Request timeout', 'The operation took too long to complete');
      } else {
        this.sendErrorResponse(id, -32700, 'Parse error', String(error));
      }
    }
  }
  
  private sendErrorResponse(id: string | number | null, code: number, message: string, data: string) {
    const errorResponse = {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message,
        data
      }
    };
    process.stdout.write(JSON.stringify(errorResponse) + '\n');
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
      // Ensure we're handling the parameters correctly according to MCP spec
      if (!params || typeof params !== 'object') {
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32602,
            message: 'Invalid params',
            data: 'Parameters must be an object with name and arguments properties'
          }
        };
      }
      
      const { name, arguments: args } = params;
      
      if (!name) {
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32602,
            message: 'Invalid params',
            data: 'Tool name is required'
          }
        };
      }
      
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
        // Initialize database if needed before calling tool
        await initializeDatabaseIfNeeded();
        
        // Call the tool handler with the arguments
        console.log(`Calling tool ${name} with arguments:`, args);
        const result = await tool.handler(args || {});
        
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
        console.error(`Error calling tool ${name}:`, error);
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
        // Ensure we're handling the parameters correctly according to MCP spec
        if (!params || typeof params !== 'object') {
          return res.json({
            jsonrpc: '2.0',
            id,
            error: {
              code: -32602,
              message: 'Invalid params',
              data: 'Parameters must be an object with name and arguments properties'
            }
          });
        }
        
        const { name, arguments: args } = params;
        
        if (!name) {
          return res.json({
            jsonrpc: '2.0',
            id,
            error: {
              code: -32602,
              message: 'Invalid params',
              data: 'Tool name is required'
            }
          });
        }
        
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
          // Initialize database if needed before calling tool
          await initializeDatabaseIfNeeded();
          
          // Call the tool handler with the arguments
          console.log(`Calling tool ${name} with arguments:`, args);
          const result = await tool.handler(args || {});
          
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
          console.error(`Error calling tool ${name}:`, error);
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
    } catch (error: unknown) {
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
  server.initialize();
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
  server.initialize();
  
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
  
  // Add timeout middleware
  app.use((req, res, next) => {
    res.setTimeout(OPERATION_TIMEOUT, () => {
      res.status(408).json({
        jsonrpc: '2.0',
        id: req.body?.id || null,
        error: {
          code: -32000,
          message: 'Request timeout',
          data: 'The operation took too long to complete'
        }
      });
    });
    next();
  });
  
  // Handle MCP requests
  app.post("/", async (req, res) => {
    try {
      await Promise.race([
        transport.handleRequest(req, res, req.body),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timed out')), OPERATION_TIMEOUT))
      ]);
    } catch (error: unknown) {
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          id: req.body?.id || null,
          error: {
            code: -32000,
            message: error instanceof Error && error.message === 'Operation timed out' ? 'Request timeout' : 'Internal error',
            data: String(error)
          }
        });
      }
    }
  });
  
  // Start the server
  app.listen(port, () => {
    console.log(`MCP Server is running on http://localhost:${port}`);
    console.log(`Server info: ${serverConfig.name} v${serverConfig.version}`);
  });
}

// Export the server for use in other modules
export { server };
