import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/civicdesk-stratustal.github.io/", // MUST match your exact GitHub repository name, with slashes
  plugins: [react()],
});
