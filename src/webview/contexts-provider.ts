import * as vscode from 'vscode';
import { DatabaseService, Context, Task } from '../database/database-service';

export class ContextTreeItem extends vscode.TreeItem {
  constructor(
    public readonly context: Context,
    public readonly task: Task | undefined,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(context.context_description, collapsibleState);
    
    this.contextValue = 'context';
    this.id = String(context.context_id);
    
    if (task) {
      this.description = `(${task.task_name})`;
      this.tooltip = `Task: ${task.task_name}\nDescription: ${task.task_description}\nStatus: ${task.task_status}`;
    }
    
    this.iconPath = new vscode.ThemeIcon('symbol-property');
    
    this.command = {
      command: 'on-task.selectContext',
      title: 'Select Context',
      arguments: [context.context_id]
    };
  }
}

export class ContextsProvider implements vscode.TreeDataProvider<ContextTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ContextTreeItem | undefined | null | void> = new vscode.EventEmitter<ContextTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<ContextTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;
  
  private selectedTaskId: number | undefined;

  constructor(private dbService: DatabaseService) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  setSelectedTask(taskId: number | undefined): void {
    this.selectedTaskId = taskId;
    this.refresh();
  }

  getTreeItem(element: ContextTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: ContextTreeItem): Promise<ContextTreeItem[]> {
    if (element) {
      // Contexts don't have children in this implementation
      return [];
    } else {
      // Root level - show contexts for the selected task or all contexts
      let contexts: Context[];
      
      if (this.selectedTaskId) {
        contexts = await this.dbService.getContextsByTask(this.selectedTaskId);
      } else {
        contexts = await this.dbService.getContexts();
      }
      
      if (contexts.length === 0) {
        vscode.commands.executeCommand('setContext', 'onTaskHasContexts', false);
        return [new ContextTreeItem({
          context_id: -1,
          project_id: -1,
          task_id: -1,
          context_description: 'No contexts found. Click + to create one.',
          created_at: '',
          updated_at: ''
        }, undefined, vscode.TreeItemCollapsibleState.None)];
      }
      
      vscode.commands.executeCommand('setContext', 'onTaskHasContexts', true);
      
      // Get all tasks to associate with contexts
      const tasks = await this.dbService.getTasks();
      const taskMap = new Map<number, Task>();
      tasks.forEach(task => taskMap.set(task.task_id, task));
      
      return contexts.map(context => {
        const associatedTask = taskMap.get(context.task_id);
        return new ContextTreeItem(context, associatedTask, vscode.TreeItemCollapsibleState.None);
      });
    }
  }
}
