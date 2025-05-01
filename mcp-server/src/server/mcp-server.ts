import { createServer } from '@modelcontextprotocol/sdk/server';
import { allTools } from '../tools';
import '../database'; // Initialize database

// Create MCP server
const server = createServer({
  name: "on-task-mcp-server",
  version: "0.1.0"
});

// Register all tools
allTools.forEach(tool => {
  server.tool(tool.name, tool.schema, tool.handler);
});

export { server };
