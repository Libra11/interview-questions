import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRootDir = fileURLToPath(new URL(".", import.meta.url));
const repository = process.env.GITHUB_REPOSITORY ?? "";
const repoName = repository.split("/")[1] ?? "";
const isUserSite = repoName.endsWith(".github.io");
const isGitHubActions = process.env.GITHUB_ACTIONS === "true";
const base = isGitHubActions && !isUserSite && repoName ? `/${repoName}/` : "/";

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(projectRootDir, "src"),
    },
  },
});
