import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"

const config = defineConfig({
  globalCss: {
    body: {
      bg: "#F0F4F8", // Màu nền dịu nhẹ (xám xanh nhạt)
      color: "gray.800",
    },
  },
  theme: {
    tokens: {
      colors: {
        blue: {
          50: { value: "#F4F8FA" }, // derived from #D6E8EE, very light
          100: { value: "#D6E8EE" },
          200: { value: "#B4D9E6" },
          300: { value: "#97CADB" },
          400: { value: "#4EAADA" }, // interpolated
          500: { value: "#018ABE" }, // BRAND PRIMARY
          600: { value: "#02457A" }, // BRAND DARK (Hover)
          700: { value: "#013A67" },
          800: { value: "#012C4D" },
          900: { value: "#001D34" },
        },
        gray: {
          50: { value: "#F0F4F8" }, // System background layer
        },
      },
    },
  },
})

export const system = createSystem(defaultConfig, config)
