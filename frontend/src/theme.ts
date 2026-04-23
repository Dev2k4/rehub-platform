// import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"

// const config = defineConfig({
//   globalCss: {
//     body: {
//       bg: "#F0F4F8", // Màu nền dịu nhẹ (xám xanh nhạt)
//       color: "gray.800",
//     },
//   },
//   theme: {
//     tokens: {
//       colors: {
//         blue: {
//           50: { value: "#F4F8FA" }, // derived from #D6E8EE, very light
//           100: { value: "#D6E8EE" },
//           200: { value: "#B4D9E6" },
//           300: { value: "#97CADB" },
//           400: { value: "#4EAADA" }, // interpolated
//           500: { value: "#018ABE" }, // BRAND PRIMARY
//           600: { value: "#02457A" }, // BRAND DARK (Hover)
//           700: { value: "#013A67" },
//           800: { value: "#012C4D" },
//           900: { value: "#001D34" },
//         },
//         gray: {
//           50: { value: "#F0F4F8" }, // System background layer
//         },
//       },
//     },
//   },
// })

// export const system = createSystem(defaultConfig, config)
// theme.ts
import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"

const config = defineConfig({
  globalCss: {
    body: {
      bg: "#F8FAFC", // Màu nền sáng hơn một chút để nổi bật các Card trắng
      color: "gray.800",
      fontFamily: "Inter, sans-serif",
    },
  },
  theme: {
    tokens: {
      colors: {
        blue: {
          50: { value: "#EFF6FF" },
          100: { value: "#DBEAFE" },
          500: { value: "#018ABE" }, // Brand Primary
          600: { value: "#02457A" }, // Brand Dark
        },
      },
      radii: {
        "2xl": { value: "1rem" },
        "3xl": { value: "1.5rem" },
      },
      shadows: {
        soft: {
          value:
            "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        },
        floating: {
          value:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        },
      },
    },
  },
})

export const system = createSystem(defaultConfig, config)
