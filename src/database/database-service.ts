import * as path from 'path';
import * as fs from 'fs';
import * as sqlite from 'better-sqlite3';

export interface Project {
  project_id: number;
  project_name: string;
  project_description: string;
  cleaned_up: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  task_id: number;
  project_id: number;
  task_name: string;
  task_description: string;
  task_status: string;
  priority?: number;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Context {
  context_id: number;
  project_id: number;
  task_id: number;
  context_description: string;
  created_at: string;
  updated_at: string;
}

export class DatabaseService {
  private db: sqlite.Database | null = null;
  private dbPath: string;

  constructor(storagePath: string) {
    // Ensure storage directory exists
    if (!fs.existsSync(storagePath)) {
      fs.mkdirSync(storagePath, { recursive: true });
    }
    
    this.dbPath = path.join(storagePath, 'on-task.db');
  }

  public async initialize(): Promise<void> {
    try {
      this.db = new sqlite(this.dbPath);
      
      // Enable foreign keys
      this.db.pragma('foreign_keys = ON');
      
      // Create tables if they don't exist
      this.createTables();
      
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  private createTables(): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Projects table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        project_id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_name TEXT NOT NULL,
        project_description TEXT,
        cleaned_up BOOLEAN NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tasks table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        task_id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        task_name TEXT NOT NULL,
        task_description TEXT,
        task_status TEXT NOT NULL DEFAULT 'pending',
        priority INTEGER,
        due_date DATETIME,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (project_id) ON DELETE CASCADE
      )
    `);

    // Contexts table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS contexts (
        context_id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        task_id INTEGER NOT NULL,
        context_description TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (project_id) ON DELETE CASCADE,
        FOREIGN KEY (task_id) REFERENCES tasks (task_id) ON DELETE CASCADE
      )
    `);
  }

  // Project operations
  public async getProjects(): Promise<Project[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(`
      SELECT * FROM projects ORDER BY project_name
    `);

    return stmt.all() as Project[];
  }

  public async getProject(projectId: number): Promise<Project | undefined> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(`
      SELECT * FROM projects WHERE project_id = ?
    `);

    return stmt.get(projectId) as Project | undefined;
  }

  public async createProject(name: string, description: string): Promise<number> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(`
      INSERT INTO projects (project_name, project_description)
      VALUES (?, ?)
    `);

    const result = stmt.run(name, description);
    return result.lastInsertRowid as number;
  }

  public async updateProject(projectId: number, name: string, description: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(`
      UPDATE projects
      SET project_name = ?, project_description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE project_id = ?
    `);

    stmt.run(name, description, projectId);
  }

  public async deleteProject(projectId: number): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(`
      DELETE FROM projects WHERE project_id = ?
    `);

    stmt.run(projectId);
  }

  public async cleanupProject(projectId: number): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(`
      UPDATE projects
      SET cleaned_up = 1, updated_at = CURRENT_TIMESTAMP
      WHERE project_id = ?
    `);

    stmt.run(projectId);
  }

  // Task operations
  public async getTasks(): Promise<Task[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(`
      SELECT * FROM tasks ORDER BY task_name
    `);

    return stmt.all() as Task[];
  }

  public async getTasksByProject(projectId: number): Promise<Task[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(`
      SELECT * FROM tasks WHERE project_id = ? ORDER BY task_name
    `);

    return stmt.all(projectId) as Task[];
  }

  public async getTask(taskId: number): Promise<Task | undefined> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(`
      SELECT * FROM tasks WHERE task_id = ?
    `);

    return stmt.get(taskId) as Task | undefined;
  }

  public async createTask(projectId: number, name: string, description: string): Promise<number> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(`
      INSERT INTO tasks (project_id, task_name, task_description)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(projectId, name, description);
    return result.lastInsertRowid as number;
  }

  public async updateTask(taskId: number, name: string, description: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(`
      UPDATE tasks
      SET task_name = ?, task_description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE task_id = ?
    `);

    stmt.run(name, description, taskId);
  }

  public async updateTaskStatus(taskId: number, status: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(`
      UPDATE tasks
      SET task_status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE task_id = ?
    `);

    stmt.run(status, taskId);
  }

  public async deleteTask(taskId: number): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(`
      DELETE FROM tasks WHERE task_id = ?
    `);

    stmt.run(taskId);
  }

  // Context operations
  public async getContexts(): Promise<Context[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(`
      SELECT * FROM contexts ORDER BY context_description
    `);

    return stmt.all() as Context[];
  }

  public async getContextsByTask(taskId: number): Promise<Context[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(`
      SELECT * FROM contexts WHERE task_id = ? ORDER BY context_description
    `);

    return stmt.all(taskId) as Context[];
  }

  public async getContext(contextId: number): Promise<Context | undefined> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(`
      SELECT * FROM contexts WHERE context_id = ?
    `);

    return stmt.get(contextId) as Context | undefined;
  }

  public async createContext(projectId: number, taskId: number, description: string): Promise<number> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(`
      INSERT INTO contexts (project_id, task_id, context_description)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(projectId, taskId, description);
    return result.lastInsertRowid as number;
  }

  public async updateContext(contextId: number, description: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(`
      UPDATE contexts
      SET context_description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE context_id = ?
    `);

    stmt.run(description, contextId);
  }

  public async deleteContext(contextId: number): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(`
      DELETE FROM contexts WHERE context_id = ?
    `);

    stmt.run(contextId);
  }
}
