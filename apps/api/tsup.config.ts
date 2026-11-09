import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    server: 'src/server.ts',
    deploy: 'src/db/deploy.ts',
    'jobs/retention': 'src/jobs/retention.ts',
  },
  format: ['esm'],
  platform: 'node',
  target: 'node20',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  // Bundle the workspace package (it ships TypeScript source); keep real npm deps external.
  noExternal: ['@sajag/shared'],
});
