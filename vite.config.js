import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  envDir: ".",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "icons/favicon.ico",
        "robots.txt",
        "icons/*.png",
        "logo/*.png",
        "images/*.png",
      ],
      manifest: {
        id: "/",
        name: "Hansaria Food Private Limited",
        short_name: "Hansaria Food",
        description:
          "Hansaria Food Private Limited is a trusted poultry and feed meal trading and brokerage company connecting buyers and sellers across India.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait-primary",
        theme_color: "#064e3b",
        background_color: "#ffffff",
        lang: "en",
        dir: "ltr",
        categories: ["business", "food", "agriculture"],
        icons: [
          {
            src: "/icons/android-chrome-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/android-chrome-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/icons/android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/icons/apple-touch-icon.png",
            sizes: "180x180",
            type: "image/png",
            purpose: "any",
          },
        ],
        shortcuts: [
          {
            name: "Commodity List",
            short_name: "Commodities",
            url: "/commodity/list",
            icons: [{ src: "/icons/favicon-32x32.png", sizes: "32x32" }],
          },
          {
            name: "Quality Parameters",
            short_name: "Parameters",
            url: "/quality-parameter/list",
            icons: [{ src: "/icons/favicon-32x32.png", sizes: "32x32" }],
          },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "document",
            handler: "NetworkFirst",
            options: { cacheName: "pages", networkTimeoutSeconds: 5 },
          },
          {
            urlPattern: ({ request }) =>
              ["style", "script", "worker"].includes(request.destination),
            handler: "StaleWhileRevalidate",
            options: { cacheName: "assets" },
          },
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "images",
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          utils: ["axios", "moment"],
          ui: ["react-toastify", "react-helmet-async"],
        },
        chunkFileNames: "assets/[name]-[hash].js",
      },
    },
    chunkSizeWarningLimit: 1600,
  },
  server: {
    host: true, // Allow external access (mobile)
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
    allowedHosts: true, // Allow access from any host (mobile IP, etc.)
  },
  preview: {
    host: true, // Allow external access (mobile)
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
