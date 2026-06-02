import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        proxy: {
            '/api/alerts': {
                target: 'http://localhost:3001',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/alerts/, '/alerts'),
            },
            '/api/user': {
                target: 'http://localhost:3003',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/user/, '/profile'),
            },
        },
    },
});
//# sourceMappingURL=vite.config.js.map