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
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "document",
            handler: "NetworkFirst",
            options: { cacheName: "pages", networkTimeoutSeconds: 30 },
          },
          {
            urlPattern: ({ request, url }) =>
              url.origin === self.location.origin &&
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
        manualChunks: (id) => {
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/")
          ) {
            return "vendor-react";
          }
          if (
            id.includes("node_modules/jspdf/") ||
            id.includes("node_modules/jspdf-autotable/") ||
            id.includes("node_modules/@react-pdf/")
          ) {
            return "vendor-pdf";
          }
          if (id.includes("node_modules/recharts/")) {
            return "vendor-charts";
          }
          if (id.includes("node_modules/xlsx/")) {
            return "vendor-xlsx";
          }
          if (id.includes("node_modules/react-router-dom/")) {
            return "vendor-router";
          }
          if (
            id.includes("node_modules/react-select/") ||
            id.includes("node_modules/react-toastify/") ||
            id.includes("node_modules/react-helmet-async/")
          ) {
            return "vendor-ui";
          }
          if (id.includes("node_modules/react-datepicker/")) {
            return "vendor-datepicker";
          }
          if (id.includes("node_modules/react-easy-crop/")) {
            return "vendor-crop";
          }
          if (
            id.includes("node_modules/react-slick/") ||
            id.includes("node_modules/slick-carousel/")
          ) {
            return "vendor-carousel";
          }
          if (id.includes("node_modules/qrcode/")) {
            return "vendor-qrcode";
          }
          if (id.includes("node_modules/")) {
            const match = id.match(/node_modules\/([^/]+)/);
            if (match) {
              const pkg = match[1];
              if (
                [
                  "axios",
                  "moment",
                  "socket.io-client",
                  "prop-types",
                  "web-vitals",
                  "react-error-boundary",
                  "react-icons",
                ].includes(pkg)
              ) {
                return "vendor-utils";
              }
              return `vendor-${pkg}`;
            }
            return "vendor-misc";
          }
        },
        chunkFileNames: "assets/[name]-[hash].js",
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    host: true,
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
    allowedHosts: true,
  },
  preview: {
    host: true,
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
