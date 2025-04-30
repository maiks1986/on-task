import * as vscode from 'vscode';
import { DatabaseService } from './database/database-service';
import { ProjectsProvider } from './webview/projects-provider';
import { TasksProvider } from './webview/tasks-provider';
import { ContextsProvider } from './webview/contexts-provider';
import { McpServer } from './mcp/mcp-server';

export async function activate(context: vscode.ExtensionContext) {
  console.log('Activating "On Task" extension');

  // Initialize database service
  const dbService = new DatabaseService(context.globalStoragePath);
  await dbService.initialize();

  // Initialize MCP server
  const mcpServer = new McpServer(dbService);
  await mcpServer.initialize();

  // Create tree data providers
  const projectsProvider = new ProjectsProvider(dbService);
  const tasksProvider = new TasksProvider(dbService);
  const contextsProvider = new ContextsProvider(dbService);

  // Register views
  vscode.window.registerTreeDataProvider('onTaskProjects', projectsProvider);
  vscode.window.registerTreeDataProvider('onTaskTasks', tasksProvider);
  vscode.window.registerTreeDataProvider('onTaskContexts', contextsProvider);

  // Register commands
  registerCommands(context, dbService, projectsProvider, tasksProvider, contextsProvider, mcpServer);

  // Create status bar items
  const mcpStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  mcpStatusBarItem.text = '$(plug) MCP: Running';
  mcpStatusBarItem.tooltip = 'On Task MCP Server Status';
  mcpStatusBarItem.show();
  context.subscriptions.push(mcpStatusBarItem);

  // Update MCP status bar item based on MCP server status
  mcpServer.onStatusChange((isRunning) => {
    mcpStatusBarItem.text = isRunning ? '$(plug) MCP: Running' : '$(alert) MCP: Stopped';
  });

  // Add disposables to context
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('on-task')) {
        projectsProvider.refresh();
        tasksProvider.refresh();
        contextsProvider.refresh();
      }
    })
  );
}

function registerCommands(
  context: vscode.ExtensionContext,
  dbService: DatabaseService,
  projectsProvider: ProjectsProvider,
  tasksProvider: TasksProvider,
  contextsProvider: ContextsProvider,
  mcpServer: McpServer
) {
  // Project commands
  context.subscriptions.push(
    vscode.commands.registerCommand('on-task.createProject', async () => {
      const projectName = await vscode.window.showInputBox({
        placeHolder: 'Project name',
        prompt: 'Enter a name for the new project'
      });

      if (!projectName) {
        return;
      }

      const projectDescription = await vscode.window.showInputBox({
        placeHolder: 'Project description (optional)',
        prompt: 'Enter a description for the new project'
      });

      await dbService.createProject(projectName, projectDescription || '');
      projectsProvider.refresh();
      vscode.window.showInformationMessage(`Project "${projectName}" created.`);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('on-task.editProject', async (projectId: number) => {
      const project = await dbService.getProject(projectId);
      if (!project) {
        vscode.window.showErrorMessage('Project not found.');
        return;
      }

      const projectName = await vscode.window.showInputBox({
        value: project.project_name,
        placeHolder: 'Project name',
        prompt: 'Enter a new name for the project'
      });

      if (!projectName) {
        return;
      }

      const projectDescription = await vscode.window.showInputBox({
        value: project.project_description,
        placeHolder: 'Project description (optional)',
        prompt: 'Enter a new description for the project'
      });

      await dbService.updateProject(projectId, projectName, projectDescription || '');
      projectsProvider.refresh();
      vscode.window.showInformationMessage(`Project "${projectName}" updated.`);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('on-task.deleteProject', async (projectId: number) => {
      const project = await dbService.getProject(projectId);
      if (!project) {
        vscode.window.showErrorMessage('Project not found.');
        return;
      }

      const confirmation = await vscode.window.showWarningMessage(
        `Are you sure you want to delete project "${project.project_name}"? This will also delete all tasks and contexts associated with this project.`,
        { modal: true },
        'Delete'
      );

      if (confirmation === 'Delete') {
        await dbService.deleteProject(projectId);
        projectsProvider.refresh();
        tasksProvider.refresh();
        contextsProvider.refresh();
        vscode.window.showInformationMessage(`Project "${project.project_name}" deleted.`);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('on-task.cleanupProject', async (projectId: number) => {
      const project = await dbService.getProject(projectId);
      if (!project) {
        vscode.window.showErrorMessage('Project not found.');
        return;
      }

      await dbService.cleanupProject(projectId);
      projectsProvider.refresh();
      tasksProvider.refresh();
      contextsProvider.refresh();
      vscode.window.showInformationMessage(`Project "${project.project_name}" cleaned up.`);
    })
  );

  // Task commands
  context.subscriptions.push(
    vscode.commands.registerCommand('on-task.createTask', async () => {
      const projects = await dbService.getProjects();
      if (projects.length === 0) {
        vscode.window.showErrorMessage('Please create a project first.');
        return;
      }

      const projectItems = projects.map(p => ({
        label: p.project_name,
        description: p.project_description,
        id: p.project_id
      }));

      const selectedProject = await vscode.window.showQuickPick(projectItems, {
        placeHolder: 'Select a project for this task'
      });

      if (!selectedProject) {
        return;
      }

      const taskName = await vscode.window.showInputBox({
        placeHolder: 'Task name',
        prompt: 'Enter a name for the new task'
      });

      if (!taskName) {
        return;
      }

      const taskDescription = await vscode.window.showInputBox({
        placeHolder: 'Task description (optional)',
        prompt: 'Enter a description for the new task'
      });

      await dbService.createTask(selectedProject.id, taskName, taskDescription || '');
      tasksProvider.refresh();
      vscode.window.showInformationMessage(`Task "${taskName}" created.`);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('on-task.editTask', async (taskId: number) => {
      const task = await dbService.getTask(taskId);
      if (!task) {
        vscode.window.showErrorMessage('Task not found.');
        return;
      }

      const taskName = await vscode.window.showInputBox({
        value: task.task_name,
        placeHolder: 'Task name',
        prompt: 'Enter a new name for the task'
      });

      if (!taskName) {
        return;
      }

      const taskDescription = await vscode.window.showInputBox({
        value: task.task_description,
        placeHolder: 'Task description (optional)',
        prompt: 'Enter a new description for the task'
      });

      await dbService.updateTask(taskId, taskName, taskDescription || '');
      tasksProvider.refresh();
      vscode.window.showInformationMessage(`Task "${taskName}" updated.`);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('on-task.deleteTask', async (taskId: number) => {
      const task = await dbService.getTask(taskId);
      if (!task) {
        vscode.window.showErrorMessage('Task not found.');
        return;
      }

      const confirmation = await vscode.window.showWarningMessage(
        `Are you sure you want to delete task "${task.task_name}"? This will also delete all contexts associated with this task.`,
        { modal: true },
        'Delete'
      );

      if (confirmation === 'Delete') {
        await dbService.deleteTask(taskId);
        tasksProvider.refresh();
        contextsProvider.refresh();
        vscode.window.showInformationMessage(`Task "${task.task_name}" deleted.`);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('on-task.toggleTaskStatus', async (taskId: number) => {
      const task = await dbService.getTask(taskId);
      if (!task) {
        vscode.window.showErrorMessage('Task not found.');
        return;
      }

      const newStatus = task.task_status === 'done' ? 'pending' : 'done';
      await dbService.updateTaskStatus(taskId, newStatus);
      tasksProvider.refresh();
      vscode.window.showInformationMessage(`Task "${task.task_name}" marked as ${newStatus}.`);
    })
  );

  // Context commands
  context.subscriptions.push(
    vscode.commands.registerCommand('on-task.createContext', async () => {
      const projects = await dbService.getProjects();
      if (projects.length === 0) {
        vscode.window.showErrorMessage('Please create a project first.');
        return;
      }

      const projectItems = projects.map(p => ({
        label: p.project_name,
        description: p.project_description,
        id: p.project_id
      }));

      const selectedProject = await vscode.window.showQuickPick(projectItems, {
        placeHolder: 'Select a project for this context'
      });

      if (!selectedProject) {
        return;
      }

      const tasks = await dbService.getTasksByProject(selectedProject.id);
      if (tasks.length === 0) {
        vscode.window.showErrorMessage('Please create a task in this project first.');
        return;
      }

      const taskItems = tasks.map(t => ({
        label: t.task_name,
        description: t.task_description,
        id: t.task_id
      }));

      const selectedTask = await vscode.window.showQuickPick(taskItems, {
        placeHolder: 'Select a task for this context'
      });

      if (!selectedTask) {
        return;
      }

      const contextDescription = await vscode.window.showInputBox({
        placeHolder: 'Context description',
        prompt: 'Enter a description for the new context'
      });

      if (!contextDescription) {
        return;
      }

      await dbService.createContext(selectedProject.id, selectedTask.id, contextDescription);
      contextsProvider.refresh();
      vscode.window.showInformationMessage(`Context created for task "${selectedTask.label}".`);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('on-task.editContext', async (contextId: number) => {
      const context = await dbService.getContext(contextId);
      if (!context) {
        vscode.window.showErrorMessage('Context not found.');
        return;
      }

      const contextDescription = await vscode.window.showInputBox({
        value: context.context_description,
        placeHolder: 'Context description',
        prompt: 'Enter a new description for the context'
      });

      if (!contextDescription) {
        return;
      }

      await dbService.updateContext(contextId, contextDescription);
      contextsProvider.refresh();
      vscode.window.showInformationMessage('Context updated.');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('on-task.deleteContext', async (contextId: number) => {
      const context = await dbService.getContext(contextId);
      if (!context) {
        vscode.window.showErrorMessage('Context not found.');
        return;
      }

      const confirmation = await vscode.window.showWarningMessage(
        'Are you sure you want to delete this context?',
        { modal: true },
        'Delete'
      );

      if (confirmation === 'Delete') {
        await dbService.deleteContext(contextId);
        contextsProvider.refresh();
        vscode.window.showInformationMessage('Context deleted.');
      }
    })
  );

  // MCP configuration command
  context.subscriptions.push(
    vscode.commands.registerCommand('on-task.configureMcp', async () => {
      const isMcpConfigured = await mcpServer.checkMcpConfiguration();
      
      if (isMcpConfigured) {
        vscode.window.showInformationMessage('MCP is already configured for On Task.');
        return;
      }

      const confirmation = await vscode.window.showInformationMessage(
        'MCP is not configured for On Task. Would you like to add it to your MCP configuration?',
        'Yes',
        'No'
      );

      if (confirmation === 'Yes') {
        const success = await mcpServer.configureMcp();
        if (success) {
          vscode.window.showInformationMessage('MCP configured successfully for On Task.');
        } else {
          vscode.window.showErrorMessage('Failed to configure MCP for On Task.');
        }
      }
    })
  );
}

export function deactivate() {
  // Clean up resources
}
