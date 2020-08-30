import * as vscode from 'vscode';
import DateHoverProvider from './DateHoverProvider';

export function activate(context: vscode.ExtensionContext) {
	const dateHoverProvider = new DateHoverProvider();
	context.subscriptions.push(dateHoverProvider, vscode.languages.registerHoverProvider('*', dateHoverProvider));
}

// this method is called when your extension is deactivated
export function deactivate() {}
