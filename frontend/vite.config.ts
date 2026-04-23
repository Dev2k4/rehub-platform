// import path from "node:path"
// import { tanstackRouter } from "@tanstack/router-plugin/vite"
// import react from "@vitejs/plugin-react-swc"
// import { defineConfig } from "vite"

// // https://vitejs.dev/config/
// export default defineConfig({
//   resolve: {
//     alias: {
//       "@": path.resolve(__dirname, "./src"),
//     },
//   },
//   plugins: [
//     tanstackRouter({
//       target: "react",
//       autoCodeSplitting: true,
//     }),
//     react(),
//   ],
// })

import path from "node:path"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    allowedHosts: [".ngrok-free.dev"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return

          if (id.includes("@chakra-ui") || id.includes("@emotion")) {
            return "ui-vendor"
          }
          if (id.includes("@tanstack/react-router")) {
            return "router-vendor"
          }
          if (id.includes("@tanstack/react-query")) {
            return "query-vendor"
          }
          if (id.includes("react-icons") || id.includes("lucide-react")) {
            return "icons-vendor"
          }
          if (id.includes("zod")) {
            return "validation-vendor"
          }
          return "vendor"
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
  ],
})
