import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// GitHub Pages 项目站：/cpp-002/；本地开发保持 /
// 可通过环境变量 BASE_PATH 覆盖（例如 Actions 里设为 /cpp-002/）
const base = process.env.BASE_PATH || "/";

// 预览契约：0.0.0.0:8080
export default defineConfig({
  base,
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
