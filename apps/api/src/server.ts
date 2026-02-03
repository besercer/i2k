import { buildApp } from './app';
import { env } from './config/env';
import { connectDatabase } from '@i2k/database';

async function start() {
  try {
    // Connect to database
    await connectDatabase();
    console.log('✅ Database connected');

    // Build and start the app
    const app = await buildApp();

    await app.listen({
      port: env.PORT,
      host: env.HOST
    });

    console.log(`🚀 Server running at http://${env.HOST}:${env.PORT}`);

    if (env.ENABLE_SWAGGER) {
      console.log(`📚 API docs at http://${env.HOST}:${env.PORT}/docs`);
    }
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

start();
