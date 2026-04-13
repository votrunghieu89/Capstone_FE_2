import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Backend URL: khi dev local dùng localhost:5271, khi Docker dùng http://backend:5000
const BACKEND_URL = process.env.VITE_BACKEND_URL || "http://localhost:5271";
const AI_URL = process.env.VITE_AI_URL || "http://localhost:8000";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    proxy: {
      "/api": {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
      },
      "/NotificationHub": {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      "/ChatHub": {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      "/ai": {
        target: AI_URL,
        changeOrigin: true,
      },
    },
  },
});


