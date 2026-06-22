import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    // Auto-open for humans; the visual test server sets VITE_OPEN=false to stay headless.
    open: process.env.VITE_OPEN !== "false",
  },
});
