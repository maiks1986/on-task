const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

// Constants
let mcpServerProcess = null;
const DEFAULT_MCP_CONFIG_PATH = path.join(os.homedir(), '.codeium', 'windsurf', 'mcp_config.json');
const MCP_SERVER_PATH = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '..', 'mcp-server');

/**
 * Get the MCP config file path from settings or use the default
 * @returns {string} The path to the MCP config file
 */
function getMCPConfigPath() {
  const configPath = vscode.workspace.getConfiguration('onTask').get('mcpConfigPath');
  return configPath || DEFAULT_MCP_CONFIG_PATH;
}

/**
 * Read the MCP config file
 * @returns {Promise<object>} The MCP config object
 */
async function readMCPConfig() {
  const configPath = getMCPConfigPath();
  
  try {
    if (!fs.existsSync(configPath)) {
      // Create default config if it doesn't exist
      const defaultConfig = {
        mcpServers: {}
      };
      
      // Ensure directory exists
      const configDir = path.dirname(configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
      return defaultConfig;
    }
    
    const configContent = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configContent);
  } catch (error) {
    console.error('Error reading MCP config:', error);
    throw new Error(`Failed to read MCP config: ${error.message}`);
  }
}

/**
 * Write the MCP config file
 * @param {object} config The MCP config object
 * @returns {Promise<void>}
 */
async function writeMCPConfig(config) {
  const configPath = getMCPConfigPath();
  
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Error writing MCP config:', error);
    throw new Error(`Failed to write MCP config: ${error.message}`);
  }
}

/**
 * Check if the On Task MCP server is registered in the config
 * @returns {Promise<{installed: boolean, path: string, version: string, running: boolean}>}
 */
async function checkMCPServerStatus() {
  try {
    const config = await readMCPConfig();
    const isInstalled = config.mcpServers && config.mcpServers.onTask !== undefined;
    
    if (!isInstalled) {
      return { installed: false, path: '', version: '', running: false };
    }
    
    // Get the server path from the config
    const serverConfig = config.mcpServers.onTask;
    const serverPath = serverConfig.args && serverConfig.args.length > 0 ? serverConfig.args[0] : '';
    
    // Try to get version info from the MCP server directory if possible
    let version = '1.0.0';
    const mcpServerDir = path.dirname(serverPath);
    const packageJsonPath = path.join(mcpServerDir, '..', 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        version = packageJson.version || '1.0.0';
      } catch (err) {
        console.warn('Error reading package.json:', err);
      }
    }
    
    // Check if server is running
    const running = mcpServerProcess !== null;
    
    return { installed: true, path: serverPath, version, running };
  } catch (error) {
    console.error('Error checking MCP server status:', error);
    return { installed: false, path: '', version: '', running: false };
  }
}

/**
 * Start the MCP server
 * @returns {Promise<boolean>}
 */
async function startMCPServer() {
  try {
    const status = await checkMCPServerStatus();
    
    if (!status.installed) {
      vscode.window.showErrorMessage('MCP Server is not installed. Please install it first.');
      return false;
    }
    
    if (status.running) {
      vscode.window.showInformationMessage('MCP Server is already running.');
      return true;
    }
    
    // Start the server using our new SDK-based implementation with stdio mode
    mcpServerProcess = spawn('npm', ['run', 'start:stdio'], { cwd: MCP_SERVER_PATH, shell: true, stdio: ['pipe', 'pipe', 'pipe'] });
    
    mcpServerProcess.stdout.on('data', (data) => {
      console.log(`MCP Server stdout: ${data}`);
    });
    
    mcpServerProcess.stderr.on('data', (data) => {
      console.error(`MCP Server stderr: ${data}`);
    });
    
    mcpServerProcess.on('close', (code) => {
      console.log(`MCP Server process exited with code ${code}`);
      mcpServerProcess = null;
    });
    
    vscode.window.showInformationMessage('MCP Server started successfully.');
    return true;
  } catch (error) {
    console.error('Error starting MCP server:', error);
    vscode.window.showErrorMessage(`Failed to start MCP Server: ${error.message}`);
    return false;
  }
}

/**
 * Stop the MCP server
 * @returns {Promise<boolean>}
 */
async function stopMCPServer() {
  try {
    if (!mcpServerProcess) {
      vscode.window.showInformationMessage('MCP Server is not running.');
      return true;
    }
    
    // Kill the server process
    mcpServerProcess.kill();
    mcpServerProcess = null;
    
    vscode.window.showInformationMessage('MCP Server stopped successfully.');
    return true;
  } catch (error) {
    console.error('Error stopping MCP server:', error);
    vscode.window.showErrorMessage(`Failed to stop MCP Server: ${error.message}`);
    return false;
  }
}

/**
 * Install the On Task MCP server by updating the MCP config
 * @returns {Promise<boolean>}
 */
async function installMCPServer() {
  try {
    // Check if the MCP server is already registered in the config
    const config = await readMCPConfig();
    const isInstalled = config.mcpServers && config.mcpServers.onTask !== undefined;

    if (isInstalled) {
      vscode.window.showInformationMessage('On Task MCP Server is already registered in the MCP config.');
      return true;
    }

    // Get the MCP server path from the workspace
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showErrorMessage('No workspace folder is open.');
      return false;
    }

    const workspacePath = workspaceFolders[0].uri.fsPath;
    const mcpServerDir = path.join(workspacePath, 'mcp-server');
    
    // Check if the MCP server exists
    if (!fs.existsSync(mcpServerDir)) {
      vscode.window.showErrorMessage('MCP Server directory not found in workspace. Please build the MCP server first.');
      return false;
    }

    // Update the MCP config
    if (!config.mcpServers) {
      config.mcpServers = {};
    }

    // Use our new SDK-based implementation with stdio mode
    config.mcpServers.onTask = {
      command: 'npm',
      args: ['run', 'start:stdio'],
      cwd: mcpServerDir,
      toolNamespace: 'ot'
    };

    await writeMCPConfig(config);

    vscode.window.showInformationMessage('On Task MCP Server registered successfully in the MCP config.');
    return true;
  } catch (error) {
    console.error('Error registering MCP server:', error);
    vscode.window.showErrorMessage(`Failed to register On Task MCP Server: ${error.message}`);
    return false;
  }
}

/**
 * Copy MCP server code to clipboard
 */
function copyMCPServerCode() {
  vscode.env.clipboard.writeText(`
// Follow these steps to install the MCP server:

1. Create a new directory for the MCP server:
   mkdir mcp-server
   cd mcp-server

2. Create package.json:
   {
     "name": "on-task-mcp-server",
     "version": "1.0.0",
     "description": "MCP Server for On Task extension",
     "main": "dist/index.js",
     "scripts": {
       "build": "tsc",
       "start": "node dist/index.js",
       "dev": "ts-node src/index.ts"
     },
     "keywords": [
       "mcp",
       "on-task",
       "vscode",
       "extension"
     ],
     "author": "On Task",
     "license": "MIT",
     "dependencies": {
       "express": "^4.18.2",
       "body-parser": "^1.20.2",
       "uuid": "^9.0.0",
       "@modelcontextprotocol/sdk": "^1.10.2"
     },
     "devDependencies": {
       "@types/express": "^4.17.17",
       "@types/node": "^18.15.11",
       "@types/uuid": "^9.0.1",
       "ts-node": "^10.9.1",
       "typescript": "^5.0.4"
     }
   }

3. Create tsconfig.json:
   {
     "compilerOptions": {
       "target": "ES2020",
       "module": "commonjs",
       "outDir": "./dist",
       "rootDir": "./src",
       "strict": true,
       "esModuleInterop": true,
       "skipLibCheck": true,
       "forceConsistentCasingInFileNames": true,
       "resolveJsonModule": true
     },
     "include": ["src/**/*"],
     "exclude": ["node_modules", "**/*.spec.ts"]
   }

4. Create src/types.ts:
   // Type definitions for the MCP server
   
   export interface Project {
     id: string;
     name: string;
     description: string;
     status: 'Active' | 'Completed';
     createdAt: string;
   }
   
   export interface Task {
     id: string;
     name: string;
     description: string;
     status: 'Pending' | 'In Progress' | 'Done';
     priority: 'Low' | 'Medium' | 'High';
     projectId: string | null;
     createdAt: string;
   }
   
   export interface Context {
     id: string;
     name: string;
     description: string;
     taskId: string | null;
     createdAt: string;
   }
   
   // Tool parameters
   export interface ProjectAddParams {
     name: string;
     description?: string;
   }
   
   export interface ProjectEditParams {
     id: string;
     name?: string;
     description?: string;
   }
   
   export interface ProjectGetParams {
     id: string;
   }
   
   export interface ProjectGetAllParams {
     // Optional filter parameters could be added here
   }
   
   export interface ProjectDeleteParams {
     id: string;
   }
   
   export interface ProjectCleanupParams {
     id: string;
   }
   
   export interface TaskAddParams {
     name: string;
     description?: string;
     priority?: 'Low' | 'Medium' | 'High';
     projectId?: string;
   }
   
   export interface TaskEditParams {
     id: string;
     name?: string;
     description?: string;
     priority?: 'Low' | 'Medium' | 'High';
     projectId?: string | null;
   }
   
   export interface TaskGetParams {
     id: string;
   }
   
   export interface TaskGetAllParams {
     // Optional filter parameters could be added here
   }
   
   export interface TaskGetByProjectParams {
     projectId: string;
   }
   
   export interface TaskDeleteParams {
     id: string;
   }
   
   export interface TaskDoneParams {
     id: string;
   }
   
   export interface ContextAddParams {
     name: string;
     description?: string;
     taskId?: string;
   }
   
   export interface ContextEditParams {
     id: string;
     name?: string;
     description?: string;
     taskId?: string | null;
   }
   
   export interface ContextGetParams {
     id: string;
   }
   
   export interface ContextGetAllParams {
     // Optional filter parameters could be added here
   }
   
   export interface ContextGetByTaskParams {
     taskId: string;
   }
   
   export interface ContextDeleteParams {
     id: string;
   }
   
   // Tool results
   export interface ProjectResult {
     project: Project;
   }
   
   export interface ProjectsResult {
     projects: Project[];
   }
   
   export interface TaskResult {
     task: Task;
   }
   
   export interface TasksResult {
     tasks: Task[];
   }
   
   export interface ContextResult {
     context: Context;
   }
   
   export interface ContextsResult {
     contexts: Context[];
   }
   
   export interface DeleteResult {
     success: boolean;
     message: string;
   }
   
   // MCP request and response
   export interface MCPRequest {
     tool: string;
     params: any;
   }
   
   export interface MCPResponse {
     result: ProjectResult | ProjectsResult | TaskResult | TasksResult | ContextResult | ContextsResult | DeleteResult;
   }

5. Create src/index.ts:
   // This file contains the MCP Server implementation with all the tools
   // Available tools include:
   // - project.add: Add a new project
   // - project.edit: Edit an existing project
   // - project.get: Get a project by ID
   // - project.getAll: Get all projects
   // - project.delete: Delete a project
   // - project.cleanup: Mark a project as completed
   // - task.add: Add a new task
   // - task.edit: Edit an existing task
   // - task.get: Get a task by ID
   // - task.getAll: Get all tasks
   // - task.getByProject: Get tasks by project ID
   // - task.delete: Delete a task
   // - task.done: Mark a task as done
   // - context.add: Add a new context
   // - context.edit: Edit an existing context
   // - context.get: Get a context by ID
   // - context.getAll: Get all contexts
   // - context.getByTask: Get contexts by task ID
   // - context.delete: Delete a context

6. Install dependencies:
   npm install

7. Run the server directly with TypeScript:
   npx ts-node src/index.ts
   
   Or build and run with JavaScript:
   npm run build
   npm start
  `);
  
  vscode.window.showInformationMessage('MCP Server code copied to clipboard.');
}

/**
 * Helper function to copy a folder recursively
 * @param {string} source 
 * @param {string} target 
 */
function copyFolderRecursive(source, target) {
  // Create target directory if it doesn't exist
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
  
  // Read source directory
  const files = fs.readdirSync(source);
  
  // Copy each file/directory
  files.forEach(file => {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);
    
    // Check if it's a directory
    if (fs.lstatSync(sourcePath).isDirectory()) {
      copyFolderRecursive(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  });
}

module.exports = {
  checkMCPServerStatus,
  startMCPServer,
  stopMCPServer,
  installMCPServer,
  copyMCPServerCode
};