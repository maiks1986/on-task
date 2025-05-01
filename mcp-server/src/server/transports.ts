import { StdioTransport, HttpTransport } from '@modelcontextprotocol/sdk/server';
import express from 'express';
import { server } from './mcp-server';

// Start server with stdio transport
export function startStdioServer() {
  const transport = new StdioTransport();
  server.registerTransport(transport);
  console.log('MCP server started in stdio mode');
}

// Start server with HTTP transport
export function startHttpServer(port: number = 3000) {
  const transport = new HttpTransport({ 
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
