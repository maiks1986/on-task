import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { DatabaseService, Project, Task, Context } from '../database/database-service';
import { McpServer as MCP, z, TextContent } from './mcp-sdk';

export class OnTaskMcpServer {
  private server: MCP | null = null;
  private statusChangeCallbacks: ((isRunning: boolean) => void)[] = [];
  private isRunning = false;

  constructor(private dbService: DatabaseService) {}

  public async initialize(): Promise<void> {
    try {
      this.server = new MCP({
        name: 'on-task',
        version: '0.1.0'
      });

      // Register tools
      this.registerTools();

      // Start the server
      await this.server.start();
      this.isRunning = true;
      this.notifyStatusChange();

      console.log(`MCP Server started on port ${this.server.port}`);
    } catch (error) {
      console.error('Error initializing MCP server:', error);
      this.isRunning = false;
      this.notifyStatusChange();
    }
  }

  public onStatusChange(callback: (isRunning: boolean) => void): void {
    this.statusChangeCallbacks.push(callback);
    // Immediately notify with current status
    callback(this.isRunning);
  }

  private notifyStatusChange(): void {
    for (const callback of this.statusChangeCallbacks) {
      callback(this.isRunning);
    }
  }

  public async checkMcpConfiguration(): Promise<boolean> {
    const mcpConfigPath = this.getMcpConfigPath();
    if (!mcpConfigPath || !fs.existsSync(mcpConfigPath)) {
      return false;
    }

    try {
      const configContent = fs.readFileSync(mcpConfigPath, 'utf8');
      const config = JSON.parse(configContent);
      
      // Check if our server is already in the config
      return config.servers.some((server: any) => 
        server.name === 'on-task' && 
        server.port === this.server?.port
      );
    } catch (error) {
      console.error('Error checking MCP configuration:', error);
      return false;
    }
  }

  public async configureMcp(): Promise<boolean> {
    if (!this.server) {
      return false;
    }

    const mcpConfigPath = this.getMcpConfigPath();
    if (!mcpConfigPath) {
      return false;
    }

    try {
      let config: any = { servers: [] };
      
      // Read existing config if it exists
      if (fs.existsSync(mcpConfigPath)) {
        const configContent = fs.readFileSync(mcpConfigPath, 'utf8');
        config = JSON.parse(configContent);
        
        // Remove any existing on-task server entries
        config.servers = config.servers.filter((server: any) => server.name !== 'on-task');
      } else {
        // Create directory if it doesn't exist
        const configDir = path.dirname(mcpConfigPath);
        if (!fs.existsSync(configDir)) {
          fs.mkdirSync(configDir, { recursive: true });
        }
      }
      
      // Add our server to the config
      config.servers.push({
        name: 'on-task',
        url: `http://localhost:${this.server.port}`,
        description: 'On Task MCP Server for managing tasks and contexts'
      });
      
      // Write the updated config
      fs.writeFileSync(mcpConfigPath, JSON.stringify(config, null, 2), 'utf8');
      
      return true;
    } catch (error) {
      console.error('Error configuring MCP:', error);
      return false;
    }
  }

  private getMcpConfigPath(): string | null {
    // Determine the path to the MCP config file based on the OS
    const homeDir = os.homedir();
    
    if (process.platform === 'win32') {
      return path.join(homeDir, '.codeium', 'windsurf', 'mcp_config.json');
    } else if (process.platform === 'darwin') {
      return path.join(homeDir, '.codeium', 'windsurf', 'mcp_config.json');
    } else if (process.platform === 'linux') {
      return path.join(homeDir, '.codeium', 'windsurf', 'mcp_config.json');
    }
    
    return null;
  }

  private registerTools(): void {
    if (!this.server) {
      return;
    }

    // Project tools
    this.server.tool(
      'get_projects',
      {},
      async () => {
        const projects = await this.dbService.getProjects();
        return { 
          content: [{ type: 'text', text: JSON.stringify({ projects }) }]
        };
      }
    );

    this.server.tool(
      'get_project',
      { project_id: z.number() },
      async (params) => {
        const project = await this.dbService.getProject(params.project_id);
        return { 
          content: [{ type: 'text', text: JSON.stringify({ project }) }]
        };
      }
    );

    this.server.tool(
      'create_project',
      { 
        name: z.string(),
        description: z.string()
      },
      async (params) => {
        const projectId = await this.dbService.createProject(params.name, params.description);
        const project = await this.dbService.getProject(projectId);
        return { 
          content: [{ type: 'text', text: JSON.stringify({ project }) }]
        };
      }
    );

    this.server.tool(
      'update_project',
      {
        project_id: z.number(),
        name: z.string(),
        description: z.string()
      },
      async (params) => {
        await this.dbService.updateProject(params.project_id, params.name, params.description);
        const project = await this.dbService.getProject(params.project_id);
        return { 
          content: [{ type: 'text', text: JSON.stringify({ project }) }]
        };
      }
    );

    this.server.tool(
      'delete_project',
      { project_id: z.number() },
      async (params) => {
        await this.dbService.deleteProject(params.project_id);
        return { 
          content: [{ type: 'text', text: JSON.stringify({ success: true }) }]
        };
      }
    );

    this.server.tool(
      'cleanup_project',
      { project_id: z.number() },
      async (params) => {
        await this.dbService.cleanupProject(params.project_id);
        const project = await this.dbService.getProject(params.project_id);
        return { 
          content: [{ type: 'text', text: JSON.stringify({ project }) }]
        };
      }
    );

    this.server.tool(
      'get_tasks',
      {},
      async () => {
        const tasks = await this.dbService.getTasks();
        return { 
          content: [{ type: 'text', text: JSON.stringify({ tasks }) }]
        };
      }
    );

    this.server.tool(
      'get_tasks_by_project',
      { project_id: z.number() },
      async (params) => {
        const tasks = await this.dbService.getTasksByProject(params.project_id);
        return { 
          content: [{ type: 'text', text: JSON.stringify({ tasks }) }]
        };
      }
    );

    this.server.tool(
      'get_task',
      { task_id: z.number() },
      async (params) => {
        const task = await this.dbService.getTask(params.task_id);
        return { 
          content: [{ type: 'text', text: JSON.stringify({ task }) }]
        };
      }
    );

    this.server.tool(
      'create_task',
      { 
        project_id: z.number(),
        name: z.string(),
        description: z.string()
      },
      async (params) => {
        const taskId = await this.dbService.createTask(params.project_id, params.name, params.description);
        const task = await this.dbService.getTask(taskId);
        return { 
          content: [{ type: 'text', text: JSON.stringify({ task }) }]
        };
      }
    );

    this.server.tool(
      'update_task',
      {
        task_id: z.number(),
        name: z.string(),
        description: z.string()
      },
      async (params) => {
        await this.dbService.updateTask(params.task_id, params.name, params.description);
        const task = await this.dbService.getTask(params.task_id);
        return { 
          content: [{ type: 'text', text: JSON.stringify({ task }) }]
        };
      }
    );

    this.server.tool(
      'update_task_status',
      {
        task_id: z.number(),
        status: z.string()
      },
      async (params) => {
        await this.dbService.updateTaskStatus(params.task_id, params.status);
        const task = await this.dbService.getTask(params.task_id);
        
        // If task is marked as done, find the next pending task
        let nextTask = null;
        if (params.status === 'done') {
          const tasks = await this.dbService.getTasks();
          nextTask = tasks.find(t => t.task_status === 'pending' && t.task_id !== params.task_id);
        }
        
        return { 
          content: [{ type: 'text', text: JSON.stringify({ task, nextTask }) }]
        };
      }
    );

    this.server.tool(
      'delete_task',
      { task_id: z.number() },
      async (params) => {
        await this.dbService.deleteTask(params.task_id);
        return { 
          content: [{ type: 'text', text: JSON.stringify({ success: true }) }]
        };
      }
    );

    this.server.tool(
      'get_contexts',
      {},
      async () => {
        const contexts = await this.dbService.getContexts();
        return { 
          content: [{ type: 'text', text: JSON.stringify({ contexts }) }]
        };
      }
    );

    this.server.tool(
      'get_contexts_by_task',
      { task_id: z.number() },
      async (params) => {
        const contexts = await this.dbService.getContextsByTask(params.task_id);
        return { 
          content: [{ type: 'text', text: JSON.stringify({ contexts }) }]
        };
      }
    );

    this.server.tool(
      'get_context',
      { context_id: z.number() },
      async (params) => {
        const context = await this.dbService.getContext(params.context_id);
        return { 
          content: [{ type: 'text', text: JSON.stringify({ context }) }]
        };
      }
    );

    this.server.tool(
      'create_context',
      {
        project_id: z.number(),
        task_id: z.number(),
        description: z.string()
      },
      async (params) => {
        const contextId = await this.dbService.createContext(
          params.project_id, 
          params.task_id, 
          params.description
        );
        const context = await this.dbService.getContext(contextId);
        return { 
          content: [{ type: 'text', text: JSON.stringify({ context }) }]
        };
      }
    );

    this.server.tool(
      'update_context',
      {
        context_id: z.number(),
        description: z.string()
      },
      async (params) => {
        await this.dbService.updateContext(params.context_id, params.description);
        const context = await this.dbService.getContext(params.context_id);
        return { 
          content: [{ type: 'text', text: JSON.stringify({ context }) }]
        };
      }
    );

    this.server.tool(
      'delete_context',
      { context_id: z.number() },
      async (params) => {
        await this.dbService.deleteContext(params.context_id);
        return { 
          content: [{ type: 'text', text: JSON.stringify({ success: true }) }]
        };
      }
    );
  }

  public async stop(): Promise<void> {
    if (this.server) {
      await this.server.stop();
      this.isRunning = false;
      this.notifyStatusChange();
      console.log('MCP Server stopped');
    }
  }
}
