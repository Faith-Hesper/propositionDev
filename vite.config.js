import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import path from "path"
// Element Plus自动按需引入配置，先执行 npm install -D unplugin-vue-components unplugin-auto-import
import AutoImport from "unplugin-auto-import/vite"
import Components from "unplugin-vue-components/vite"
import { ElementPlusResolver } from "unplugin-vue-components/resolvers"

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),

    "@supermap/babel-plugin-import",
    {
      "libraryName": "@supermap/iclient-leaflet",
    },
  ],
  define: {
    "process.env": {},
  },
  // 路径
  resolve: {
    extensions: [".js", ".vue", ".json", ".scss"],
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    open: true,
  },
})
