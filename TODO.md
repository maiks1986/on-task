# On Task Project TODO

## Project Setup

- [x] Initialize VS Code extension project
- [x] Set up TypeScript configuration
- [x] Create basic folder structure
- [x] Set up build and packaging configuration
- [x] Create extension manifest (package.json)

## Graphical Interface

- [x] Create extension activation entry point
- [x] Design and implement sidebar view container
- [x] Implement projects view
  - [x] Create project list UI component
  - [x] Implement project creation dialog
  - [x] Implement project editing functionality
  - [x] Implement project deletion functionality
- [x] Implement tasks view
  - [x] Create task list UI component
  - [x] Implement task creation dialog
  - [x] Implement task editing functionality
  - [x] Implement task status toggling (done/pending)
  - [x] Implement task deletion functionality
  - [ ] Implement task filtering and sorting
  - [ ] Implement task search functionality
- [x] Implement contexts view
  - [x] Create context list UI component
  - [x] Implement context creation dialog
  - [x] Implement context editing functionality
  - [x] Implement context deletion functionality
- [x] Create status bar items
  - [x] MCP server status indicator
  - [ ] Quick task creation button
- [ ] Implement keyboard shortcuts
- [ ] Create webview for detailed task view
- [ ] Implement task statistics and progress tracking UI

## Database

- [x] Set up SQLite database integration
- [x] Create database initialization script
- [x] Implement database schema
  - [x] Create projects table
  - [x] Create tasks table
  - [x] Create contexts table
- [x] Implement database service
  - [x] Create connection management
  - [x] Implement project CRUD operations
  - [x] Implement task CRUD operations
  - [x] Implement context CRUD operations
- [ ] Implement database migration system
- [x] Create project cleanup functionality
- [ ] Implement data export/import functionality
- [x] Add error handling and transaction support

## MCP Server

- [x] Set up MCP server framework
- [x] Implement MCP server initialization
- [x] Create MCP configuration detection
- [x] Implement automatic MCP configuration
- [x] Create MCP tools for task management
  - [x] Tool to get all tasks
  - [x] Tool to get tasks by project
  - [x] Tool to get task details
  - [x] Tool to create new tasks
  - [x] Tool to update tasks
  - [x] Tool to mark tasks as done/pending
  - [x] Tool to delete tasks
- [x] Create MCP tools for context management
  - [x] Tool to get all contexts
  - [x] Tool to get contexts by task
  - [x] Tool to create new contexts
  - [x] Tool to update contexts
  - [x] Tool to delete contexts
- [x] Create MCP tools for project management
  - [x] Tool to get all projects
  - [x] Tool to get project details
  - [x] Tool to create new projects
  - [x] Tool to update projects
  - [x] Tool to delete projects
  - [x] Tool to clean up projects
- [x] Implement MCP server status monitoring
- [x] Add error handling and logging

## Testing

- [ ] Set up testing framework
- [ ] Write unit tests for database operations
- [ ] Write unit tests for MCP server functionality
- [ ] Write integration tests for UI components
- [ ] Create end-to-end tests

## Documentation

- [ ] Create user documentation
- [ ] Create developer documentation
- [ ] Add JSDoc comments to code
- [ ] Create changelog

## Packaging and Distribution

- [ ] Create VSIX package
- [ ] Test installation on VS Code
- [ ] Test installation on VS Code derivatives
- [ ] Prepare for marketplace publication
