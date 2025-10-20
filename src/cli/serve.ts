import { startServer } from '../server';
import { logger } from '../lib/logger';

interface ServeOptions {
  port: string;
  host: string;
}

export async function serve(options: ServeOptions) {
  try {
    const port = parseInt(options.port, 10);
    await startServer(port, options.host);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}
