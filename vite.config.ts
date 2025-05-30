import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    allowedHosts: [
      "localhost",
      "localhost:5173",
      "127.0.0.1",
      "127.0.0.1:5173",
      "localhost.nip.io",
      "localhost.nip.io:5173",
      "127.0.0.1.nip.io",
      "127.0.0.1.nip.io:5173",
    ],
  },
});
