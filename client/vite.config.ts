import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const PORT = Number(process.env.PORT) || 5173;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "..", "shared"),
      "@assets": path.resolve(__dirname, "..", "attached_assets"),
    },
  },
  server: {
    port: PORT,
    host: true,
    proxy: {
      "/api": {
        target: "https://businuses.onrender.com", // შენი backend URL
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port: PORT,
    host: true,
  },
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
  base: "/", // Render-ზე სუფთა root URL-ზე
});
