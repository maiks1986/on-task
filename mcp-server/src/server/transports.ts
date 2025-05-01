import { createStdioTransport } from '@modelcontextprotocol/sdk/server/transports/stdio';
import { createHttpTransport } from '@modelcontextprotocol/sdk/server/transports/http';
import express from 'express';
import { server } from './mcp-server';

// Start server with stdio transport
export function startStdioServer() {
  const transport = createStdioTransport();
  server.registerTransport(transport);
  console.log('MCP server started in stdio mode');
}

// Start server with HTTP transport
export function startHttpServer(port: number = 3000) {
  const transport = createHttpTransport({ 
    port,
    sessionIdGenerator: () => Math.random().toString(36).substring(2, 15)
  });
  server.registerTransport(transport);
  
  const app = express();
  app.use(express.json());
  
  app.post("/", async (req, res) => {
    await transport.handleRequest(req, res, req.body);
  });
  
  app.listen(port, () => {
    console.log(`MCP Server is running on http://localhost:${port}`);
  });
}
