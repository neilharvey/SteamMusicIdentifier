
import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  root: resolve(__dirname, "src"),

  publicDir: resolve(__dirname, "public"),

  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,

    rollupOptions: {
      input: {
        "background/service-worker": resolve(
          __dirname,
          "src/background/service-worker.ts"
        ),
        "offscreen/offscreen": resolve(
          __dirname,
          "src/offscreen/offscreen.html"
        ),
        "popup/popup": resolve(
          __dirname,
          "src/popup/popup.html"
        )
      },

      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name].js",
        assetFileNames: "assets/[name][extname]"
      }
    }
  }
});