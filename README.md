# On Task

## Description

On Task is a task management extension for Visual Studio Code and compatible VS Code derivatives. It has a built-in MCP server and a built-in SQLite database. On Task is written in TypeScript. It has a list of tasks and a list of contexts for those tasks. A context needs to have a task attached to it. A task can have multiple contexts attached to it but doesn't need to have one.

## Extension Features

### Extension GUI

The UI has a list of tasks and a list of contexts for those tasks. It has an add button that opens a little popup window that allows you to add tasks and another one to add contexts.

### Extension Features List

- Create, update, clean up, and delete projects
- Create, update, and delete tasks
- Create, update, and delete contexts
- Mark tasks as done or pending
- Detects if MCP server is running
- Detects if MCP server is added to mcp_config.json
  - Get code for mcp_config.json and a button to add it automatically
- Project cleanup is a function that will clean up the database
- Task prioritization and sorting options
- Task filtering by status, context, or custom criteria
- Task search functionality
- Task statistics and progress tracking
- Keyboard shortcuts for common operations

## Installation

### For Visual Studio Code

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "On Task"
4. Click Install
5. Reload VS Code when prompted

### For VS Code Derivatives

This extension is designed to be compatible with VS Code derivatives such as VSCodium, Theia, and others. Installation steps may vary slightly depending on the specific platform:

1. Open your VS Code-based editor
2. Navigate to the extensions marketplace (typically Ctrl+Shift+X)
3. Search for "On Task"
4. Install and reload as prompted

If the extension is not available in your editor's marketplace, you can also install it manually:

1. Download the VSIX file from the releases page
2. In your editor, go to Extensions
3. Click on the "..." menu (or equivalent)
4. Select "Install from VSIX..."
5. Navigate to the downloaded file and install

## Usage

1. Open the On Task sidebar by clicking the On Task icon in the activity bar
2. Create a new project or select an existing one
3. Add tasks and contexts as needed
4. Use the provided buttons to manage your tasks

## MCP Integration

The MCP server is written in TypeScript and is used to manage tasks and contexts. It handles operations like marking tasks as done or pending. The MCP server is built using the [ModelContextProtocol](https://github.com/modelcontextprotocol/typescript-sdk). When a task is marked as done, it will automatically return the next task.

### MCP Configuration

The extension will automatically detect if the MCP server is added to your `mcp_config.json`. If not, it will provide you with the necessary configuration code and a button to add it automatically.

## Database Schema

The database is implemented using SQLite and consists of the following tables:

### Projects Table

|Column|Type|Description|
|---|---|---|
|project_id|INTEGER|Primary key, auto-incremented|
|project_name|TEXT|Name of the project|
|project_description|TEXT|Description of the project|
|cleaned_up|BOOLEAN|Whether the project has been cleaned up|
|created_at|DATETIME|When the project was created|
|updated_at|DATETIME|When the project was last updated|

### Tasks Table

|Column|Type|Description|
|---|---|---|
|project_id|INTEGER|Foreign key to projects table|
|task_id|INTEGER|Primary key, auto-incremented|
|task_name|TEXT|Name of the task|
|task_description|TEXT|Description of the task|
|task_status|TEXT|Status of the task (e.g., "pending", "done")|
|priority|INTEGER|Task priority (optional)|
|due_date|DATETIME|When the task is due (optional)|
|created_at|DATETIME|When the task was created|
|updated_at|DATETIME|When the task was last updated|

### Contexts Table

|Column|Type|Description|
|---|---|---|
|context_id|INTEGER|Primary key, auto-incremented|
|project_id|INTEGER|Foreign key to projects table|
|task_id|INTEGER|Foreign key to tasks table|
|context_description|TEXT|Description of the context|
|created_at|DATETIME|When the context was created|
|updated_at|DATETIME|When the context was last updated|

## Development

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- VS Code or a compatible VS Code derivative

### Setup

1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to compile the TypeScript code
4. Press F5 to launch the extension in debug mode

### Project Structure

- `src/extension.ts`: Main extension entry point
- `src/mcp/`: MCP server implementation
- `src/database/`: Database management code
- `src/webview/`: UI components and webview implementation
- `src/utils/`: Utility functions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
