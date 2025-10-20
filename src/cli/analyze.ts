import { K8sAnalyzer } from '../lib/analyzer';
import { logger } from '../lib/logger';

interface AnalyzeOptions {
  namespace?: string;
  output: string;
  allNamespaces: boolean;
  filter?: string;
}

export async function analyze(options: AnalyzeOptions) {
  try {
    logger.info('Starting cluster analysis...');

    const analyzer = new K8sAnalyzer();

    // Parse filters if provided
    const filters = options.filter
      ? options.filter.split(',').map(f => f.trim())
      : undefined;

    const result = await analyzer.analyze({
      namespace: options.namespace,
      allNamespaces: options.allNamespaces,
      filters,
    });

    // Format output based on requested format
    switch (options.output) {
      case 'json':
        console.log(JSON.stringify(result, null, 2));
        break;
      case 'yaml':
        // TODO: Implement YAML output
        logger.warn('YAML output not yet implemented, falling back to text');
        printTextOutput(result);
        break;
      default:
        printTextOutput(result);
    }

    logger.info('Analysis complete');
  } catch (error) {
    logger.error('Analysis failed:', error);
    process.exit(1);
  }
}

function printTextOutput(result: any) {
  console.log('\n=== Cluster Analysis Results ===\n');

  if (result.issues && result.issues.length > 0) {
    console.log(`Found ${result.issues.length} issue(s):\n`);
    result.issues.forEach((issue: any, index: number) => {
      console.log(`${index + 1}. ${issue.kind}: ${issue.name}`);
      console.log(`   Namespace: ${issue.namespace || 'N/A'}`);
      console.log(`   Problem: ${issue.problem}`);
      if (issue.solution) {
        console.log(`   Solution: ${issue.solution}`);
      }
      console.log('');
    });
  } else {
    console.log('No issues found. Cluster appears healthy!');
  }
}
