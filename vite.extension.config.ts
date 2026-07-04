import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify("extension"),
  },
  build: {
    outDir: "dist-extension",
    rollupOptions: {
      input: {
        popup: "popup.html",
        offscreen: "offscreen.html",
        background: "src/extension/background.ts",
      },
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});
