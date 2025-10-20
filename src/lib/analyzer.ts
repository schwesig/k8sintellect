import * as k8s from '@kubernetes/client-node';
import { logger } from './logger';
import { K8sGPTAdapter } from './k8sgpt-adapter';

export interface AnalyzeOptions {
  namespaces?: string[];
  allNamespaces: boolean;
  filters?: string[];
}

export const AVAILABLE_FILTERS = [
  'Pod',
  'Service',
  'Deployment',
  'ReplicaSet',
  'StatefulSet',
  'PersistentVolumeClaim',
  'Ingress',
  'Node',
  'CronJob',
  'Job',
  'HorizontalPodAutoscaler',
  'NetworkPolicy',
  'MutatingWebhookConfiguration',
  'ValidatingWebhookConfiguration',
  'ConfigMap',
  'ClusterExtension',
  'Log',
  'GatewayClass',
  'Gateway',
  'HTTPRoute',
  'Storage',
  'Security',
  'ClusterCatalog',
  'PodDisruptionBudget',
] as const;

export type FilterType = typeof AVAILABLE_FILTERS[number];

export interface Issue {
  kind: string;
  name: string;
  namespace?: string;
  problem: string;
  solution?: string;
  severity: 'critical' | 'warning' | 'info';
}

export interface AnalysisResult {
  timestamp: string;
  cluster: string;
  issues: Issue[];
  summary: {
    total: number;
    critical: number;
    warning: number;
    info: number;
  };
  commands?: string[]; // k8sgpt commands executed
}

export class K8sAnalyzer {
  private kc: k8s.KubeConfig;
  private k8sApi: k8s.CoreV1Api;
  private k8sgptAdapter: K8sGPTAdapter;

  constructor() {
    this.kc = new k8s.KubeConfig();
    this.kc.loadFromDefault();
    this.k8sApi = this.kc.makeApiClient(k8s.CoreV1Api);

    // Initialize k8sgpt adapter (defaults to anonymous mode)
    this.k8sgptAdapter = new K8sGPTAdapter({
      anonymousMode: process.env.K8SGPT_ANONYMOUS_MODE !== 'false',
    });
  }

  async getNamespaces(): Promise<string[]> {
    try {
      const response = await this.k8sApi.listNamespace();
      return response.body.items
        .map(ns => ns.metadata?.name)
        .filter((name): name is string => name !== undefined)
        .sort();
    } catch (error) {
      logger.error('Error getting namespaces:', error);
      return [];
    }
  }

  /**
   * Get current cluster connection information
   */
  getClusterInfo(): { name: string; server?: string; context: string } {
    const currentContext = this.kc.getCurrentContext();
    const cluster = this.kc.getCurrentCluster();

    return {
      name: cluster?.name || currentContext,
      server: cluster?.server,
      context: currentContext,
    };
  }

  /**
   * Get events for a specific pod
   */
  private async getEventsForPod(podName: string, namespace: string): Promise<k8s.CoreV1Event[]> {
    try {
      const response = await this.k8sApi.listNamespacedEvent(
        namespace,
        undefined, // pretty
        undefined, // allowWatchBookmarks
        undefined, // continue
        `involvedObject.name=${podName},involvedObject.kind=Pod` // fieldSelector
      );
      return response.body.items;
    } catch (error) {
      logger.debug(`Failed to get events for pod ${namespace}/${podName}:`, error);
      return [];
    }
  }

  async analyze(options: AnalyzeOptions): Promise<AnalysisResult> {
    logger.info('Analyzing cluster...');

    const filters = options.filters && options.filters.length > 0
      ? options.filters
      : [...AVAILABLE_FILTERS]; // Default: all filters

    logger.info(`Active filters: ${filters.join(', ')}`);

    // Get current context/cluster info
    const currentContext = this.kc.getCurrentContext();
    const cluster = this.kc.getCurrentCluster();

    let allIssues: Issue[] = [];
    const commands: string[] = [];

    // Handle multiple namespaces
    if (options.allNamespaces) {
      // Analyze all namespaces at once
      logger.info('Running k8sgpt analysis for all namespaces...');
      const result = await this.k8sgptAdapter.runK8sGPTAnalysis({
        filters: filters as FilterType[],
        namespace: undefined,
        allNamespaces: true,
      });
      allIssues = result.issues;
      commands.push(result.command);
    } else if (options.namespaces && options.namespaces.length > 0) {
      // Analyze each selected namespace separately
      logger.info(`Running k8sgpt analysis for ${options.namespaces.length} namespace(s): ${options.namespaces.join(', ')}`);
      for (const ns of options.namespaces) {
        const result = await this.k8sgptAdapter.runK8sGPTAnalysis({
          filters: filters as FilterType[],
          namespace: ns,
          allNamespaces: false,
        });
        allIssues.push(...result.issues);
        commands.push(result.command);
      }
    } else {
      // No namespace specified, analyze all namespaces
      logger.info('No namespace specified, analyzing all namespaces...');
      const result = await this.k8sgptAdapter.runK8sGPTAnalysis({
        filters: filters as FilterType[],
        namespace: undefined,
        allNamespaces: true,
      });
      allIssues = result.issues;
      commands.push(result.command);
    }

    const summary = this.summarizeIssues(allIssues);

    return {
      timestamp: new Date().toISOString(),
      cluster: cluster?.name || currentContext,
      issues: allIssues,
      summary,
      commands,
    };
  }

  private async analyzePods(options: AnalyzeOptions): Promise<Issue[]> {
    const issues: Issue[] = [];

    try {
      const namespace = options.namespace || (options.allNamespaces ? undefined : 'default');

      const response = namespace
        ? await this.k8sApi.listNamespacedPod(namespace)
        : await this.k8sApi.listPodForAllNamespaces();

      const pods = response.body.items;

      for (const pod of pods) {
        // Check pod status
        const status = pod.status?.phase;
        const podName = pod.metadata?.name || 'unknown';
        const podNamespace = pod.metadata?.namespace;

        if (status === 'Failed' || status === 'Unknown') {
          issues.push({
            kind: 'Pod',
            name: podName,
            namespace: podNamespace,
            problem: `Pod is in ${status} state`,
            solution: 'Check pod logs and events for more details',
            severity: 'critical',
          });
        }

        // Check for pending pods
        if (status === 'Pending') {
          const conditions = pod.status?.conditions || [];
          const unschedulable = conditions.find(c => c.type === 'PodScheduled' && c.status === 'False');

          if (unschedulable) {
            issues.push({
              kind: 'Pod',
              name: podName,
              namespace: podNamespace,
              problem: `Pod is Pending: ${unschedulable.reason || 'Unknown reason'}`,
              solution: 'Check node resources and pod requirements',
              severity: 'warning',
            });
          }
        }

        // Check container restarts
        const containerStatuses = pod.status?.containerStatuses || [];
        for (const containerStatus of containerStatuses) {
          if (containerStatus.restartCount > 5) {
            issues.push({
              kind: 'Pod',
              name: podName,
              namespace: podNamespace,
              problem: `Container ${containerStatus.name} has ${containerStatus.restartCount} restarts`,
              solution: 'Check container logs and resource limits',
              severity: 'warning',
            });
          }
        }

        // Check pod events for errors and warnings
        if (podNamespace) {
          const events = await this.getEventsForPod(podName, podNamespace);

          // Filter for Warning and Error events from the last hour
          const recentEvents = events.filter(event => {
            if (!event.lastTimestamp) return false;
            const eventTime = new Date(event.lastTimestamp).getTime();
            const oneHourAgo = Date.now() - (60 * 60 * 1000);
            return eventTime > oneHourAgo;
          });

          const errorEvents = recentEvents.filter(event =>
            event.type === 'Warning' || event.type === 'Error'
          );

          // Group events by reason to avoid duplicates
          const uniqueEvents = new Map<string, k8s.CoreV1Event>();
          for (const event of errorEvents) {
            const key = `${event.reason}-${event.message}`;
            if (!uniqueEvents.has(key) ||
                (event.lastTimestamp && uniqueEvents.get(key)?.lastTimestamp &&
                 new Date(event.lastTimestamp) > new Date(uniqueEvents.get(key)!.lastTimestamp!))) {
              uniqueEvents.set(key, event);
            }
          }

          // Add event issues
          for (const event of uniqueEvents.values()) {
            const severity = event.type === 'Error' ? 'critical' : 'warning';
            const reason = event.reason || 'Unknown';
            const message = event.message || 'No details available';

            issues.push({
              kind: 'Pod',
              name: podName,
              namespace: podNamespace,
              problem: `${reason}: ${message}`,
              solution: 'Check pod logs and events for more details',
              severity: severity,
            });
          }
        }
      }
    } catch (error) {
      logger.error('Error analyzing pods:', error);
    }

    return issues;
  }

  private async analyzeServices(options: AnalyzeOptions): Promise<Issue[]> {
    const issues: Issue[] = [];

    try {
      const namespace = options.namespace || (options.allNamespaces ? undefined : 'default');

      const response = namespace
        ? await this.k8sApi.listNamespacedService(namespace)
        : await this.k8sApi.listServiceForAllNamespaces();

      const services = response.body.items;

      for (const service of services) {
        const serviceName = service.metadata?.name || 'unknown';
        const serviceNamespace = service.metadata?.namespace;

        // Check for services without endpoints
        if (service.spec?.type === 'LoadBalancer' && !service.status?.loadBalancer?.ingress) {
          issues.push({
            kind: 'Service',
            name: serviceName,
            namespace: serviceNamespace,
            problem: 'LoadBalancer service has no external IP assigned',
            solution: 'Check LoadBalancer configuration and cloud provider status',
            severity: 'warning',
          });
        }
      }
    } catch (error) {
      logger.error('Error analyzing services:', error);
    }

    return issues;
  }

  private async analyzeDeployments(options: AnalyzeOptions): Promise<Issue[]> {
    const issues: Issue[] = [];

    try {
      const appsApi = this.kc.makeApiClient(k8s.AppsV1Api);
      const namespace = options.namespace || (options.allNamespaces ? undefined : 'default');

      const response = namespace
        ? await appsApi.listNamespacedDeployment(namespace)
        : await appsApi.listDeploymentForAllNamespaces();

      const deployments = response.body.items;

      for (const deployment of deployments) {
        const deploymentName = deployment.metadata?.name || 'unknown';
        const deploymentNamespace = deployment.metadata?.namespace;
        const desiredReplicas = deployment.spec?.replicas || 0;
        const availableReplicas = deployment.status?.availableReplicas || 0;

        // Check if deployment has fewer replicas than desired
        if (availableReplicas < desiredReplicas) {
          issues.push({
            kind: 'Deployment',
            name: deploymentName,
            namespace: deploymentNamespace,
            problem: `Deployment has ${availableReplicas}/${desiredReplicas} replicas available`,
            solution: 'Check pod status and resource availability',
            severity: availableReplicas === 0 ? 'critical' : 'warning',
          });
        }
      }
    } catch (error) {
      logger.error('Error analyzing deployments:', error);
    }

    return issues;
  }

  private summarizeIssues(issues: Issue[]) {
    return {
      total: issues.length,
      critical: issues.filter(i => i.severity === 'critical').length,
      warning: issues.filter(i => i.severity === 'warning').length,
      info: issues.filter(i => i.severity === 'info').length,
    };
  }
}
