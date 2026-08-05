import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// 预览契约：0.0.0.0:8080
export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
  },
  plugins: [tailwindcss(), viteReact()],
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },
});
