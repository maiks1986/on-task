# Changelog

All notable changes to the "On Task" extension will be documented in this file.

## [0.0.8] - 2025-05-01

### Added

- Enhanced MCP server with additional tool functions:
  - `project.get`: Get a project by ID
  - `project.getAll`: Get all projects
  - `project.delete`: Delete a project and its associated tasks
  - `project.cleanup`: Mark a project as completed
  - `task.getAll`: Get all tasks
  - `task.getByProject`: Get tasks by project ID
  - `task.delete`: Delete a task and its associated contexts
  - `context.getAll`: Get all contexts
  - `context.getByTask`: Get contexts by task ID
  - `context.delete`: Delete a context
- Updated MCP server installation to use TypeScript directly with ts-node
- Added MCP TypeScript SDK dependency to the MCP server

### Changed

- Renamed MCP Server Panel to "On Task MCP Server Panel" for better branding
- Updated MCP server installation script to include all new tools
- Improved MCP server configuration to run TypeScript files directly

### Removed

- Commented out redundant On Task status bar item to reduce UI clutter

## [0.0.7] - 2025-04-15

- Initial release of the simplified On Task extension
- Basic project, task, and context management
- MCP server integration
