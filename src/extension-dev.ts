import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  console.log('On Task extension is now active!');

  // Register a simple command for testing
  const disposable = vscode.commands.registerCommand('on-task.showWelcomeMessage', () => {
    vscode.window.showInformationMessage('Welcome to On Task! This is a development version.');
  });

  // Create a status bar item
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.text = "$(check) On Task";
  statusBarItem.tooltip = "On Task extension is active";
  statusBarItem.command = 'on-task.showWelcomeMessage';
  statusBarItem.show();

  // Register a simple tree data provider for the views
  const projectsProvider = new SimpleTreeDataProvider('Projects');
  const tasksProvider = new SimpleTreeDataProvider('Tasks');
  const contextsProvider = new SimpleTreeDataProvider('Contexts');

  vscode.window.registerTreeDataProvider('onTaskProjects', projectsProvider);
  vscode.window.registerTreeDataProvider('onTaskTasks', tasksProvider);
  vscode.window.registerTreeDataProvider('onTaskContexts', contextsProvider);

  context.subscriptions.push(disposable, statusBarItem);
}

export function deactivate() {}

class SimpleTreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | null | void> = new vscode.EventEmitter<TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor(private viewName: string) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TreeItem): Thenable<TreeItem[]> {
    if (element) {
      return Promise.resolve([]);
    }

    // Return sample items for each view
    if (this.viewName === 'Projects') {
      return Promise.resolve([
        new TreeItem('Sample Project 1', vscode.TreeItemCollapsibleState.None),
        new TreeItem('Sample Project 2', vscode.TreeItemCollapsibleState.None)
      ]);
    } else if (this.viewName === 'Tasks') {
      return Promise.resolve([
        new TreeItem('Sample Task 1', vscode.TreeItemCollapsibleState.None),
        new TreeItem('Sample Task 2', vscode.TreeItemCollapsibleState.None)
      ]);
    } else if (this.viewName === 'Contexts') {
      return Promise.resolve([
        new TreeItem('Sample Context 1', vscode.TreeItemCollapsibleState.None),
        new TreeItem('Sample Context 2', vscode.TreeItemCollapsibleState.None)
      ]);
    }

    return Promise.resolve([]);
  }
}

class TreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.tooltip = this.label;
  }
}
