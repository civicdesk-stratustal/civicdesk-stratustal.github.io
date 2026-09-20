import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: {
      entry: "server",
    },
  },

  // Force the production/deployment build to run outside Lovable's sandbox.
  nitro: true,
});
