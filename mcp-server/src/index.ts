// Import our direct MCP server implementation
import { startStdioServer, startHttpServer } from './direct-server';

// Check if --stdio flag is provided
const isStdioMode = process.argv.includes('--stdio');

if (isStdioMode) {
  // Start in stdio mode
  startStdioServer();
} else {
  // Start HTTP server on port 3000 by default
  const port = parseInt(process.env.PORT || '3000', 10);
  startHttpServer(port);
}
