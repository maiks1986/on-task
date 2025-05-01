import * as path from 'path';
import * as fs from 'fs';
import Database from 'better-sqlite3';

// Database file path
const DB_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DB_DIR, 'ontask.db');

console.log('Database directory:', DB_DIR);
console.log('Database file:', DB_FILE);

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  console.log('Creating data directory...');
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initialize database connection
let db: Database.Database;
try {
  db = new Database(DB_FILE);
  console.log('Database connection established');
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
} catch (error) {
  console.error('Error connecting to database:', error);
  throw error;
}

// Create tables if they don't exist
function initializeDatabase() {
  try {
    console.log('Creating database tables...');
    
    // Projects table
    db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Projects table created or already exists');

    // Tasks table
    db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'Pending',
        priority TEXT DEFAULT 'Medium',
        project_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);
    console.log('Tasks table created or already exists');

    // Contexts table
    db.exec(`
      CREATE TABLE IF NOT EXISTS contexts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        task_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
      )
    `);
    console.log('Contexts table created or already exists');
    
    // Verify tables exist
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('projects', 'tasks', 'contexts')").all() as { name: string }[];
    console.log('Verified tables:', tables.map(t => t.name).join(', '));
    
    if (tables.length < 3) {
      console.warn(`Some tables are missing. Expected 3 tables, found ${tables.length}`);
    }
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Initialize the database
initializeDatabase();

export default db;
