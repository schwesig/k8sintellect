/**
 * K8sGPT Adapter
 *
 * This module provides integration with k8sgpt functionality.
 * IMPORTANT: Always runs in ANONYMOUS MODE by default.
 * No cluster data is sent to external AI services unless explicitly enabled.
 *
 * Integrates with k8sgpt CLI to leverage its analysis capabilities.
 */

import { Issue, FilterType } from './analyzer';
import { logger } from './logger';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface K8sGPTConfig {
  // Anonymous mode (default: true) - prevents data from being sent to external AI services
  anonymousMode?: boolean;

  // Future: AI provider settings (only used if anonymousMode=false)
  aiProvider?: string;
  apiKey?: string;
  model?: string;
}

export interface K8sGPTResult {
  kind: string;
  name: string;
  error: Array<{
    Text: string;
    KubernetesDoc: string;
    Sensitive: string[];
  }>;
  details: string;
  parentObject: string;
}

export interface K8sGPTOutput {
  provider: string;
  errors: any;
  status: string;
  problems: number;
  results: K8sGPTResult[];
}

export class K8sGPTAdapter {
  private config: K8sGPTConfig;
  private readonly anonymousMode: boolean;

  constructor(config: K8sGPTConfig = {}) {
    // ALWAYS default to anonymous mode for security/privacy
    this.anonymousMode = config.anonymousMode !== false;
    this.config = config;

    if (this.anonymousMode) {
      logger.info('K8sGPT running in ANONYMOUS MODE - no data sent to external services');
    } else {
      logger.warn('K8sGPT anonymous mode DISABLED - external AI services may be used');
    }
  }

  /**
   * Check if anonymous mode is enabled
   */
  isAnonymousMode(): boolean {
    return this.anonymousMode;
  }

  /**
   * Enhance issue analysis with AI-powered insights
   * In anonymous mode: Uses only local rule-based analysis
   * If external AI enabled: Would call k8sgpt API or LLM
   */
  async enhanceIssue(issue: Issue): Promise<Issue> {
    if (!this.anonymousMode && this.config.aiProvider && this.config.apiKey) {
      // TODO: Future implementation - call external AI service
      logger.warn('External AI enhancement requested but not yet implemented');
    }

    // Anonymous mode: return issue as-is (local analysis only)
    return issue;
  }

  /**
   * Get AI-powered recommendations for cluster improvements
   * In anonymous mode: Uses only local rule-based recommendations
   * If external AI enabled: Would use k8sgpt/LLM for enhanced recommendations
   */
  async getRecommendations(issues: Issue[]): Promise<string[]> {
    const recommendations: string[] = [];

    if (!this.anonymousMode && this.config.aiProvider && this.config.apiKey) {
      // TODO: Future implementation - call external AI service for recommendations
      logger.warn('External AI recommendations requested but not yet implemented');
    }

    // Anonymous mode: basic rule-based recommendations (local only)
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;

    if (criticalCount > 0) {
      recommendations.push('Address critical issues immediately to prevent service disruptions');
    }

    if (warningCount > 5) {
      recommendations.push('High number of warnings detected. Consider implementing proactive monitoring');
    }

    const restartIssues = issues.filter(i => i.problem.includes('restart'));
    if (restartIssues.length > 0) {
      recommendations.push('Multiple container restarts detected. Review resource limits and liveness probes');
    }

    return recommendations;
  }

  /**
   * Get k8sgpt version
   */
  async getVersion(): Promise<string> {
    try {
      const { stdout } = await execFileAsync('k8sgpt', ['version'], {
        maxBuffer: 1024 * 1024,
      });

      // Parse version from output: "k8sgpt: 0.4.23 (00c99dc), built at: unknown"
      const match = stdout.match(/k8sgpt:\s+([\d.]+)/);
      if (match) {
        return match[1];
      }

      return 'unknown';
    } catch (error) {
      logger.debug('Could not get k8sgpt version:', error);
      return 'unknown';
    }
  }

  /**
   * Get k8sgpt backend/provider information
   */
  async getBackendInfo(): Promise<{ provider: string; model?: string }> {
    try {
      const { stdout } = await execFileAsync('k8sgpt', ['auth', 'list'], {
        maxBuffer: 1024 * 1024,
      });

      // Parse the output to find active backend
      const lines = stdout.split('\n');
      for (const line of lines) {
        if (line.includes('Active:') || line.includes('Default:') || line.includes('>')) {
          // Extract provider name from output
          const match = line.match(/>\s*(\w+)/);
          if (match) {
            return { provider: match[1] };
          }
        }
      }

      return { provider: 'localai' }; // Default in anonymous mode
    } catch (error) {
      logger.debug('Could not get k8sgpt backend info:', error);
      return { provider: 'localai' }; // Default fallback
    }
  }

  /**
   * Run k8sgpt analyze command and return parsed results
   */
  async runK8sGPTAnalysis(options: {
    filters?: FilterType[];
    namespace?: string;
    allNamespaces?: boolean;
  }): Promise<{ issues: Issue[]; command: string }> {
    try {
      const args = ['analyze', '--output=json'];

      // Add filters
      if (options.filters && options.filters.length > 0) {
        args.push(`--filter=${options.filters.join(',')}`);
      }

      // Add namespace option
      // Note: k8sgpt analyzes all namespaces by default when no namespace is specified
      if (options.namespace) {
        args.push(`--namespace=${options.namespace}`);
      }
      // If allNamespaces is true and no namespace specified, k8sgpt will scan all namespaces by default

      // Anonymous mode is automatic in k8sgpt when no backend is configured
      const command = `k8sgpt ${args.join(' ')}`;
      logger.debug(`Running k8sgpt: ${command}`);

      const { stdout, stderr } = await execFileAsync('k8sgpt', args, {
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large outputs
      });

      if (stderr) {
        logger.debug('k8sgpt stderr:', stderr);
      }

      // Parse k8sgpt JSON output
      const k8sgptOutput: K8sGPTOutput = JSON.parse(stdout);

      // Convert k8sgpt results to our Issue format
      return {
        issues: this.convertK8sGPTToIssues(k8sgptOutput),
        command: command
      };
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        logger.error('k8sgpt command not found. Please install k8sgpt: https://github.com/k8sgpt-ai/k8sgpt');
        throw new Error('k8sgpt is not installed. Please install it to use this tool.');
      }
      logger.error('Failed to run k8sgpt analysis:', error);
      throw error;
    }
  }

  /**
   * Convert k8sgpt output to our Issue format
   */
  private convertK8sGPTToIssues(output: K8sGPTOutput): Issue[] {
    const issues: Issue[] = [];

    // Check if results exist and is an array
    if (!output.results || !Array.isArray(output.results)) {
      logger.debug('No results found in k8sgpt output or results is not an array');
      return issues;
    }

    for (const result of output.results) {
      // Parse namespace/name from k8sgpt format: "namespace/name"
      const [namespace, name] = result.name.includes('/')
        ? result.name.split('/')
        : [undefined, result.name];

      // Check if error array exists
      if (!result.error || !Array.isArray(result.error)) {
        continue;
      }

      // Convert each error to an issue
      for (const error of result.error) {
        issues.push({
          kind: result.kind,
          name: name || result.name,
          namespace,
          problem: error.Text,
          solution: error.KubernetesDoc || 'Check k8sgpt documentation for more details',
          severity: this.determineSeverity(error.Text),
        });
      }
    }

    return issues;
  }

  /**
   * Determine severity based on error text
   */
  private determineSeverity(errorText: string): 'critical' | 'warning' | 'info' {
    const lowerText = errorText.toLowerCase();

    // Critical keywords
    if (
      lowerText.includes('crash') ||
      lowerText.includes('failed') ||
      lowerText.includes('error') ||
      lowerText.includes('deadline exceeded') ||
      lowerText.includes('oomkilled')
    ) {
      return 'critical';
    }

    // Warning keywords
    if (
      lowerText.includes('warning') ||
      lowerText.includes('pending') ||
      lowerText.includes('unschedulable')
    ) {
      return 'warning';
    }

    // Default to info
    return 'info';
  }
}
