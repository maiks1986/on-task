# On Task MCP Server

This is a Model Context Protocol (MCP) server for the On Task extension. It provides tools for managing projects, tasks, and contexts.

## Installation

```bash
npm install
```

## Running the Server

```bash
npm start
```

The server will run on port 3000 by default. You can change this by setting the `PORT` environment variable.

## Available Tools

### Project Tools

- **project.add**: Add a new project
  - Parameters:
    - `name` (required): The name of the project
    - `description`: The description of the project

- **project.edit**: Edit an existing project
  - Parameters:
    - `id` (required): The ID of the project to edit
    - `name`: The new name of the project
    - `description`: The new description of the project

### Task Tools

- **task.add**: Add a new task
  - Parameters:
    - `name` (required): The name of the task
    - `description`: The description of the task
    - `priority`: The priority of the task (Low, Medium, High)
    - `projectId`: The ID of the project this task belongs to

- **task.edit**: Edit an existing task
  - Parameters:
    - `id` (required): The ID of the task to edit
    - `name`: The new name of the task
    - `description`: The new description of the task
    - `priority`: The new priority of the task
    - `projectId`: The new project ID for the task

- **task.get**: Get a task by ID
  - Parameters:
    - `id` (required): The ID of the task to get

- **task.done**: Mark a task as done
  - Parameters:
    - `id` (required): The ID of the task to mark as done

### Context Tools

- **context.add**: Add a new context
  - Parameters:
    - `name` (required): The name of the context
    - `description`: The description of the context
    - `taskId`: The ID of the task this context belongs to

- **context.edit**: Edit an existing context
  - Parameters:
    - `id` (required): The ID of the context to edit
    - `name`: The new name of the context
    - `description`: The new description of the context
    - `taskId`: The new task ID for the context

- **context.get**: Get a context by ID
  - Parameters:
    - `id` (required): The ID of the context to get

## API Usage

The MCP server exposes a single endpoint at `/mcp/tools` that accepts POST requests with the following structure:

```json
{
  "tool": "tool.name",
  "params": {
    "param1": "value1",
    "param2": "value2"
  }
}
```

The response will have the following structure:

```json
{
  "result": {
    // Tool-specific result data
  }
}
```

## Data Storage

All data is stored in JSON files in the `data` directory:

- `projects.json`: Stores all projects
- `tasks.json`: Stores all tasks
- `contexts.json`: Stores all contexts

## Error Handling

If an error occurs, the server will respond with a 400 or 500 status code and an error message:

```json
{
  "error": "Error message"
}
```
