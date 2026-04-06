import * as vscode from 'vscode';

import type { VsCodeExtensionTreeNodeDescriptor } from '../types/index.js';

/**
 * Provides one reusable tree-data provider for lightweight Governor views.
 *
 * Why this exists:
 * execution board, HITL inbox, and workspace context share the same presenter contract and only
 * differ in the service-backed loader that supplies tree-node descriptors.
 */
export class VsCodeExtensionTreeDataProvider
  implements vscode.TreeDataProvider<VsCodeExtensionTreeNodeDescriptor>
{
  private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<
    VsCodeExtensionTreeNodeDescriptor | undefined
  >();

  public readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

  public constructor(
    private readonly loadRootNodes: () => Promise<VsCodeExtensionTreeNodeDescriptor[]>,
  ) {}

  /**
   * Requests the tree view to refresh from the loader.
   */
  public refresh(): void {
    this.onDidChangeTreeDataEmitter.fire(undefined);
  }

  /**
   * Returns the tree item rendered for one descriptor.
   * @param element Tree-node descriptor.
   * @returns Materialized VS Code tree item.
   */
  public getTreeItem(element: VsCodeExtensionTreeNodeDescriptor): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(
      element.label,
      Array.isArray(element.children) && element.children.length > 0
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None,
    );
    treeItem.description = element.description;
    treeItem.tooltip = element.tooltip;
    treeItem.contextValue = element.contextValue;
    treeItem.iconPath = element.themeIconId ? new vscode.ThemeIcon(element.themeIconId) : undefined;
    treeItem.resourceUri = element.resourceUriPath
      ? vscode.Uri.file(element.resourceUriPath)
      : undefined;
    treeItem.command = element.command
      ? {
          command: element.command.command,
          title: element.command.title,
          arguments: element.command.arguments ? [...element.command.arguments] : undefined,
        }
      : undefined;
    return treeItem;
  }

  /**
   * Resolves root or child descriptors for the tree view.
   * @param element Optional parent descriptor.
   * @returns Child descriptors.
   */
  public async getChildren(
    element?: VsCodeExtensionTreeNodeDescriptor,
  ): Promise<VsCodeExtensionTreeNodeDescriptor[]> {
    if (element) {
      return [...(element.children ?? [])];
    }

    return this.loadRootNodes();
  }
}
