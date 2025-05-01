import * as http from 'http';
import express from 'express';
import bodyParser from 'body-parser';
import { JsonRpcRequest, JsonRpcResponse, handleMcpRequest } from './handler';
import { initializeDataStorage } from '../data/storage';

// Initialize data storage
initializeDataStorage();

// Create Express app
const app = express();
app.use(bodyParser.json());

// Handle JSON-RPC requests
app.post('/', async (req, res) => {
  try {
    const request = req.body as JsonRpcRequest;
    const response = await handleMcpRequest(request);
    res.json(response);
  } catch (error: any) {
    console.error('Error handling HTTP request:', error);
    res.status(500).json({
      jsonrpc: '2.0',
      id: 0,
      error: {
        code: 500,
        message: error.message || 'Internal server error'
      }
    });
  }
});

// Create HTTP server
export function createHttpServer(port: number = 3000): http.Server {
  const server = http.createServer(app);
  
  server.listen(port, () => {
    console.log(`MCP Server is running on http://localhost:${port}`);
  });
  
  return server;
}

// Handle stdio communication
export function handleStdio(): void {
  process.stdin.setEncoding('utf8');
  
  let buffer = '';
  
  process.stdin.on('data', async (chunk) => {
    buffer += chunk;
    
    // Process complete messages (Content-Length header followed by JSON)
    while (buffer.includes('\r\n\r\n')) {
      const headerEnd = buffer.indexOf('\r\n\r\n');
      const header = buffer.substring(0, headerEnd);
      const match = header.match(/Content-Length: (\d+)/);
      
      if (!match) {
        buffer = buffer.substring(headerEnd + 4);
        continue;
      }
      
      const contentLength = parseInt(match[1], 10);
      const contentStart = headerEnd + 4;
      
      if (buffer.length < contentStart + contentLength) {
        // Not enough data yet, wait for more
        break;
      }
      
      const content = buffer.substring(contentStart, contentStart + contentLength);
      buffer = buffer.substring(contentStart + contentLength);
      
      try {
        const request = JSON.parse(content) as JsonRpcRequest;
        const response = await handleMcpRequest(request);
        
        // Send response
        const responseStr = JSON.stringify(response);
        const responseHeader = `Content-Length: ${Buffer.byteLength(responseStr, 'utf8')}\r\n\r\n`;
        process.stdout.write(responseHeader + responseStr);
      } catch (error: any) {
        console.error('Error handling stdio request:', error);
        
        // Send error response
        const errorResponse: JsonRpcResponse = {
          jsonrpc: '2.0',
          id: 0,
          error: {
            code: 500,
            message: error.message || 'Internal server error'
          }
        };
        
        const responseStr = JSON.stringify(errorResponse);
        const responseHeader = `Content-Length: ${Buffer.byteLength(responseStr, 'utf8')}\r\n\r\n`;
        process.stdout.write(responseHeader + responseStr);
      }
    }
  });
  
  process.stdin.on('end', () => {
    console.log('MCP Server: stdin stream ended');
    process.exit(0);
  });
  
  console.log('MCP Server is running in stdio mode');
}
