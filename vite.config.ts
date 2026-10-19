import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  // Keep mobile breakpoints readable by older Android WebViews and Safari.
  build: { cssTarget: ["chrome90", "safari14"] },
  server: { host: "127.0.0.1", port: 5173 },
});
