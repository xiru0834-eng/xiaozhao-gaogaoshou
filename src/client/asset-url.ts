/** Resolves public images when the workbench is mounted below an application prefix. */

/** Uses the host's optional asset prefix; standalone pages keep root-relative assets.
 * @param path Public asset path beginning with /assets/.
 * @returns Same-origin asset URL for this workbench document.
 */
export function publicAsset(path: string): string {
  const prefix = typeof document === "undefined" ? "" : document.querySelector<HTMLMetaElement>('meta[name="asset-prefix"]')?.content ?? "";
  return `${prefix}${path}`;
}
