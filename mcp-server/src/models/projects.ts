import { v4 as uuidv4 } from 'uuid';
import { Project } from '../types';
import { readProjects, writeProjects, readTasks, writeTasks, readContexts, writeContexts } from '../data/storage';

// Project operations
export async function getAllProjects(): Promise<Project[]> {
  return readProjects();
}

export async function getProject(id: string): Promise<Project | undefined> {
  const projects = readProjects();
  return projects.find(p => p.id === id);
}

export async function addProject(name: string, description: string = ''): Promise<Project> {
  const projects = readProjects();
  const project: Project = {
    id: uuidv4(),
    name,
    description,
    status: 'Active',
    createdAt: new Date().toISOString()
  };
  
  projects.push(project);
  writeProjects(projects);
  
  return project;
}

export async function updateProject(id: string, name: string, description: string): Promise<Project | null> {
  const projects = readProjects();
  const index = projects.findIndex(p => p.id === id);
  
  if (index === -1) {
    return null;
  }
  
  projects[index].name = name;
  projects[index].description = description;
  
  writeProjects(projects);
  
  return projects[index];
}

export async function deleteProject(id: string): Promise<{ success: boolean, message: string }> {
  const projects = readProjects();
  const index = projects.findIndex(p => p.id === id);
  
  if (index === -1) {
    return { success: false, message: 'Project not found' };
  }
  
  // Delete associated tasks and contexts
  const tasks = readTasks();
  const contexts = readContexts();
  
  // Find tasks associated with this project
  const projectTasks = tasks.filter(t => t.projectId === id);
  const taskIds = projectTasks.map(t => t.id);
  
  // Remove contexts associated with these tasks
  const updatedContexts = contexts.filter(c => !taskIds.includes(c.taskId || ''));
  writeContexts(updatedContexts);
  
  // Remove tasks associated with this project
  const updatedTasks = tasks.filter(t => t.projectId !== id);
  writeTasks(updatedTasks);
  
  // Remove the project
  projects.splice(index, 1);
  writeProjects(projects);
  
  return { success: true, message: 'Project deleted' };
}

export async function cleanupProject(id: string): Promise<{ success: boolean, message: string }> {
  const projects = readProjects();
  const index = projects.findIndex(p => p.id === id);
  
  if (index === -1) {
    return { success: false, message: 'Project not found' };
  }
  
  projects[index].status = 'Completed';
  writeProjects(projects);
  
  return { success: true, message: 'Project marked as completed' };
}
