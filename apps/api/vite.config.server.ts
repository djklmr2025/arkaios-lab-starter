import { defineConfig } from "vite";
export default defineConfig({
  build: { ssr: true, outDir: "dist/server", target:"node20",
    rollupOptions: { input:"server/index.ts", output:{ entryFileNames:"node-build.mjs", format:"esm" }, external:["express","cors","dotenv"] } }
});
