import { config, describeStartupConfig } from './config/env.js';
import { closeStore, initStore } from './store/index.js';
import { initKnowledgeBase } from './rag/knowledgeBase.js';
import { createApp } from './app.js';

async function main() {
  await initStore();
  const knowledge = await initKnowledgeBase();

  const server = createApp().listen(config.port, () => {
    console.log('\n  Hiring Studio API');
    for (const line of describeStartupConfig()) console.log(`  ${line}`);
    console.log(`  knowledge    : ${knowledge.documentCount} documents, ${knowledge.chunkCount} chunks`);
    console.log(`  listening    : http://localhost:${config.port}\n`);

    if (!config.gemini.enabled) {
      console.log('  No GEMINI_API_KEY found. Hiring kits will be generated from local templates');
      console.log('  and labelled as offline. Add a free key from https://aistudio.google.com/apikey');
      console.log('  to server/.env and restart for real Gemini generation.\n');
    }
  });

  const shutdown = async () => {
    server.close();
    await closeStore();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('Failed to start the server:', error);
  process.exit(1);
});
