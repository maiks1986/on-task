/**
 * Type declarations for modules used in the project
 */

declare module 'vscode' {
  export interface ExtensionContext {
    globalStoragePath: string;
    subscriptions: { dispose(): any }[];
  }

  export interface TreeDataProvider<T> {
    getTreeItem(element: T): TreeItem;
    getChildren(element?: T): Promise<T[]>;
    onDidChangeTreeData: Event<T | undefined | null | void>;
  }

  export interface TreeItem {
    label: string;
    description?: string;
    tooltip?: string;
    contextValue?: string;
    id?: string;
    iconPath?: ThemeIcon;
    command?: Command;
    collapsibleState?: TreeItemCollapsibleState;
  }

  export class TreeItem {
    constructor(label: string, collapsibleState?: TreeItemCollapsibleState);
  }

  export enum TreeItemCollapsibleState {
    None,
    Collapsed,
    Expanded
  }

  export interface Command {
    command: string;
    title: string;
    arguments?: any[];
  }

  export class ThemeIcon {
    constructor(id: string);
  }

  export interface StatusBarItem {
    text: string;
    tooltip?: string;
    show(): void;
  }

  export enum StatusBarAlignment {
    Left,
    Right
  }

  export interface Event<T> {
    (listener: (e: T) => any): { dispose(): any };
  }

  export interface EventEmitter<T> {
    event: Event<T>;
    fire(data?: T): void;
  }

  export class EventEmitter<T> {
    constructor();
  }

  export namespace window {
    export function registerTreeDataProvider<T>(viewId: string, provider: TreeDataProvider<T>): void;
    export function createStatusBarItem(alignment: StatusBarAlignment, priority: number): StatusBarItem;
    export function showInputBox(options?: InputBoxOptions): Promise<string | undefined>;
    export function showQuickPick<T extends QuickPickItem>(items: T[], options?: QuickPickOptions): Promise<T | undefined>;
    export function showInformationMessage(message: string, ...items: string[]): Promise<string | undefined>;
    export function showWarningMessage(message: string, options: any, ...items: string[]): Promise<string | undefined>;
    export function showErrorMessage(message: string): void;
  }

  export interface InputBoxOptions {
    value?: string;
    placeHolder?: string;
    prompt?: string;
  }

  export interface QuickPickItem {
    label: string;
    description?: string;
  }

  export interface QuickPickOptions {
    placeHolder?: string;
  }

  export namespace commands {
    export function registerCommand(command: string, callback: (...args: any[]) => any): { dispose(): any };
    export function executeCommand(command: string, ...args: any[]): Promise<any>;
  }

  export namespace workspace {
    export function getConfiguration(section?: string): WorkspaceConfiguration;
    export function onDidChangeConfiguration(callback: (e: ConfigurationChangeEvent) => any): { dispose(): any };
    export const workspaceFolders: { uri: { fsPath: string } }[] | undefined;
  }

  export interface WorkspaceConfiguration {
    get<T>(section: string): T | undefined;
    update(section: string, value: any, global?: boolean): Promise<void>;
  }

  export interface ConfigurationChangeEvent {
    affectsConfiguration(section: string): boolean;
  }
}

declare module 'better-sqlite3' {
  export default function(path: string): Database;

  export interface Database {
    prepare(sql: string): Statement;
    exec(sql: string): void;
    pragma(pragma: string): void;
  }

  export interface Statement {
    run(...params: any[]): { lastInsertRowid: number };
    get(...params: any[]): any;
    all(...params: any[]): any[];
  }
}

declare module 'fs' {
  export function existsSync(path: string): boolean;
  export function mkdirSync(path: string, options?: { recursive?: boolean }): void;
  export function readFileSync(path: string, encoding: string): string;
  export function writeFileSync(path: string, data: string, encoding: string): void;
}

declare module 'path' {
  export function join(...paths: string[]): string;
  export function dirname(path: string): string;
}

declare module 'os' {
  export function homedir(): string;
}

// Add global process object
declare const process: {
  platform: string;
};
