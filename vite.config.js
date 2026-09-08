import { defineConfig } from 'vite';
import astro from '@astrojs/netlify'; // o el adapter que uses

export default defineConfig({
    server: {
        allowedHosts: true
    }
});