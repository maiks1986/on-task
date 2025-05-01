import * as fs from 'fs';
import * as path from 'path';
import { Project, Task, Context } from '../types';

// Constants for data file paths
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const CONTEXTS_FILE = path.join(DATA_DIR, 'contexts.json');

// Initialize data directory if it doesn't exist
export function initializeDataStorage(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Initialize data files if they don't exist
  if (!fs.existsSync(PROJECTS_FILE)) {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify([]));
  }

  if (!fs.existsSync(TASKS_FILE)) {
    fs.writeFileSync(TASKS_FILE, JSON.stringify([]));
  }

  if (!fs.existsSync(CONTEXTS_FILE)) {
    fs.writeFileSync(CONTEXTS_FILE, JSON.stringify([]));
  }
}

// Helper functions for data access
export function readProjects(): Project[] {
  return JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf8'));
}

export function writeProjects(projects: Project[]): void {
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
}

export function readTasks(): Task[] {
  return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
}

export function writeTasks(tasks: Task[]): void {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
}

export function readContexts(): Context[] {
  return JSON.parse(fs.readFileSync(CONTEXTS_FILE, 'utf8'));
}

export function writeContexts(contexts: Context[]): void {
  fs.writeFileSync(CONTEXTS_FILE, JSON.stringify(contexts, null, 2));
}
