const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const mcpServerUtils = require('./mcp-server-utilis');

/**
 * Simple implementation of the On Task extension
 * Compatible with VS Code and derivatives like Windsurf
 */

class OnTaskItem extends vscode.TreeItem {
  constructor(id, label, description = '', contextValue = '', status = '') {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.id = id;
    this.description = description;
    this.tooltip = `${label} ${description ? '- ' + description : ''}`;
    
    // Set the icon based on status for tasks
    if (contextValue === 'task') {
      this.iconPath = new vscode.ThemeIcon(status === 'Done' ? 'check' : 'circle-outline');
    } else {
      this.iconPath = new vscode.ThemeIcon(contextValue === 'project' ? 'folder' : 'symbol-namespace');
    }
    
    // Set contextValue to enable context menu items
    this.contextValue = contextValue;
  }
}

class OnTaskDataProvider {
  constructor(items = [], type = '') {
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this._items = items;
    this._type = type;
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element) {
    return element;
  }

  getChildren() {
    return Promise.resolve(this._items);
  }

  // Add a new item
  addItem(item) {
    this._items.push(item);
    this.refresh();
  }

  // Update an existing item
  updateItem(id, newLabel, newDescription) {
    const index = this._items.findIndex(item => item.id === id);
    if (index !== -1) {
      const item = this._items[index];
      item.label = newLabel;
      item.description = newDescription;
      this.refresh();
    }
  }

  // Toggle task status
  toggleTaskStatus(id) {
    const index = this._items.findIndex(item => item.id === id);
    if (index !== -1 && this._type === 'task') {
      const item = this._items[index];
      const newStatus = item.description === 'Done' ? 'Pending' : 'Done';
      item.description = newStatus;
      item.iconPath = new vscode.ThemeIcon(newStatus === 'Done' ? 'check' : 'circle-outline');
      this.refresh();
    }
  }

  // Delete an item
  deleteItem(id) {
    const index = this._items.findIndex(item => item.id === id);
    if (index !== -1) {
      this._items.splice(index, 1);
      this.refresh();
    }
  }

  // Get an item by ID
  getItem(id) {
    return this._items.find(item => item.id === id);
  }
}

/**
 * Create and show a webview panel for forms
 * @param {vscode.ExtensionContext} context - The extension context
 * @param {string} formType - The type of form to show (project, task, context)
 * @param {object} item - Optional item data for editing
 * @returns {vscode.WebviewPanel} The created webview panel
 */
function createFormPanel(context, formType, item = null) {
  // Create panel
  const panel = vscode.window.createWebviewPanel(
    `on-task-${formType}-form`,
    `${formType.charAt(0).toUpperCase() + formType.slice(1)} Form`,
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'webviews'))]
    }
  );

  // Get path to HTML file
  const htmlPath = path.join(context.extensionPath, 'webviews', `${formType}-form.html`);
  let html = fs.readFileSync(htmlPath, 'utf8');

  // Set webview HTML
  panel.webview.html = html;

  return panel;
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log('On Task (Simple) extension is now active!');

  // Create sample data
  const projectItems = [
    new OnTaskItem('project-1', 'Sample Project 1', 'Active', 'project'),
    new OnTaskItem('project-2', 'Sample Project 2', 'Completed', 'project')
  ];

  const taskItems = [
    new OnTaskItem('task-1', 'Sample Task 1', 'Pending', 'task'),
    new OnTaskItem('task-2', 'Sample Task 2', 'Done', 'task', 'Done')
  ];

  const contextItems = [
    new OnTaskItem('context-1', 'Sample Context 1', 'Project 1', 'context'),
    new OnTaskItem('context-2', 'Sample Context 2', 'Project 2', 'context')
  ];

  // Create tree data providers
  const projectsProvider = new OnTaskDataProvider(projectItems, 'project');
  const tasksProvider = new OnTaskDataProvider(taskItems, 'task');
  const contextsProvider = new OnTaskDataProvider(contextItems, 'context');

  // Register tree data providers
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('onTaskProjects', projectsProvider),
    vscode.window.registerTreeDataProvider('onTaskTasks', tasksProvider),
    vscode.window.registerTreeDataProvider('onTaskContexts', contextsProvider)
  );

  // Create status bar item
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.text = "$(checklist) On Task";
  statusBarItem.tooltip = "On Task extension is active";
  statusBarItem.command = 'on-task-simple.showWelcomeMessage';
  statusBarItem.show();

  // Register welcome command
  const welcomeCommand = vscode.commands.registerCommand('on-task-simple.showWelcomeMessage', () => {
    vscode.window.showInformationMessage('Welcome to On Task!');
  });

  // Register Project commands
  context.subscriptions.push(vscode.commands.registerCommand('on-task-simple.createProject', async () => {
    // Create and show project form panel
    const panel = createFormPanel(context, 'project');
    
    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(message => {
      if (message.type === 'save') {
        // Create new project
        const project = message.project;
        const id = project.id || `project-${Date.now()}`;
        projectsProvider.addItem(new OnTaskItem(
          id, 
          project.name, 
          project.status || 'Active', 
          'project'
        ));
        vscode.window.showInformationMessage(`Project '${project.name}' created.`);
        panel.dispose();
      } else if (message.type === 'cancel') {
        panel.dispose();
      }
    });
  }));

  context.subscriptions.push(vscode.commands.registerCommand('on-task-simple.editProject', async (item) => {
    if (!item) return;
    
    // Create and show project form panel
    const panel = createFormPanel(context, 'project', item);
    
    // Send project data to the webview
    panel.webview.postMessage({
      type: 'edit',
      project: {
        id: item.id,
        name: item.label,
        description: item.description,
        status: item.description
      }
    });
    
    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(message => {
      if (message.type === 'save') {
        // Update project
        const project = message.project;
        projectsProvider.updateItem(project.id, project.name, project.status);
        vscode.window.showInformationMessage(`Project updated to '${project.name}'.`);
        panel.dispose();
      } else if (message.type === 'cancel') {
        panel.dispose();
      }
    });
  }));

  context.subscriptions.push(vscode.commands.registerCommand('on-task-simple.deleteProject', async (item) => {
    if (!item) return;
    
    const confirmation = await vscode.window.showWarningMessage(
      `Are you sure you want to delete project '${item.label}'?`,
      { modal: true },
      'Delete'
    );
    
    if (confirmation === 'Delete') {
      projectsProvider.deleteItem(item.id);
      vscode.window.showInformationMessage(`Project '${item.label}' deleted.`);
    }
  }));

  // Register Task commands
  context.subscriptions.push(vscode.commands.registerCommand('on-task-simple.createTask', async () => {
    // Create and show task form panel
    const panel = createFormPanel(context, 'task');
    
    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(message => {
      if (message.type === 'save') {
        // Create new task
        const task = message.task;
        const id = task.id || `task-${Date.now()}`;
        tasksProvider.addItem(new OnTaskItem(
          id, 
          task.name, 
          task.status || 'Pending', 
          'task',
          task.status === 'Done' ? 'Done' : ''
        ));
        vscode.window.showInformationMessage(`Task '${task.name}' created.`);
        panel.dispose();
      } else if (message.type === 'cancel') {
        panel.dispose();
      }
    });
  }));

  context.subscriptions.push(vscode.commands.registerCommand('on-task-simple.editTask', async (item) => {
    if (!item) return;
    
    // Create and show task form panel
    const panel = createFormPanel(context, 'task', item);
    
    // Send task data to the webview
    panel.webview.postMessage({
      type: 'edit',
      task: {
        id: item.id,
        name: item.label,
        description: '',
        status: item.description,
        priority: 'Medium',
        dueDate: ''
      }
    });
    
    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(message => {
      if (message.type === 'save') {
        // Update task
        const task = message.task;
        tasksProvider.updateItem(task.id, task.name, task.status);
        vscode.window.showInformationMessage(`Task updated to '${task.name}'.`);
        panel.dispose();
      } else if (message.type === 'cancel') {
        panel.dispose();
      }
    });
  }));

  context.subscriptions.push(vscode.commands.registerCommand('on-task-simple.toggleTaskStatus', (item) => {
    if (!item) return;
    
    tasksProvider.toggleTaskStatus(item.id);
    const newStatus = tasksProvider.getItem(item.id).description;
    vscode.window.showInformationMessage(`Task '${item.label}' marked as ${newStatus}.`);
  }));

  context.subscriptions.push(vscode.commands.registerCommand('on-task-simple.deleteTask', async (item) => {
    if (!item) return;
    
    const confirmation = await vscode.window.showWarningMessage(
      `Are you sure you want to delete task '${item.label}'?`,
      { modal: true },
      'Delete'
    );
    
    if (confirmation === 'Delete') {
      tasksProvider.deleteItem(item.id);
      vscode.window.showInformationMessage(`Task '${item.label}' deleted.`);
    }
  }));

  // Register Context commands
  context.subscriptions.push(vscode.commands.registerCommand('on-task-simple.createContext', async () => {
    // Create and show context form panel
    const panel = createFormPanel(context, 'context');
    
    // Send projects and tasks data to the webview
    panel.webview.postMessage({
      projects: projectItems.map(item => ({ id: item.id, name: item.label })),
      tasks: taskItems.map(item => ({ id: item.id, name: item.label }))
    });
    
    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(message => {
      if (message.type === 'save') {
        // Create new context
        const context = message.context;
        const id = context.id || `context-${Date.now()}`;
        const description = context.taskId ? 
          taskItems.find(t => t.id === context.taskId)?.label || 'Task' : 
          'New Context';
        
        contextsProvider.addItem(new OnTaskItem(id, context.name, description, 'context'));
        vscode.window.showInformationMessage(`Context '${context.name}' created.`);
        panel.dispose();
      } else if (message.type === 'cancel') {
        panel.dispose();
      }
    });
  }));

  context.subscriptions.push(vscode.commands.registerCommand('on-task-simple.editContext', async (item) => {
    if (!item) return;
    
    // Create and show context form panel
    const panel = createFormPanel(context, 'context', item);
    
    // Send context data to the webview along with projects and tasks
    panel.webview.postMessage({
      type: 'edit',
      context: {
        id: item.id,
        name: item.label,
        description: item.description
      },
      projects: projectItems.map(item => ({ id: item.id, name: item.label })),
      tasks: taskItems.map(item => ({ id: item.id, name: item.label }))
    });
    
    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(message => {
      if (message.type === 'save') {
        // Update context
        const context = message.context;
        const description = context.taskId ? 
          taskItems.find(t => t.id === context.taskId)?.label || 'Task' : 
          item.description;
        
        contextsProvider.updateItem(context.id, context.name, description);
        vscode.window.showInformationMessage(`Context updated to '${context.name}'.`);
        panel.dispose();
      } else if (message.type === 'cancel') {
        panel.dispose();
      }
    });
  }));

  context.subscriptions.push(vscode.commands.registerCommand('on-task-simple.deleteContext', async (item) => {
    if (!item) return;
    
    const confirmation = await vscode.window.showWarningMessage(
      `Are you sure you want to delete context '${item.label}'?`,
      { modal: true },
      'Delete'
    );
    
    if (confirmation === 'Delete') {
      contextsProvider.deleteItem(item.id);
      vscode.window.showInformationMessage(`Context '${item.label}' deleted.`);
    }
  }));

  // Register MCP Server management command
  context.subscriptions.push(vscode.commands.registerCommand('on-task-simple.manageMCPServer', () => {
    // Create and show MCP server management panel
    const panel = createFormPanel(context, 'mcp-panel');
    
    // Check MCP server status
    checkMCPServerStatus(panel);
    
    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(message => {
      switch (message.type) {
        case 'checkServerStatus':
          checkMCPServerStatus(panel);
          break;
        case 'installServer':
          installMCPServer(panel);
          break;
        case 'copyServerCode':
          mcpServerUtils.copyMCPServerCode();
          break;
      }
    });
  }));

  // Add all disposables to context
  context.subscriptions.push(statusBarItem, welcomeCommand);
}

/**
 * Check MCP server status and update the panel
 * @param {vscode.WebviewPanel} panel 
 */
async function checkMCPServerStatus(panel) {
  const status = await mcpServerUtils.checkMCPServerStatus();
  panel.webview.postMessage({
    type: 'serverStatus',
    status
  });
}



/**
 * Install the MCP server and update the panel
 * @param {vscode.WebviewPanel} panel 
 */
async function installMCPServer(panel) {
  await mcpServerUtils.installMCPServer();
  checkMCPServerStatus(panel);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
