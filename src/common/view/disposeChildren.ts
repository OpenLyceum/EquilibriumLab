/**
 * Disposes an exclusively owned child tree before a rebuild. Node.dispose() only
 * detaches children, so Property-painted Paths/Texts/Circles stay linked forever
 * unless disposed explicitly. Never use this with shared/reusable nodes: it disposes
 * them for every other owner too.
 */
import { type Node, RichText } from "scenerystack/scenery";

export function disposeChildren(parent: Node): void {
  const owned = new Set<Node>();
  const collect = (node: Node): void => {
    if (owned.has(node)) {
      return;
    }
    owned.add(node);
    // RichText owns pooled implementation nodes; disposing those corrupts the pool.
    if (!(node instanceof RichText)) {
      node.children.forEach(collect);
    }
  };
  parent.children.forEach(collect);
  for (const node of owned) {
    if (!node.isDisposed) {
      node.dispose();
    }
  }
}
