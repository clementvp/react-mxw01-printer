import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    dts({
      include: ["src"],
      exclude: ["src/**/*.test.ts", "src/**/*.test.tsx", "examples"],
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "MXW01ThermalPrinter",
      formats: ["es", "cjs"],
      fileName: (format) => `index.${format === "es" ? "js" : "cjs"}`,
    },
    rollupOptions: {
      external: ["@stoprocent/noble"],
    },
    sourcemap: true,
    emptyOutDir: true,
  },
});
