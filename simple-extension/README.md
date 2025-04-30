# On Task (Simple)

A simple task management extension for VS Code and derivatives like Windsurf.

## Features

- Project management
- Task management with project associations
- Context management linked to tasks
- MCP server integration for programmatic access
- Compatible with VS Code and derivatives

## Usage

1. Click on the On Task icon in the Activity Bar
2. View and interact with your projects, tasks, and contexts
3. Use the "Manage MCP Server" command to set up the MCP server integration

## MCP Server Integration

This extension includes an MCP (Model Context Protocol) server that allows programmatic access to On Task functionality. The MCP server provides the following tools:

### Project Tools

- `project.add`: Add a new project
- `project.edit`: Edit an existing project

### Task Tools

- `task.add`: Add a new task
- `task.edit`: Edit an existing task
- `task.get`: Get a task by ID
- `task.done`: Mark a task as done

### Context Tools

- `context.add`: Add a new context
- `context.edit`: Edit an existing context
- `context.get`: Get a context by ID

### Setting Up MCP Server

1. Open the command palette (Ctrl+Shift+P)
2. Run the command "On Task: Manage MCP Server"
3. Click the "Install MCP Server" button to register the server in your MCP configuration

## Data Structure

- **Projects**: Container for related tasks
- **Tasks**: Work items that belong to a project
- **Contexts**: Specific contexts for tasks (e.g., code snippets, notes)

## Compatibility

This extension is designed to be compatible with VS Code and other VS Code derivatives.
