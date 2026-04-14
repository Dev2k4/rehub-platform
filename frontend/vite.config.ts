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