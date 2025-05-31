import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Set the frontend development server port
    proxy: {
      '/api': 'http://localhost:3001', // Proxy API requests to the backend server
    },
  },
});
