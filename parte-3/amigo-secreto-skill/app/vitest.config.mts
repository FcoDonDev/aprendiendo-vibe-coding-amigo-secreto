import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Configuración de pruebas unitarias (Vitest).
 *
 * - Proyectos "nodo": librerías y la ruta API (entorno Node).
 * - Proyecto "ui": componentes React (entorno jsdom + @testing-library).
 * - El alias `@/` replica el `paths` de tsconfig.json.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    globals: true,
    projects: [
      {
        test: {
          name: "nodo",
          environment: "node",
          include: ["src/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "ui",
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          setupFiles: ["./vitest.setup.ts"],
        },
      },
    ],
  },
});
