import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ command }) => {
  const isDev = command === 'serve';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        src: path.resolve(__dirname, 'src'),
      },
    },
    // Proxy sólo habilitado en el dev server local
    server: isDev
      ? {
          proxy: {
            '/api': {
              target: 'http://localhost:3000',
              changeOrigin: true,
              secure: false,
            },
          },
        }
      : undefined,
  };
});
