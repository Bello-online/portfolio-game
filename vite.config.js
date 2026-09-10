import { defineConfig } from 'vite';

// Served from https://bello-online.github.io/portfolio-game/ on GitHub Pages,
// so built asset URLs need the repo name as a prefix. Local dev stays at "/".
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/portfolio-game/' : '/',
  server: { port: 5180, strictPort: true },
  build: { target: 'es2020' },
}));
