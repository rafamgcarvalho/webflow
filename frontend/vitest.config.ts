import { defineConfig } from 'vitest/config';

// Configuração dedicada aos testes unitários dos módulos puros em src/services.
// Ambiente padrão 'node' (rápido, sem APIs de navegador); testes que precisam de
// DOMParser/File usam o comentário `// @vitest-environment jsdom` no topo do arquivo.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary'],
      include: ['src/services/**/*.ts'],
      exclude: ['src/services/**/*.{test,spec}.ts'],
    },
  },
});
