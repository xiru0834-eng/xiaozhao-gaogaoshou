import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  root: "web",
  build: { outDir: "../dist/web", emptyOutDir: true },
  resolve: { alias: { "@": resolve("src") } },
});
