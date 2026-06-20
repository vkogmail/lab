import { copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const root = dirname(fileURLToPath(import.meta.url));

/** Static landing + plugin UI preview (ui.html is not bundled — copied as-is). */
export default defineConfig({
  root,
  publicDir: join(root, "public"),
  build: {
    outDir: join(root, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: join(root, "index.html"),
    },
  },
  plugins: [
    {
      name: "copy-plugin-static",
      closeBundle() {
        for (const file of ["ui.html", "plugin-ui.css", "code.js", "manifest.json"]) {
          copyFileSync(join(root, file), join(root, "dist", file));
        }
      },
    },
  ],
});
