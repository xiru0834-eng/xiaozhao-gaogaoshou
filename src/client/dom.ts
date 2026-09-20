export function element<T extends HTMLElement = HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing required UI element: ${id}`);
  return node as T;
}
export function required<T extends Element = HTMLElement>(
  selector: string,
  root: ParentNode = document,
): T {
  const node = root.querySelector<T>(selector);
  if (!node) throw new Error(`Missing required UI selector: ${selector}`);
  return node;
}
