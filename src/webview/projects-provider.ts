import * as vscode from 'vscode';
import { DatabaseService, Project } from '../database/database-service';

export class ProjectTreeItem extends vscode.TreeItem {
  constructor(
    public readonly project: Project,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(project.project_name, collapsibleState);
    
    this.tooltip = project.project_description;
    this.description = project.cleaned_up ? 'Cleaned up' : '';
    this.contextValue = 'project';
    this.id = String(project.project_id);
    
    this.iconPath = new vscode.ThemeIcon(project.cleaned_up ? 'archive' : 'folder');
    
    this.command = {
      command: 'on-task.selectProject',
      title: 'Select Project',
      arguments: [project.project_id]
    };
  }
}

export class ProjectsProvider implements vscode.TreeDataProvider<ProjectTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ProjectTreeItem | undefined | null | void> = new vscode.EventEmitter<ProjectTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<ProjectTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor(private dbService: DatabaseService) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ProjectTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: ProjectTreeItem): Promise<ProjectTreeItem[]> {
    if (element) {
      // Projects don't have children in this implementation
      return [];
    } else {
      // Root level - show all projects
      const projects = await this.dbService.getProjects();
      
      if (projects.length === 0) {
        vscode.commands.executeCommand('setContext', 'onTaskHasProjects', false);
        return [new ProjectTreeItem({
          project_id: -1,
          project_name: 'No projects found. Click + to create one.',
          project_description: '',
          cleaned_up: false,
          created_at: '',
          updated_at: ''
        }, vscode.TreeItemCollapsibleState.None)];
      }
      
      vscode.commands.executeCommand('setContext', 'onTaskHasProjects', true);
      return projects.map(project => 
        new ProjectTreeItem(project, vscode.TreeItemCollapsibleState.Collapsed)
      );
    }
  }
}
