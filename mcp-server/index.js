const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Data storage
const DATA_DIR = path.join(__dirname, 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const CONTEXTS_FILE = path.join(DATA_DIR, 'contexts.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize data files if they don't exist
function initializeDataFile(filePath, initialData = []) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2));
  }
}

initializeDataFile(PROJECTS_FILE);
initializeDataFile(TASKS_FILE);
initializeDataFile(CONTEXTS_FILE);

// Helper functions to read and write data
function readData(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading data from ${filePath}:`, error);
    return [];
  }
}

function writeData(filePath, data) {
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
  const { tool, params } = req.body;
  
  console.log(`Tool called: ${tool}`);
  console.log('Params:', params);
  
  let result;
  
  try {
    switch (tool) {
      // Project tools
      case 'project.add':
        result = addProject(params);
        break;
      case 'project.edit':
        result = editProject(params);
        break;
        
      // Task tools
      case 'task.add':
        result = addTask(params);
        break;
      case 'task.edit':
        result = editTask(params);
        break;
      case 'task.get':
        result = getTask(params);
        break;
      case 'task.done':
        result = markTaskDone(params);
        break;
        
      // Context tools
      case 'context.add':
        result = addContext(params);
        break;
      case 'context.edit':
        result = editContext(params);
        break;
      case 'context.get':
        result = getContext(params);
        break;
        
      default:
        return res.status(400).json({ error: `Unknown tool: ${tool}` });
    }
    
    return res.json({ result });
  } catch (error) {
    console.error(`Error executing tool ${tool}:`, error);
    return res.status(500).json({ error: error.message });
  }
});

// Tool implementations
function addProject(params) {
  const { name, description } = params;
  
  if (!name) {
    throw new Error('Project name is required');
  }
  
  const projects = readData(PROJECTS_FILE);
  
  const newProject = {
    id: uuidv4(),
    name,
    description: description || '',
    status: 'Active',
    createdAt: new Date().toISOString()
  };
  
  projects.push(newProject);
  writeData(PROJECTS_FILE, projects);
  
  return { project: newProject };
}

function editProject(params) {
  const { id, name, description } = params;
  
  if (!id) {
    throw new Error('Project ID is required');
  }
  
  const projects = readData(PROJECTS_FILE);
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
  writeData(PROJECTS_FILE, projects);
  
  return { project };
}

function addTask(params) {
  const { name, description, priority, projectId } = params;
  
  if (!name) {
    throw new Error('Task name is required');
  }
  
  const tasks = readData(TASKS_FILE);
  
  const newTask = {
    id: uuidv4(),
    name,
    description: description || '',
    status: 'Pending',
    priority: priority || 'Medium',
    projectId: projectId || null,
    createdAt: new Date().toISOString()
  };
  
  tasks.push(newTask);
  writeData(TASKS_FILE, tasks);
  
  return { task: newTask };
}

function editTask(params) {
  const { id, name, description, priority, projectId } = params;
  
  if (!id) {
    throw new Error('Task ID is required');
  }
  
  const tasks = readData(TASKS_FILE);
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
  writeData(TASKS_FILE, tasks);
  
  return { task };
}

function getTask(params) {
  const { id } = params;
  
  if (!id) {
    throw new Error('Task ID is required');
  }
  
  const tasks = readData(TASKS_FILE);
  const task = tasks.find(t => t.id === id);
  
  if (!task) {
    throw new Error(`Task with ID ${id} not found`);
  }
  
  return { task };
}

function markTaskDone(params) {
  const { id } = params;
  
  if (!id) {
    throw new Error('Task ID is required');
  }
  
  const tasks = readData(TASKS_FILE);
  const taskIndex = tasks.findIndex(t => t.id === id);
  
  if (taskIndex === -1) {
    throw new Error(`Task with ID ${id} not found`);
  }
  
  const task = tasks[taskIndex];
  task.status = 'Done';
  
  // Update the task
  tasks[taskIndex] = task;
  writeData(TASKS_FILE, tasks);
  
  return { task };
}

function addContext(params) {
  const { name, description, taskId } = params;
  
  if (!name) {
    throw new Error('Context name is required');
  }
  
  const contexts = readData(CONTEXTS_FILE);
  
  const newContext = {
    id: uuidv4(),
    name,
    description: description || '',
    taskId: taskId || null,
    createdAt: new Date().toISOString()
  };
  
  contexts.push(newContext);
  writeData(CONTEXTS_FILE, contexts);
  
  return { context: newContext };
}

function editContext(params) {
  const { id, name, description, taskId } = params;
  
  if (!id) {
    throw new Error('Context ID is required');
  }
  
  const contexts = readData(CONTEXTS_FILE);
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
  writeData(CONTEXTS_FILE, contexts);
  
  return { context };
}

function getContext(params) {
  const { id } = params;
  
  if (!id) {
    throw new Error('Context ID is required');
  }
  
  const contexts = readData(CONTEXTS_FILE);
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
