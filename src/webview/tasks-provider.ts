import * as vscode from 'vscode';
import { DatabaseService, Task } from '../database/database-service';

export class TaskTreeItem extends vscode.TreeItem {
  constructor(
    public readonly task: Task,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(task.task_name, collapsibleState);
    
    this.tooltip = task.task_description;
    this.description = task.task_status === 'done' ? '(Done)' : '';
    this.contextValue = 'task';
    this.id = String(task.task_id);
    
    // Use different icons based on task status
    this.iconPath = new vscode.ThemeIcon(
      task.task_status === 'done' ? 'check' : 'circle-outline'
    );
    
    this.command = {
      command: 'on-task.selectTask',
      title: 'Select Task',
      arguments: [task.task_id]
    };
  }
}

export class TasksProvider implements vscode.TreeDataProvider<TaskTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TaskTreeItem | undefined | null | void> = new vscode.EventEmitter<TaskTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<TaskTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;
  
  private selectedProjectId: number | undefined;

  constructor(private dbService: DatabaseService) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  setSelectedProject(projectId: number | undefined): void {
    this.selectedProjectId = projectId;
    this.refresh();
  }

  getTreeItem(element: TaskTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: TaskTreeItem): Promise<TaskTreeItem[]> {
    if (element) {
      // Tasks don't have children in this implementation
      return [];
    } else {
      // Root level - show tasks for the selected project or all tasks
      let tasks: Task[];
      
      if (this.selectedProjectId) {
        tasks = await this.dbService.getTasksByProject(this.selectedProjectId);
      } else {
        tasks = await this.dbService.getTasks();
      }
      
      if (tasks.length === 0) {
        vscode.commands.executeCommand('setContext', 'onTaskHasTasks', false);
        return [new TaskTreeItem({
          task_id: -1,
          project_id: -1,
          task_name: 'No tasks found. Click + to create one.',
          task_description: '',
          task_status: 'pending',
          created_at: '',
          updated_at: ''
        }, vscode.TreeItemCollapsibleState.None)];
      }
      
      vscode.commands.executeCommand('setContext', 'onTaskHasTasks', true);
      return tasks.map(task => 
        new TaskTreeItem(task, vscode.TreeItemCollapsibleState.Collapsed)
      );
    }
  }
}
