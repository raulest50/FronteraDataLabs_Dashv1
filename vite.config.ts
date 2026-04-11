import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import cesium from "vite-plugin-cesium";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const cesiumBuildRoot = path.join(
  projectRoot,
  "node_modules",
  "cesium",
  "Build",
  "Cesium"
);
const cesiumStaticDirs = ["Assets", "ThirdParty", "Widgets", "Workers"];

function copyCesiumAssets() {
  return {
    name: "copy-cesium-assets",
    apply: "build",
    closeBundle() {
      const outDir = path.join(projectRoot, "dist");

      if (!existsSync(outDir)) return;

      for (const dirName of cesiumStaticDirs) {
        const sourceDir = path.join(cesiumBuildRoot, dirName);
        const targetDir = path.join(outDir, dirName);

        mkdirSync(path.dirname(targetDir), { recursive: true });
        cpSync(sourceDir, targetDir, { recursive: true, force: true });
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), cesium(), copyCesiumAssets()],
  server: {
    port: 5174,
  },
});
