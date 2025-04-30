@echo off
echo Preparing development version of On Task extension...

rem Create a simple TypeScript file to compile
if not exist "out" mkdir "out"

echo // Simple extension for testing > out\extension-dev.js
echo const vscode = require('vscode'); >> out\extension-dev.js
echo >> out\extension-dev.js

echo // Tree Item class >> out\extension-dev.js
echo class TreeItem extends vscode.TreeItem { >> out\extension-dev.js
echo   constructor(label, collapsibleState) { >> out\extension-dev.js
echo     super(label, collapsibleState); >> out\extension-dev.js
echo     this.tooltip = label; >> out\extension-dev.js
echo   } >> out\extension-dev.js
echo } >> out\extension-dev.js
echo >> out\extension-dev.js

echo // Simple Tree Data Provider >> out\extension-dev.js
echo class SimpleTreeDataProvider { >> out\extension-dev.js
echo   constructor(items) { >> out\extension-dev.js
echo     this._items = items; >> out\extension-dev.js
echo   } >> out\extension-dev.js
echo >> out\extension-dev.js
echo   getTreeItem(element) { >> out\extension-dev.js
echo     return element; >> out\extension-dev.js
echo   } >> out\extension-dev.js
echo >> out\extension-dev.js
echo   getChildren(element) { >> out\extension-dev.js
echo     if (element) { >> out\extension-dev.js
echo       return Promise.resolve([]); >> out\extension-dev.js
echo     } >> out\extension-dev.js
echo     return Promise.resolve(this._items); >> out\extension-dev.js
echo   } >> out\extension-dev.js
echo } >> out\extension-dev.js
echo >> out\extension-dev.js

echo // Extension activation >> out\extension-dev.js
echo exports.activate = function(context) { >> out\extension-dev.js
echo   console.log('On Task extension is now active!'); >> out\extension-dev.js
echo >> out\extension-dev.js

echo   // Create sample data >> out\extension-dev.js
echo   const projectItems = [ >> out\extension-dev.js
echo     new TreeItem('Sample Project 1', vscode.TreeItemCollapsibleState.None), >> out\extension-dev.js
echo     new TreeItem('Sample Project 2', vscode.TreeItemCollapsibleState.None) >> out\extension-dev.js
echo   ]; >> out\extension-dev.js
echo >> out\extension-dev.js

echo   const taskItems = [ >> out\extension-dev.js
echo     new TreeItem('Sample Task 1', vscode.TreeItemCollapsibleState.None), >> out\extension-dev.js
echo     new TreeItem('Sample Task 2', vscode.TreeItemCollapsibleState.None) >> out\extension-dev.js
echo   ]; >> out\extension-dev.js
echo >> out\extension-dev.js

echo   const contextItems = [ >> out\extension-dev.js
echo     new TreeItem('Sample Context 1', vscode.TreeItemCollapsibleState.None), >> out\extension-dev.js
echo     new TreeItem('Sample Context 2', vscode.TreeItemCollapsibleState.None) >> out\extension-dev.js
echo   ]; >> out\extension-dev.js
echo >> out\extension-dev.js

echo   // Register tree data providers >> out\extension-dev.js
echo   const projectsProvider = new SimpleTreeDataProvider(projectItems); >> out\extension-dev.js
echo   const tasksProvider = new SimpleTreeDataProvider(taskItems); >> out\extension-dev.js
echo   const contextsProvider = new SimpleTreeDataProvider(contextItems); >> out\extension-dev.js
echo >> out\extension-dev.js

echo   vscode.window.registerTreeDataProvider('onTaskProjects', projectsProvider); >> out\extension-dev.js
echo   vscode.window.registerTreeDataProvider('onTaskTasks', tasksProvider); >> out\extension-dev.js
echo   vscode.window.registerTreeDataProvider('onTaskContexts', contextsProvider); >> out\extension-dev.js
echo >> out\extension-dev.js

echo   // Create status bar item >> out\extension-dev.js
echo   const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100); >> out\extension-dev.js
echo   statusBarItem.text = "$(check) On Task"; >> out\extension-dev.js
echo   statusBarItem.tooltip = "On Task extension is active"; >> out\extension-dev.js
echo   statusBarItem.show(); >> out\extension-dev.js
echo >> out\extension-dev.js

echo   context.subscriptions.push(statusBarItem); >> out\extension-dev.js
echo }; >> out\extension-dev.js
echo >> out\extension-dev.js

echo exports.deactivate = function() {}; >> out\extension-dev.js

rem Create a temporary extension directory
if not exist ".vscode-test\extensions\on-task-dev" mkdir ".vscode-test\extensions\on-task-dev"

rem Copy the necessary files to the temporary extension directory
copy package-dev.json ".vscode-test\extensions\on-task-dev\package.json"
xcopy /E /I /Y out ".vscode-test\extensions\on-task-dev\out"
xcopy /E /I /Y resources ".vscode-test\extensions\on-task-dev\resources"

echo Development version prepared. 
echo.
echo To test the extension, run:
echo code --extensions-dir=".vscode-test\extensions" --user-data-dir=".vscode-test\user-data"
