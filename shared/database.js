const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Constants for data file paths
const DATA_DIR = path.join(__dirname, '..', 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const CONTEXTS_FILE = path.join(DATA_DIR, 'contexts.json');

// Initialize data directory if it doesn't exist
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

// Project operations
function getAllProjects() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM projects', [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function getProject(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM projects WHERE id = ?', [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function addProject(name, description = '') {
  return new Promise((resolve, reject) => {
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    
    db.run(
      'INSERT INTO projects (id, name, description, status, createdAt) VALUES (?, ?, ?, ?, ?)',
      [id, name, description, 'Active', createdAt],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id,
            name,
            description,
            status: 'Active',
            createdAt
          });
        }
      }
    );
  });
}

function updateProject(id, name, description) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE projects SET name = ?, description = ? WHERE id = ?',
      [name, description, id],
      function(err) {
        if (err) {
          reject(err);
        } else {
          if (this.changes === 0) {
            reject(new Error('Project not found'));
          } else {
            resolve({ id, name, description });
          }
        }
      }
    );
  });
}

function deleteProject(id) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM projects WHERE id = ?', [id], function(err) {
      if (err) {
        reject(err);
      } else {
        if (this.changes === 0) {
          reject(new Error('Project not found'));
        } else {
          resolve({ success: true, message: 'Project deleted' });
        }
      }
    });
  });
}

function cleanupProject(id) {
  return new Promise((resolve, reject) => {
    db.run('UPDATE projects SET status = ? WHERE id = ?', ['Completed', id], function(err) {
      if (err) {
        reject(err);
      } else {
        if (this.changes === 0) {
          reject(new Error('Project not found'));
        } else {
          resolve({ success: true, message: 'Project marked as completed' });
        }
      }
    });
  });
}

// Task operations
function getAllTasks() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM tasks', [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function getTask(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function getTasksByProject(projectId) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM tasks WHERE projectId = ?', [projectId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function addTask(name, description = '', priority = 'Medium', projectId = null) {
  return new Promise((resolve, reject) => {
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    
    db.run(
      'INSERT INTO tasks (id, name, description, status, priority, projectId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name, description, 'Pending', priority, projectId, createdAt],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id,
            name,
            description,
            status: 'Pending',
            priority,
            projectId,
            createdAt
          });
        }
      }
    );
  });
}

function updateTask(id, name, description, priority, projectId) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE tasks SET name = ?, description = ?, priority = ?, projectId = ? WHERE id = ?',
      [name, description, priority, projectId, id],
      function(err) {
        if (err) {
          reject(err);
        } else {
          if (this.changes === 0) {
            reject(new Error('Task not found'));
          } else {
            resolve({ id, name, description, priority, projectId });
          }
        }
      }
    );
  });
}

function deleteTask(id) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM tasks WHERE id = ?', [id], function(err) {
      if (err) {
        reject(err);
      } else {
        if (this.changes === 0) {
          reject(new Error('Task not found'));
        } else {
          resolve({ success: true, message: 'Task deleted' });
        }
      }
    });
  });
}

function markTaskDone(id) {
  return new Promise((resolve, reject) => {
    db.run('UPDATE tasks SET status = ? WHERE id = ?', ['Done', id], function(err) {
      if (err) {
        reject(err);
      } else {
        if (this.changes === 0) {
          reject(new Error('Task not found'));
        } else {
          resolve({ success: true, message: 'Task marked as done' });
        }
      }
    });
  });
}

// Context operations
function getAllContexts() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM contexts', [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function getContext(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM contexts WHERE id = ?', [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function getContextsByTask(taskId) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM contexts WHERE taskId = ?', [taskId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function addContext(name, description = '', taskId = null) {
  return new Promise((resolve, reject) => {
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    
    db.run(
      'INSERT INTO contexts (id, name, description, taskId, createdAt) VALUES (?, ?, ?, ?, ?)',
      [id, name, description, taskId, createdAt],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id,
            name,
            description,
            taskId,
            createdAt
          });
        }
      }
    );
  });
}

function updateContext(id, name, description, taskId) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE contexts SET name = ?, description = ?, taskId = ? WHERE id = ?',
      [name, description, taskId, id],
      function(err) {
        if (err) {
          reject(err);
        } else {
          if (this.changes === 0) {
            reject(new Error('Context not found'));
          } else {
            resolve({ id, name, description, taskId });
          }
        }
      }
    );
  });
}

function deleteContext(id) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM contexts WHERE id = ?', [id], function(err) {
      if (err) {
        reject(err);
      } else {
        if (this.changes === 0) {
          reject(new Error('Context not found'));
        } else {
          resolve({ success: true, message: 'Context deleted' });
        }
      }
    });
  });
}

// Close the database connection when the process exits
process.on('exit', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
  });
});

// Export all functions
module.exports = {
  // Project operations
  getAllProjects,
  getProject,
  addProject,
  updateProject,
  deleteProject,
  cleanupProject,
  
  // Task operations
  getAllTasks,
  getTask,
  getTasksByProject,
  addTask,
  updateTask,
  deleteTask,
  markTaskDone,
  
  // Context operations
  getAllContexts,
  getContext,
  getContextsByTask,
  addContext,
  updateContext,
  deleteContext
};
