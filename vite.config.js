import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, 'index.html'),
        wordSearch: resolve(import.meta.dirname, 'games/word-search/index.html'),
        memory: resolve(import.meta.dirname, 'games/memory/index.html'),
        vocabQuiz: resolve(import.meta.dirname, 'games/vocab-quiz/index.html'),
        buchstabensalat: resolve(import.meta.dirname, 'games/buchstabensalat/index.html')
      }
    }
  }
});
