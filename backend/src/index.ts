import { env } from './config/env.js';
import { connectDatabase } from './config/db.js';
import { createServer } from './server.js';

async function main() {
  await connectDatabase();
  const app = createServer();
  app.listen(env.PORT, () => {
    console.log(`[http] WebFlow API rodando em http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
