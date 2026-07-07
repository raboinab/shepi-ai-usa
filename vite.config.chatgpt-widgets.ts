import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    sourcemap: false,
    cssMinify: true,
    minify: true,
    rollupOptions: {
      input: "src/chatgpt-widgets/project-summary.html",
    },
    outDir: "dist/chatgpt-widgets",
    emptyOutDir: true,
  },
});
