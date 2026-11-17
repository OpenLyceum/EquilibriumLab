/**
 * disposeChildren.ts
 *
 * Removes and disposes every child of a node, for views that rebuild their content on change.
 * Never use this with shared/reusable nodes: it disposes them for every other owner too.
 */

import type { Node } from "scenerystack/scenery";

export function disposeChildren(node: Node): void {
  const children = node.children;
  node.removeAllChildren();
  for (const child of children) {
    child.dispose();
  }
}
