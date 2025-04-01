import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt", "apple-touch-icon.png"],
      manifest: {
        name: "PehlaHath Emergency Response",
        short_name: "PehlaHath",
        description: "Emergency response and disaster management application",
        theme_color: "#e53e3e",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globDirectory: 'dist',
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        swDest: 'dist/sw.js',
      },
    }),
  ],
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
    hmr: {
      // Explicitly set the HMR protocol, host, and port
      protocol: 'ws',
      host: 'localhost',
      port: 3000,
      // Add this to fix potential CORS issues
      clientPort: 3000,
      // Add this if you're behind a proxy or have other network issues
      timeout: 120000,
    },
  },
  define: {
    "process.env": {
      VITE_GOOGLE_MAPS_API_KEY: JSON.stringify(
        "AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg"
      ),
    },
  },
  optimizeDeps: {
    include: ["react-router-dom"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-router-dom": ["react-router-dom"],
        },
      },
    },
  },
});
