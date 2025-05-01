const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const mcpServerUtils = require('./mcp-server-utilis');
const database = require('../shared/database');

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

  // Initialize empty data arrays
  const projectItems = [];
  const taskItems = [];
  const contextItems = [];

  // MCP Server will be accessed via status bar instead of tree view

  // Create tree data providers
  const projectsProvider = new OnTaskDataProvider(projectItems, 'project');
  const tasksProvider = new OnTaskDataProvider(taskItems, 'task');
  const contextsProvider = new OnTaskDataProvider(contextItems, 'context');
  
  // Function to fetch data from MCP server
  async function fetchDataFromMCP() {
    try {
      // Fetch projects using MCP tool
      const projectsResult = await vscode.commands.executeCommand('ot_get_all_projects');
      // Clear existing items
      projectsProvider._items = [];
      
      // Add new items if projects were returned
      if (projectsResult && projectsResult.projects) {
        projectsResult.projects.forEach(project => {
          projectsProvider.addItem(new OnTaskItem(
            project.id,
            project.name,
            project.description || '',
            'project'
          ));
        });
      }
      
      // Refresh the view
      projectsProvider.refresh();
      
      // Fetch tasks using MCP tool
      const tasksResult = await vscode.commands.executeCommand('ot_get_all_tasks');
      // Clear existing items
      tasksProvider._items = [];
      
      // Add new items if tasks were returned
      if (tasksResult && tasksResult.tasks) {
        tasksResult.tasks.forEach(task => {
          tasksProvider.addItem(new OnTaskItem(
            task.id,
          task.name,
          task.status || 'Pending',
          'task',
          task.status === 'Done' ? 'Done' : ''
        ));
      });
      }
      
      // Refresh the view
      tasksProvider.refresh();
      
      // Fetch contexts using MCP tool
      const contextsResult = await vscode.commands.executeCommand('ot_get_all_contexts');
      // Clear existing items
      contextsProvider._items = [];
      
      // Add new items if contexts were returned
      if (contextsResult && contextsResult.contexts) {
        contextsResult.contexts.forEach(context => {
          contextsProvider.addItem(new OnTaskItem(
            context.id,
            context.name,
            context.description || '',
            'context'
          ));
        });
      }
      
      // Refresh the view
      contextsProvider.refresh();
    } catch (error) {
      console.error('Error fetching data from MCP server:', error);
    }
  }
  
  // Set up polling to refresh data every 3 seconds
  const pollingInterval = setInterval(fetchDataFromMCP, 3000);
  
  // Make sure to clear the interval when the extension is deactivated
  context.subscriptions.push({ dispose: () => clearInterval(pollingInterval) });
  
  // Initial data fetch
  fetchDataFromMCP();

  // Register tree data providers
  vscode.window.registerTreeDataProvider('onTaskProjects', projectsProvider);
  vscode.window.registerTreeDataProvider('onTaskTasks', tasksProvider);
  vscode.window.registerTreeDataProvider('onTaskContexts', contextsProvider);
  
  // Create tree views
  const projectsTreeView = vscode.window.createTreeView('onTaskProjects', { treeDataProvider: projectsProvider });
  const tasksTreeView = vscode.window.createTreeView('onTaskTasks', { treeDataProvider: tasksProvider });
  const contextsTreeView = vscode.window.createTreeView('onTaskContexts', { treeDataProvider: contextsProvider });

  // Create status bar items
  // Commented out to reduce UI clutter - can be re-enabled if needed
  /*
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.text = "$(checklist) On Task";
  statusBarItem.tooltip = "On Task - Simple Task Management";
  statusBarItem.command = "on-task-simple.showWelcomeMessage";
  statusBarItem.show();
  */
  
  // Create MCP Server status bar item
  const mcpServerStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
  mcpServerStatusBarItem.text = "$(server) On Task MCP Server";
  mcpServerStatusBarItem.tooltip = "Open MCP Server Panel";
  mcpServerStatusBarItem.command = "on-task-simple.manageMCPServer";
  mcpServerStatusBarItem.show();

  // Register welcome command
  const welcomeCommand = vscode.commands.registerCommand('on-task-simple.showWelcomeMessage', () => {
    vscode.window.showInformationMessage('Welcome to On Task!');
  });

  // Register Project commands
  context.subscriptions.push(vscode.commands.registerCommand('on-task-simple.createProject', async () => {
    // Create and show project form panel
    const panel = createFormPanel(context, 'project');
    
    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(async message => {
      if (message.type === 'save') {
        try {
          // Create new project directly using the database
          const project = message.project;
          const result = await vscode.commands.executeCommand('ot_add_project', {
            name: project.name,
            description: project.description || ''
          });
          
          if (result && result.project) {
            vscode.window.showInformationMessage(`Project '${result.project.name}' created.`);
            // Trigger a refresh immediately
            fetchDataFromMCP();
          } else {
            vscode.window.showErrorMessage('Failed to create project.');
          }
        } catch (error) {
          console.error('Error creating project:', error);
          vscode.window.showErrorMessage(`Error creating project: ${error.message || 'Unknown error'}`);
        }
        panel.dispose();
      } else if (message.type === 'cancel') {
        panel.dispose();
      }
    });
  }));

  context.subscriptions.push(vscode.commands.registerCommand('on-task-simple.editProject', async (item) => {
    if (!item) return;
    
    // Create and show project form panel with existing data
    const panel = createFormPanel(context, 'project', item);
    
    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(async message => {
      if (message.type === 'save') {
        try {
          // Update project using MCP tool
          const project = message.project;
          const result = await vscode.commands.executeCommand('ot_edit_project', {
            id: item.id,
            name: project.name,
            description: project.description || ''
          });
          
          if (result && result.project) {
            vscode.window.showInformationMessage(`Project updated to '${result.project.name}'.`);
            // Trigger a refresh immediately
            fetchDataFromMCP();
          } else {
            vscode.window.showErrorMessage('Failed to update project.');
          }
        } catch (error) {
          console.error('Error updating project:', error);
          vscode.window.showErrorMessage(`Error updating project: ${error.message || 'Unknown error'}`);
        }
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
      try {
        // Delete project using MCP tool
        const result = await vscode.commands.executeCommand('ot_delete_project', {
          id: item.id
        });
        
        if (result && result.success) {
          vscode.window.showInformationMessage(`Project '${item.label}' deleted.`);
          // Trigger a refresh immediately
          fetchDataFromMCP();
        } else {
          vscode.window.showErrorMessage('Failed to delete project.');
        }
      } catch (error) {
        console.error('Error deleting project:', error);
        vscode.window.showErrorMessage(`Error deleting project: ${error.message || 'Unknown error'}`);
      }
    }
  }));

  // Register Task commands
  context.subscriptions.push(vscode.commands.registerCommand('on-task-simple.createTask', async () => {
    // Create and show task form panel
    const panel = createFormPanel(context, 'task');
    
    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(async message => {
      if (message.type === 'save') {
        try {
          // Create new task using MCP tool
          const task = message.task;
          const result = await vscode.commands.executeCommand('ot_add_task', {
            name: task.name,
            description: task.description || '',
            priority: task.priority || 'Medium',
            projectId: task.projectId
          });
          
          if (result && result.task) {
            vscode.window.showInformationMessage(`Task '${result.task.name}' created.`);
            // Trigger a refresh immediately
            fetchDataFromMCP();
          } else {
            vscode.window.showErrorMessage('Failed to create task.');
          }
        } catch (error) {
          console.error('Error creating task:', error);
          vscode.window.showErrorMessage(`Error creating task: ${error.message || 'Unknown error'}`);
        }
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
    panel.webview.onDidReceiveMessage(async message => {
      if (message.type === 'save') {
        try {
          // Update task using MCP tool
          const task = message.task;
          const result = await vscode.commands.executeCommand('ot_edit_task', {
            id: task.id,
            name: task.name,
            description: task.description || '',
            priority: task.priority || 'Medium',
            status: task.status || 'Pending'
          });
          
          if (result && result.task) {
            vscode.window.showInformationMessage(`Task '${result.task.name}' updated.`);
            // Trigger a refresh immediately
            fetchDataFromMCP();
          } else {
            vscode.window.showErrorMessage('Failed to update task.');
          }
        } catch (error) {
          console.error('Error updating task:', error);
          vscode.window.showErrorMessage(`Error updating task: ${error.message || 'Unknown error'}`);
        }
        // Success message already shown above
        panel.dispose();
      } else if (message.type === 'cancel') {
        panel.dispose();
      }
    });
  }));

  context.subscriptions.push(vscode.commands.registerCommand('on-task-simple.toggleTaskStatus', async (item) => {
    if (!item) return;
    
    try {
      // Mark task as done using MCP tool
      const result = await vscode.commands.executeCommand('ot_mark_task_done', {
        id: item.id
      });
      
      if (result && result.success) {
        vscode.window.showInformationMessage(`Task '${item.label}' marked as Done.`);
        // Trigger a refresh immediately
        fetchDataFromMCP();
      } else {
        vscode.window.showErrorMessage('Failed to update task status.');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      vscode.window.showErrorMessage(`Error updating task status: ${error.message || 'Unknown error'}`);
    }
  }));

  context.subscriptions.push(vscode.commands.registerCommand('on-task-simple.deleteTask', async (item) => {
    if (!item) return;
    
    const confirmation = await vscode.window.showWarningMessage(
      `Are you sure you want to delete task '${item.label}'?`,
      { modal: true },
      'Delete'
    );
    
    if (confirmation === 'Delete') {
      try {
        // Delete task using MCP tool
        const result = await vscode.commands.executeCommand('ot_delete_task', {
          id: item.id
        });
        
        if (result && result.success) {
          vscode.window.showInformationMessage(`Task '${item.label}' deleted.`);
          // Trigger a refresh immediately
          fetchDataFromMCP();
        } else {
          vscode.window.showErrorMessage('Failed to delete task.');
        }
      } catch (error) {
        console.error('Error deleting task:', error);
        vscode.window.showErrorMessage(`Error deleting task: ${error.message || 'Unknown error'}`);
      }
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
    const panel = createMCPPanel(context);
    
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

  // Register MCP Server panel click handler
  context.subscriptions.push(vscode.commands.registerCommand('on-task-simple.openMCPServerPanel', (item) => {
    vscode.commands.executeCommand('on-task-simple.manageMCPServer');
  }));

  // Add all disposables to context
  context.subscriptions.push(statusBarItem, mcpServerStatusBarItem, welcomeCommand);
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

/**
 * Create and show a webview panel for MCP server management
 * @param {vscode.ExtensionContext} context - The extension context
 * @returns {vscode.WebviewPanel} The created webview panel
 */
function createMCPPanel(context) {
  // Create panel
  const panel = vscode.window.createWebviewPanel(
    'on-task-mcp-panel',
    'On Task MCP Server Panel',
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'webviews'))]
    }
  );

  try {
    // Get path to HTML file
    const htmlPath = path.join(context.extensionPath, 'webviews', 'mcp-server-panel.html');
    
    // Check if the file exists
    if (!fs.existsSync(htmlPath)) {
      console.error(`MCP Server panel HTML file not found at ${htmlPath}`);
      // Fallback to the original mcp-panel.html if the new file doesn't exist
      const fallbackPath = path.join(context.extensionPath, 'webviews', 'mcp-panel.html');
      if (fs.existsSync(fallbackPath)) {
        console.log(`Using fallback MCP panel HTML file at ${fallbackPath}`);
        let html = fs.readFileSync(fallbackPath, 'utf8');
        panel.webview.html = html;
      } else {
        panel.webview.html = `<html><body><h1>Error: MCP panel HTML file not found</h1></body></html>`;
      }
    } else {
      // Read and set the HTML content
      let html = fs.readFileSync(htmlPath, 'utf8');
      panel.webview.html = html;
    }
  } catch (error) {
    console.error('Error loading MCP panel HTML:', error);
    panel.webview.html = `<html><body><h1>Error loading MCP panel</h1><p>${error.message}</p></body></html>`;
  }

  return panel;
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
