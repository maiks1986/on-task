import { v4 as uuidv4 } from 'uuid';
import { Context } from '../types';
import { readContexts, writeContexts } from '../data/storage';

// Context operations
export async function getAllContexts(): Promise<Context[]> {
  return readContexts();
}

export async function getContext(id: string): Promise<Context | undefined> {
  const contexts = readContexts();
  return contexts.find(c => c.id === id);
}

export async function getContextsByTask(taskId: string): Promise<Context[]> {
  const contexts = readContexts();
  return contexts.filter(c => c.taskId === taskId);
}

export async function addContext(
  name: string, 
  description: string = '', 
  taskId: string | null = null
): Promise<Context> {
  const contexts = readContexts();
  const context: Context = {
    id: uuidv4(),
    name,
    description,
    taskId,
    createdAt: new Date().toISOString()
  };
  
  contexts.push(context);
  writeContexts(contexts);
  
  return context;
}

export async function updateContext(
  id: string, 
  name: string, 
  description: string, 
  taskId: string | null
): Promise<Context | null> {
  const contexts = readContexts();
  const index = contexts.findIndex(c => c.id === id);
  
  if (index === -1) {
    return null;
  }
  
  contexts[index].name = name;
  contexts[index].description = description;
  contexts[index].taskId = taskId;
  
  writeContexts(contexts);
  
  return contexts[index];
}

export async function deleteContext(id: string): Promise<{ success: boolean, message: string }> {
  const contexts = readContexts();
  const index = contexts.findIndex(c => c.id === id);
  
  if (index === -1) {
    return { success: false, message: 'Context not found' };
  }
  
  contexts.splice(index, 1);
  writeContexts(contexts);
  
  return { success: true, message: 'Context deleted' };
}
