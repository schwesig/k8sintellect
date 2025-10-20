import express, { Express, Request, Response } from 'express';
import { logger } from '../lib/logger';
import { K8sAnalyzer } from '../lib/analyzer';

export async function startServer(port: number, host: string): Promise<void> {
  const app: Express = express();

  app.use(express.json());

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Anonymous mode status endpoint
  app.get('/api/status', async (_req: Request, res: Response) => {
    try {
      const anonymousMode = process.env.K8SGPT_ANONYMOUS_MODE !== 'false';

      // Get k8sgpt backend information and version
      const { K8sGPTAdapter } = require('../lib/k8sgpt-adapter');
      const adapter = new K8sGPTAdapter();
      const backendInfo = await adapter.getBackendInfo();
      const k8sgptVersion = await adapter.getVersion();

      // Get cluster information
      const analyzer = new K8sAnalyzer();
      const clusterInfo = analyzer.getClusterInfo();

      res.json({
        anonymousMode,
        backend: backendInfo,
        cluster: clusterInfo,
        k8sgptVersion,
        version: '0.1.0',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to get status:', error);
      // Fallback response
      const anonymousMode = process.env.K8SGPT_ANONYMOUS_MODE !== 'false';
      res.json({
        anonymousMode,
        backend: { provider: 'unknown' },
        cluster: { name: 'unknown', context: 'unknown' },
        k8sgptVersion: 'unknown',
        version: '0.1.0',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Get available filters endpoint
  app.get('/api/filters', (_req: Request, res: Response) => {
    const { AVAILABLE_FILTERS } = require('../lib/analyzer');
    res.json({ filters: AVAILABLE_FILTERS });
  });

  // Get available namespaces endpoint
  app.get('/api/namespaces', async (_req: Request, res: Response) => {
    try {
      const analyzer = new K8sAnalyzer();
      const namespaces = await analyzer.getNamespaces();
      res.json({ namespaces });
    } catch (error) {
      logger.error('Failed to get namespaces:', error);
      res.status(500).json({
        error: 'Failed to get namespaces',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // API endpoints
  app.get('/api/analyze', async (req: Request, res: Response) => {
    try {
      const { namespace, namespaces, allNamespaces, filters } = req.query;

      const analyzer = new K8sAnalyzer();

      // Parse filters from query string
      let filterList: string[] | undefined;
      if (filters) {
        filterList = typeof filters === 'string' ? filters.split(',') : filters as string[];
      }

      // Parse namespaces (support both single and multiple)
      let namespaceList: string[] | undefined;
      if (namespaces && typeof namespaces === 'string') {
        namespaceList = namespaces.split(',').map(ns => ns.trim()).filter(ns => ns.length > 0);
      } else if (namespace && typeof namespace === 'string') {
        namespaceList = [namespace];
      }

      const result = await analyzer.analyze({
        namespaces: namespaceList,
        allNamespaces: allNamespaces === 'true',
        filters: filterList,
      });

      res.json(result);
    } catch (error) {
      logger.error('Analysis failed:', error);
      res.status(500).json({
        error: 'Analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Serve PatternFly CSS
  app.use('/patternfly', express.static('node_modules/@patternfly/patternfly'));

  // Serve static files for dashboard
  app.use(express.static('public'));

  // Fallback to index.html for SPA routing
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile('index.html', { root: 'public' }, (err: Error | null) => {
      if (err) {
        res.status(404).send('Dashboard not yet implemented. Use /api/analyze endpoint.');
      }
    });
  });

  app.listen(port, host, () => {
    logger.info(`Server running at http://${host}:${port}`);
    logger.info(`API available at http://${host}:${port}/api/analyze`);
  });
}

// Start server if this file is executed directly
if (require.main === module) {
  const port = parseInt(process.env.SERVER_PORT || '3000', 10);
  const host = process.env.SERVER_HOST || 'localhost';
  startServer(port, host);
}
