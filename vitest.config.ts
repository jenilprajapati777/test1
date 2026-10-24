import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    workspace: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.{ts,tsx}'],
          environment: 'jsdom',
          setupFiles: ['./tests/unit/setup.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'sql',
          include: ['tests/sql/**/*.test.ts'],
          environment: 'node',
        },
      },
    ],
  },
});
