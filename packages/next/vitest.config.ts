import { defineConfig } from 'vitest/config';

import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      // `import 'server-only'` throws outside a React Server Component bundle;
      // alias it to a no-op stub so server-only modules can be unit-tested.
      'server-only': fileURLToPath(
        new URL('./vitest/server-only-stub.ts', import.meta.url),
      ),
    },
  },
});
