import { initDb } from './services/db';

async function run() {
  try {
    await initDb();
    console.log('==================================================');
    console.log('✅ Database initialization script executed successfully.');
    console.log('==================================================');
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Database initialization script failed:', err.message);
    process.exit(1);
  }
}

run();
