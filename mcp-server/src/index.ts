import express from 'express';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import {
  Project, Task, Context,
  ProjectAddParams, ProjectEditParams,
  TaskAddParams, TaskEditParams, TaskGetParams, TaskDoneParams,
  ContextAddParams, ContextEditParams, ContextGetParams,
  ProjectResult, TaskResult, ContextResult,
  MCPRequest
} from './types';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Data storage
const DATA_DIR = path.join(__dirname, '..', 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const CONTEXTS_FILE = path.join(DATA_DIR, 'contexts.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize data files if they don't exist
function initializeDataFile<T>(filePath: string, initialData: T[] = []): void {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2));
  }
}

initializeDataFile<Project>(PROJECTS_FILE);
initializeDataFile<Task>(TASKS_FILE);
initializeDataFile<Context>(CONTEXTS_FILE);

// Helper functions to read and write data
function readData<T>(filePath: string): T[] {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading data from ${filePath}:`, error);
    return [];
  }
}

function writeData<T>(filePath: string, data: T[]): boolean {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing data to ${filePath}:`, error);
    return false;
  }
}

// MCP Server routes
app.post('/mcp/tools', (req, res) => {
  const { tool, params } = req.body as MCPRequest;
  
  console.log(`Tool called: ${tool}`);
  console.log('Params:', params);
  
  let result: ProjectResult | TaskResult | ContextResult;
  
  try {
    switch (tool) {
      // Project tools
      case 'project.add':
        result = addProject(params as ProjectAddParams);
        break;
      case 'project.edit':
        result = editProject(params as ProjectEditParams);
        break;
        
      // Task tools
      case 'task.add':
        result = addTask(params as TaskAddParams);
        break;
      case 'task.edit':
        result = editTask(params as TaskEditParams);
        break;
      case 'task.get':
        result = getTask(params as TaskGetParams);
        break;
      case 'task.done':
        result = markTaskDone(params as TaskDoneParams);
        break;
        
      // Context tools
      case 'context.add':
        result = addContext(params as ContextAddParams);
        break;
      case 'context.edit':
        result = editContext(params as ContextEditParams);
        break;
      case 'context.get':
        result = getContext(params as ContextGetParams);
        break;
        
      default:
        return res.status(400).json({ error: `Unknown tool: ${tool}` });
    }
    
    return res.json({ result });
  } catch (error) {
    console.error(`Error executing tool ${tool}:`, error);
    return res.status(500).json({ error: (error as Error).message });
  }
});

// Tool implementations
function addProject(params: ProjectAddParams): ProjectResult {
  const { name, description } = params;
  
  if (!name) {
    throw new Error('Project name is required');
  }
  
  const projects = readData<Project>(PROJECTS_FILE);
  
  const newProject: Project = {
    id: uuidv4(),
    name,
    description: description || '',
    status: 'Active',
    createdAt: new Date().toISOString()
  };
  
  projects.push(newProject);
  writeData<Project>(PROJECTS_FILE, projects);
  
  return { project: newProject };
}

function editProject(params: ProjectEditParams): ProjectResult {
  const { id, name, description } = params;
  
  if (!id) {
    throw new Error('Project ID is required');
  }
  
  const projects = readData<Project>(PROJECTS_FILE);
  const projectIndex = projects.findIndex(p => p.id === id);
  
  if (projectIndex === -1) {
    throw new Error(`Project with ID ${id} not found`);
  }
  
  const project = projects[projectIndex];
  
  // Only allow editing name and description
  if (name) project.name = name;
  if (description !== undefined) project.description = description;
  
  // Update the project
  projects[projectIndex] = project;
  writeData<Project>(PROJECTS_FILE, projects);
  
  return { project };
}

function addTask(params: TaskAddParams): TaskResult {
  const { name, description, priority, projectId } = params;
  
  if (!name) {
    throw new Error('Task name is required');
  }
  
  const tasks = readData<Task>(TASKS_FILE);
  
  const newTask: Task = {
    id: uuidv4(),
    name,
    description: description || '',
    status: 'Pending',
    priority: priority || 'Medium',
    projectId: projectId || null,
    createdAt: new Date().toISOString()
  };
  
  tasks.push(newTask);
  writeData<Task>(TASKS_FILE, tasks);
  
  return { task: newTask };
}

function editTask(params: TaskEditParams): TaskResult {
  const { id, name, description, priority, projectId } = params;
  
  if (!id) {
    throw new Error('Task ID is required');
  }
  
  const tasks = readData<Task>(TASKS_FILE);
  const taskIndex = tasks.findIndex(t => t.id === id);
  
  if (taskIndex === -1) {
    throw new Error(`Task with ID ${id} not found`);
  }
  
  const task = tasks[taskIndex];
  
  // Only allow editing name, description, priority, and projectId
  if (name) task.name = name;
  if (description !== undefined) task.description = description;
  if (priority) task.priority = priority;
  if (projectId !== undefined) task.projectId = projectId;
  
  // Update the task
  tasks[taskIndex] = task;
  writeData<Task>(TASKS_FILE, tasks);
  
  return { task };
}

function getTask(params: TaskGetParams): TaskResult {
  const { id } = params;
  
  if (!id) {
    throw new Error('Task ID is required');
  }
  
  const tasks = readData<Task>(TASKS_FILE);
  const task = tasks.find(t => t.id === id);
  
  if (!task) {
    throw new Error(`Task with ID ${id} not found`);
  }
  
  return { task };
}

function markTaskDone(params: TaskDoneParams): TaskResult {
  const { id } = params;
  
  if (!id) {
    throw new Error('Task ID is required');
  }
  
  const tasks = readData<Task>(TASKS_FILE);
  const taskIndex = tasks.findIndex(t => t.id === id);
  
  if (taskIndex === -1) {
    throw new Error(`Task with ID ${id} not found`);
  }
  
  const task = tasks[taskIndex];
  task.status = 'Done';
  
  // Update the task
  tasks[taskIndex] = task;
  writeData<Task>(TASKS_FILE, tasks);
  
  return { task };
}

function addContext(params: ContextAddParams): ContextResult {
  const { name, description, taskId } = params;
  
  if (!name) {
    throw new Error('Context name is required');
  }
  
  const contexts = readData<Context>(CONTEXTS_FILE);
  
  const newContext: Context = {
    id: uuidv4(),
    name,
    description: description || '',
    taskId: taskId || null,
    createdAt: new Date().toISOString()
  };
  
  contexts.push(newContext);
  writeData<Context>(CONTEXTS_FILE, contexts);
  
  return { context: newContext };
}

function editContext(params: ContextEditParams): ContextResult {
  const { id, name, description, taskId } = params;
  
  if (!id) {
    throw new Error('Context ID is required');
  }
  
  const contexts = readData<Context>(CONTEXTS_FILE);
  const contextIndex = contexts.findIndex(c => c.id === id);
  
  if (contextIndex === -1) {
    throw new Error(`Context with ID ${id} not found`);
  }
  
  const context = contexts[contextIndex];
  
  // Only allow editing name, description, and taskId
  if (name) context.name = name;
  if (description !== undefined) context.description = description;
  if (taskId !== undefined) context.taskId = taskId;
  
  // Update the context
  contexts[contextIndex] = context;
  writeData<Context>(CONTEXTS_FILE, contexts);
  
  return { context };
}

function getContext(params: ContextGetParams): ContextResult {
  const { id } = params;
  
  if (!id) {
    throw new Error('Context ID is required');
  }
  
  const contexts = readData<Context>(CONTEXTS_FILE);
  const context = contexts.find(c => c.id === id);
  
  if (!context) {
    throw new Error(`Context with ID ${id} not found`);
  }
  
  return { context };
}

// Start the server
app.listen(PORT, () => {
  console.log(`MCP Server running on port ${PORT}`);
  console.log(`Available tools:`);
  console.log(`- project.add: Add a new project`);
  console.log(`- project.edit: Edit an existing project`);
  console.log(`- task.add: Add a new task`);
  console.log(`- task.edit: Edit an existing task`);
  console.log(`- task.get: Get a task by ID`);
  console.log(`- task.done: Mark a task as done`);
  console.log(`- context.add: Add a new context`);
  console.log(`- context.edit: Edit an existing context`);
  console.log(`- context.get: Get a context by ID`);
});
