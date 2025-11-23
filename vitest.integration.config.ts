import { defineConfig } from 'vitest/config';
import path from 'path';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => ({
    test: {
        name: 'integration',
        include: ['tests/integration/**/*.test.ts'],
        exclude: ['tests/integration/setup.ts'],
        globals: true,
        environment: 'node',
        testTimeout: 30000, // 30s for database operations
        hookTimeout: 30000,
        // Run tests sequentially to avoid database conflicts
        pool: 'forks',
        env: loadEnv(mode, process.cwd(), ''),
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
}));
