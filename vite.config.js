import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/CabinUp1/', // ton dépôt GitHub (⚠️ à respecter à la lettre)
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        catalogue: resolve(__dirname, 'pages/catalogue.html'),
        detail: resolve(__dirname, 'pages/detail.html'),
        panier: resolve(__dirname, 'pages/panier.html'),
        notfound: resolve(__dirname, 'pages/404.html'),
      },
    },
  },
})
