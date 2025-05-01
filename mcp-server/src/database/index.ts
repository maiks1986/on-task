import * as fs from 'fs';
import * as path from 'path';
import Database from 'better-sqlite3';

// Define the database path - store it in the user's home directory
const DB_DIR = path.join(process.env.APPDATA || process.env.HOME || '.', '.on-task');
const DB_PATH = path.join(DB_DIR, 'on-task.db');

// Ensure the database directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
  console.log(`Created database directory at ${DB_DIR}`);
}

// Initialize the database connection
export const db = new Database(DB_PATH, { verbose: console.log });
console.log(`Connected to database at ${DB_PATH}`);

// Initialize schema if needed
function initializeSchema() {
  // Create projects table
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create tasks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'todo',
      priority INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
    )
  `);

  // Create contexts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS contexts (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
    )
  `);

  console.log('Database schema initialized');
}

// Initialize the schema
initializeSchema();

// Export database instance
export default db;
