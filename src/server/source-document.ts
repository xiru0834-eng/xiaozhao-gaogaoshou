import { parse, type DefaultTreeAdapterTypes } from "parse5";
type Node = DefaultTreeAdapterTypes.Node;
const children = (node: Node): Node[] => "childNodes" in node ? node.childNodes : [];
const tag = (node: Node) => "tagName" in node ? node.tagName : "";
const attr = (node: Node, name: string) => "attrs" in node ? node.attrs.find(a => a.name === name)?.value : undefined;
function nodes(root: Node): Node[] {
  const result: Node[] = [], stack = [root];
  while (stack.length) { const node = stack.pop()!; result.push(node); stack.push(...children(node).slice().reverse()); }
  return result;
}
function text(root: Node): string {
  const parts: string[] = [], stack = [root];
  while (stack.length) {
    const node = stack.pop()!;
    if (["script", "style", "template", "noscript", "nav", "header", "footer", "svg", "form", "button"].includes(tag(node)) || attr(node, "aria-hidden") === "true" || attr(node, "hidden") !== undefined) continue;
    if (node.nodeName === "#text" && "value" in node) parts.push(node.value);
    else { if (["p", "li", "div", "h1", "h2", "h3", "br", "section"].includes(tag(node))) parts.push("\n"); stack.push(...children(node).slice().reverse()); }
  }
  return parts.join(" ").replace(/[ \t\r]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{2,}/g, "\n").trim();
}
export function parseSourceHtml(html: string, url: string) {
  const all = nodes(parse(html));
  const root = all.find(n => tag(n) === "main") ?? all.find(n => tag(n) === "article") ?? all.find(n => tag(n) === "body")!;
  const visible = nodes(root);
  const title = visible.find(n => tag(n) === "h1");
  const links: { text: string; url: string }[] = [];
  for (const node of visible.filter(n => tag(n) === "a")) {
    const raw = attr(node, "href"); if (!raw) continue;
    try {
      const target = new URL(raw, url);
      if (!["https:", "mailto:"].includes(target.protocol) || target.username || target.password || target.href.length > 1000 || /(?:token|session|password|userid|resumeid)=/i.test(target.search)) continue;
      links.push({ text: text(node).slice(0, 200), url: target.href });
    } catch { /* Not a usable public link. */ }
    if (links.length >= 100) break;
  }
  return { text: text(root), title: title ? text(title).slice(0, 300) : null, links };
}
